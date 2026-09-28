import * as XLSX from 'xlsx';
import { Student } from '../types';

export interface ParsedStudentRow {
  name: string;
  gender: 'Nam' | 'Nữ';
  dob?: string;
  group?: string;
  phone?: string;
  parentName?: string;
  parentPhone?: string;
}

/**
 * Tải về file Excel mẫu chuẩn cho giáo viên nhập danh sách học sinh
 */
export const downloadStudentTemplateExcel = () => {
  const headers = [
    'STT',
    'Họ và tên',
    'Giới tính',
    'Ngày sinh',
    'Số điện thoại',
    'Họ tên phụ huynh',
    'SĐT phụ huynh',
  ];

  const sampleRows = [
    [1, 'Nguyễn Văn An', 'Nam', '15/03/2014', '0912345678', 'Nguyễn Văn Thành', '0987654321'],
    [2, 'Trần Thị Bảo Ngọc', 'Nữ', '22/07/2014', '0923456789', 'Lê Thị Mai', '0976543210'],
    [3, 'Lê Hoàng Nam', 'Nam', '10/11/2014', '0934567890', 'Lê Văn Hùng', '0965432109'],
    [4, 'Phạm Minh Thư', 'Nữ', '05/02/2014', '0945678901', 'Trần Thị Hương', '0954321098'],
  ];

  const worksheetData = [headers, ...sampleRows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 24 }, // Họ và tên
    { wch: 12 }, // Giới tính
    { wch: 14 }, // Ngày sinh
    { wch: 16 }, // SĐT
    { wch: 22 }, // Họ tên phụ huynh
    { wch: 16 }, // SĐT phụ huynh
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách học sinh');

  XLSX.writeFile(workbook, 'Mau_Danh_Sach_Hoc_Sinh.xlsx');
};

/**
 * Xuất danh sách học sinh của một lớp học ra file Excel
 */
