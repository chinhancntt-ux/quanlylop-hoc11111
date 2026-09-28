/**
 * BeeClass – Backend Google Apps Script (lưu dữ liệu vào Google Sheet)
 *
 * CÁCH DÙNG: xem file HUONG_DAN_GOOGLE_SHEET.md
 *
 * Cấu trúc:
 *  - Sheet "Data"    : kho lưu trữ chính (key | part | total | value | updatedAt).
 *                      Dữ liệu JSON dài được cắt nhỏ thành nhiều dòng (giới hạn 50.000 ký tự/ô).
 *  - Sheet "HocSinh" : bảng xem nhanh danh sách học sinh (tự cập nhật, chỉ để đọc).
 *  - Sheet "LopHoc"  : bảng xem nhanh danh sách lớp (tự cập nhật, chỉ để đọc).
 */

var DATA_SHEET = 'Data';
var CHUNK_SIZE = 40000;

/* ---------- Điểm vào (Web App) ---------- */

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (!checkToken_(p.token)) return json_({ ok: false, error: 'Sai mã bảo vệ (token)' });

  if (p.action === 'ping') return json_({ ok: true, pong: true });

  // Mặc định: tải toàn bộ dữ liệu
  var rows = readRows_();
  return json_({ ok: true, data: rowsToMap_(rows) });
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'Dữ liệu gửi lên không hợp lệ' });
  }
  if (!checkToken_(body.token)) return json_({ ok: false, error: 'Sai mã bảo vệ (token)' });

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var set = body.set || {};
    var del = body.del || [];
    var touched = {};
    Object.keys(set).forEach(function (k) { touched[k] = true; });
    del.forEach(function (k) { touched[k] = true; });

    // Giữ lại các dòng của key không bị thay đổi
    var kept = readRows_().filter(function (r) { return !touched[r[0]]; });

    var now = new Date().toISOString();
    var added = [];
    Object.keys(set).forEach(function (key) {
      var value = String(set[key]);
      var total = Math.max(1, Math.ceil(value.length / CHUNK_SIZE));
      for (var i = 0; i < total; i++) {
        added.push([key, i, total, value.substr(i * CHUNK_SIZE, CHUNK_SIZE), now]);
      }
    });

    var all = kept.concat(added);
    writeRows_(all);
    refreshViews_(rowsToMap_(all), touched);

    return json_({ ok: true, saved: Object.keys(set).length, deleted: del.length });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* ---------- Bảo mật ---------- */

function checkToken_(token) {
  var expected = PropertiesService.getScriptProperties().getProperty('TOKEN');
  return !!expected && token === expected;
}

/** Chạy hàm này 1 lần trong trình soạn thảo để đặt mã bảo vệ (đổi giá trị bên dưới trước khi chạy). */
function setupToken() {
  var TOKEN = 'DOI-MA-BAO-VE-CUA-BAN-O-DAY';
  if (TOKEN.indexOf('DOI-MA') === 0) throw new Error('Hãy sửa biến TOKEN thành mã bí mật của bạn rồi chạy lại.');
  PropertiesService.getScriptProperties().setProperty('TOKEN', TOKEN);
  getDataSheet_(); // tạo sẵn sheet Data
}

/* ---------- Đọc / ghi sheet Data ---------- */

function getDataSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(DATA_SHEET);
  if (!sh) {
    sh = ss.insertSheet(DATA_SHEET);
    sh.getRange(1, 1, 1, 5).setValues([['key', 'part', 'total', 'value', 'updatedAt']]).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.getRange('A:E').setNumberFormat('@'); // luôn là văn bản, tránh Sheets tự đổi kiểu
  }
  return sh;
}

function readRows_() {
  var sh = getDataSheet_();
  var last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, 5).getValues().filter(function (r) { return r[0] !== ''; });
}

function writeRows_(rows) {
  var sh = getDataSheet_();
  var last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, 5).clearContent();
  if (rows.length === 0) return;
  var range = sh.getRange(2, 1, rows.length, 5);
  range.setNumberFormat('@');
  range.setValues(rows.map(function (r) {
    return [String(r[0]), String(r[1]), String(r[2]), String(r[3]), String(r[4])];
  }));
}

function rowsToMap_(rows) {
  var groups = {};
  rows.forEach(function (r) {
    (groups[r[0]] = groups[r[0]] || []).push(r);
  });
  var out = {};
  Object.keys(groups).forEach(function (key) {
    var parts = groups[key].sort(function (a, b) { return Number(a[1]) - Number(b[1]); });
    out[key] = parts.map(function (p) { return p[3]; }).join('');
  });
  return out;
}

/* ---------- Bảng xem nhanh (chỉ đọc) ---------- */

function refreshViews_(map, touched) {
  var prefix = 'vuon_uoc_mo_classroom_v2_';
  try {
    if (touched[prefix + 'students'] || touched[prefix + 'classes']) {
      var classes = safeParse_(map[prefix + 'classes'], []);
      var students = safeParse_(map[prefix + 'students'], []);
      var classNameById = {};
      classes.forEach(function (c) { classNameById[c.id] = c.name; });

      writeView_('LopHoc',
        ['Tên lớp', 'Mã lớp', 'Khối', 'GVCN', 'Phòng', 'Sĩ số', 'Trạng thái'],
        classes.map(function (c) {
          return [c.name, c.code, c.grade, c.teacher, c.room, c.currentStudents, c.status];
        }));

      writeView_('HocSinh',
        ['Mã HS', 'Họ tên', 'Giới tính', 'Ngày sinh', 'Lớp', 'Nhóm', 'Số sao', 'Chuyên cần (%)', 'Trạng thái', 'Phụ huynh', 'SĐT phụ huynh'],
        students.map(function (s) {
          var cls = (s.classIds || []).map(function (id) { return classNameById[id] || id; }).join(', ');
          return [s.code, s.name, s.gender, s.dob || '', cls, s.group || '', s.stars, s.attendanceRate, s.status, s.parentName || '', s.parentPhone || ''];
        }));
    }
  } catch (err) {
    // Bảng xem nhanh lỗi không được làm hỏng việc lưu dữ liệu chính
    console.error(err);
  }
}

function writeView_(name, headers, rows) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  sh.clear();
  sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#fef3c7');
  sh.setFrozenRows(1);
  if (rows.length) {
    sh.getRange(2, 1, rows.length, headers.length).setNumberFormat('@').setValues(rows);
  }
}

/* ---------- Tiện ích ---------- */

function safeParse_(s, fallback) {
  try { return s ? JSON.parse(s) : fallback; } catch (e) { return fallback; }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
