# Chuyển dữ liệu BeeClass sang Google Sheet (qua Google Apps Script)

## Vì sao trước đây không lưu được?
App cũ lưu mọi thứ vào `localStorage` của trình duyệt → mỗi máy/trình duyệt có dữ liệu riêng, Vercel không hề có nơi lưu.
Bản mới vẫn dùng `localStorage` làm bộ nhớ đệm, nhưng **tự đồng bộ lên Google Sheet** và **tải về khi mở app**.

## Bước 1 – Tạo Google Sheet + Apps Script
1. Vào https://sheets.google.com → tạo bảng tính trống, đặt tên `BeeClass Data`.
2. Menu **Tiện ích mở rộng → Apps Script**.
3. Xoá code mặc định, dán toàn bộ file `google-apps-script/Code.gs` vào. Bấm **Lưu**.
4. Trong `Code.gs`, tìm hàm `setupToken`, đổi dòng
   `var TOKEN = 'DOI-MA-BAO-VE-CUA-BAN-O-DAY';` thành mã bí mật của bạn (ví dụ `bee-2026-xK9pQ`).
5. Chọn hàm **setupToken** ở thanh trên → bấm **Chạy** → cấp quyền khi Google hỏi
   (Nâng cao → Đi tới … (không an toàn) → Cho phép).
6. Bấm **Triển khai → Tùy chọn triển khai mới**:
   - Loại: **Ứng dụng web**
   - Thực thi dưới tên: **Tôi**
   - Ai có quyền truy cập: **Bất kỳ ai**
   → **Triển khai** → sao chép **URL ứng dụng web** (kết thúc bằng `/exec`).

> Mỗi lần sửa `Code.gs` sau này: **Triển khai → Quản lý bản triển khai → ✏️ → Phiên bản mới → Triển khai** (URL giữ nguyên).

## Bước 2 – Cấu hình Vercel
Vercel → Project → **Settings → Environment Variables**, thêm 2 biến:

| Tên | Giá trị |
|---|---|
| `VITE_GAS_URL` | URL `/exec` vừa sao chép |
| `VITE_GAS_TOKEN` | đúng mã bí mật ở bước 1.4 |

Sau đó **Deployments → Redeploy** (biến môi trường chỉ có hiệu lực khi build lại).

Chạy thử trên máy: copy `.env.example` thành `.env.local`, điền 2 giá trị, `npm install`, `npm run dev`.

## Bước 3 – Đẩy code lên GitHub
Chép các file mới/sửa vào repo rồi `git push`; Vercel tự build:
- `src/utils/cloudSync.ts` (mới) · `src/components/SyncBadge.tsx` (mới) · `src/vite-env.d.ts` (mới)
- `src/main.tsx` (sửa) · `.env.example` (sửa) · `google-apps-script/Code.gs` (tham khảo)

## Cách hoạt động
- Mở app: tải dữ liệu từ sheet **Data** về. Nếu sheet còn trống, dữ liệu đang có trong máy sẽ được **chuyển lên** (nên hãy mở bản cũ trên đúng trình duyệt đang có dữ liệu để chuyển lần đầu).
- Mỗi thay đổi được đẩy lên sau ~1,5 giây. Góc phải dưới có nhãn trạng thái (đang lưu / đã lưu / lỗi – bấm “Thử lại”).
- Mất mạng hoặc lỡ đóng tab: thay đổi được nhớ lại và đẩy lên ở lần mở sau.
- Sheet **HocSinh**, **LopHoc** là bảng xem nhanh (chỉ đọc, sửa ở đó KHÔNG đồng bộ ngược). Dữ liệu thật nằm ở sheet **Data**, đừng sửa/xoá.

## Lưu ý
- **Nhiều thiết bị cùng lúc:** app chỉ tải dữ liệu lúc mở, ai lưu sau thì ghi đè. Nên dùng 1 thiết bị tại 1 thời điểm và tải lại trang trước khi sửa.
- **Bảo mật:** URL + token nằm trong mã web nên không phải bí mật tuyệt đối; đừng chia sẻ link app công khai nếu có thông tin học sinh nhạy cảm. Có thể bật bảo vệ mật khẩu cho dự án Vercel.
- **Ảnh nền/banner:** ảnh lưu dạng base64 làm dữ liệu nặng, lưu chậm. Nên dùng ảnh nhỏ (app đã có nén ảnh).
- Giới hạn Google: ~6 phút/lần chạy script, 20.000 lần gọi/ngày (tài khoản thường) – dư sức cho 1 lớp học.