export const exportClassStudentsToExcel = (className: string, students: Student[]) => {
  const headers = [
    'STT',
    'Mã HS',
    'Họ và tên',
    'Giới tính',
    'Ngày sinh',
    'Số sao thưởng',
    'Chuyên cần (%)',
    'Số điện thoại',
    'Họ tên phụ huynh',
    'SĐT phụ huynh',
  ];

  const rows = students.map((stu, index) => [
    index + 1,
    stu.code,
    stu.name,
    stu.gender,
    stu.dob || '',
    stu.stars,
    `${stu.attendanceRate}%`,
    stu.phone || '',
    stu.parentName || '',
    stu.parentPhone || '',
  ]);

  const worksheetData = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 24 },
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 22 },
    { wch: 16 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Học sinh');

  const safeClassName = className.replace(/[/\\?%*:|"<>]/g, '-');
  XLSX.writeFile(workbook, `Danh_Sach_${safeClassName}.xlsx`);
};

/**
 * Đọc và phân tích file Excel / CSV tải lên từ giáo viên
 */
export const parseStudentExcel = (file: File): Promise<ParsedStudentRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error('Không đọc được nội dung tệp tin');
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('Tệp Excel không chứa trang tính (sheet) nào');
        }

        const worksheet = workbook.Sheets[firstSheetName];
        // Convert to 2D array
        const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!rawRows || rawRows.length === 0) {
          throw new Error('Tệp tin không có dữ liệu');
        }

        // Find header row (the first row containing keywords like "tên" or "họ")
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
          const rowStr = rawRows[i].map((c) => String(c).toLowerCase()).join(' ');
          if (rowStr.includes('tên') || rowStr.includes('name') || rowStr.includes('họ')) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          // If no obvious header found, assume row 0 is header
          headerRowIndex = 0;
        }

        const headers = rawRows[headerRowIndex].map((h) =>
          String(h).trim().toLowerCase()
        );

        // Column indexes
        const findColIndex = (keywords: string[]): number => {
          for (let i = 0; i < headers.length; i++) {
            const h = headers[i];
            if (keywords.some((k) => h.includes(k))) {
              return i;
            }
          }
          return -1;
        };

        const nameIndex = findColIndex(['họ và tên', 'họ tên', 'tên học sinh', 'tên', 'name', 'full name']);
        const genderIndex = findColIndex(['giới tính', 'giới', 'gender', 'phái', 'sex']);
        const dobIndex = findColIndex(['ngày sinh', 'dob', 'sinh nhật', 'birth']);
        const groupIndex = findColIndex(['tổ', 'nhóm', 'group', 'team']);
        const phoneIndex = findColIndex(['sđt học sinh', 'số điện thoại hs', 'điện thoại hs', 'sđt', 'phone']);
        const parentNameIndex = findColIndex(['họ tên phụ huynh', 'tên phụ huynh', 'phụ huynh', 'bố mẹ', 'parent']);
        const parentPhoneIndex = findColIndex(['sđt phụ huynh', 'điện thoại phụ huynh', 'sđt ph', 'sdt ph']);

        const results: ParsedStudentRow[] = [];

        for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0) continue;

          let rawName = '';
          if (nameIndex !== -1 && row[nameIndex] !== undefined) {
            rawName = String(row[nameIndex]).trim();
          } else {
            // Check if column 1 or 2 has text
            for (let c = 0; c < row.length; c++) {
              const val = String(row[c]).trim();
              if (val.length > 2 && isNaN(Number(val))) {
                rawName = val;
                break;
              }
            }
          }

          // Skip empty names or labels
          if (!rawName || rawName.toLowerCase().includes('tổng số') || rawName.toLowerCase().includes('stt')) {
            continue;
          }

          // Parse gender
          let gender: 'Nam' | 'Nữ' = 'Nam';
          if (genderIndex !== -1 && row[genderIndex]) {
            const gVal = String(row[genderIndex]).trim().toLowerCase();
            if (gVal === 'nữ' || gVal === 'nu' || gVal === 'female' || gVal === 'f' || gVal === 'gái') {
              gender = 'Nữ';
            }
          }

          // Parse group
          let group = 'Tổ 1';
          if (groupIndex !== -1 && row[groupIndex]) {
            const grVal = String(row[groupIndex]).trim();
            if (grVal) {
              if (grVal.startsWith('Tổ') || grVal.startsWith('Nhóm')) {
                group = grVal;
              } else if (!isNaN(Number(grVal))) {
                group = `Tổ ${grVal}`;
              } else {
                group = grVal;
              }
            }
          }

          // Parse DOB
          let dob = '';
          if (dobIndex !== -1 && row[dobIndex]) {
            const rawDob = row[dobIndex];
            if (typeof rawDob === 'number') {
              // Excel serial date number
              const dateObj = XLSX.SSF.parse_date_code(rawDob);
              if (dateObj) {
                dob = `${dateObj.y}-${String(dateObj.m).padStart(2, '0')}-${String(dateObj.d).padStart(2, '0')}`;
              }
            } else {
              dob = String(rawDob).trim();
            }
          }

          // Parse phone
          let phone = '';
          if (phoneIndex !== -1 && row[phoneIndex]) {
            phone = String(row[phoneIndex]).trim();
          }

          // Parse parent name
          let parentName = '';
          if (parentNameIndex !== -1 && row[parentNameIndex]) {
            parentName = String(row[parentNameIndex]).trim();
          }

          // Parse parent phone
          let parentPhone = '';
          if (parentPhoneIndex !== -1 && row[parentPhoneIndex]) {
            parentPhone = String(row[parentPhoneIndex]).trim();
          }

          results.push({
            name: rawName,
            gender,
            group,
            dob: dob || undefined,
            phone: phone || undefined,
            parentName: parentName || undefined,
            parentPhone: parentPhone || undefined,
          });
        }

        resolve(results);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error('Không thể đọc file'));
    };

    reader.readAsBinaryString(file);
  });
};
