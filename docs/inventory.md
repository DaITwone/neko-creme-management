# Tồn kho nguyên liệu

## Sử dụng

1. Mở **Tồn kho & HSD** trong sidebar; trên điện thoại bấm **Menu**.
2. Danh mục có 84 dòng từ `CHI PHÍ!A3:G86`. Tồn ban đầu bằng 0. Tổng định mức mua tháng là **66.976.000₫**, không phải giá trị tồn.
3. **Nhập hàng**: chọn nguyên liệu, lượng và giá theo quy cách mua; thêm nhiều dòng nếu cần. Xác nhận tạo từng lô và giao dịch nhập.
4. **Xuất kho**: xem trước lô theo FEFO (hạn gần nhất), rồi FIFO cho lô không hạn. Chọn mục đích sử dụng, hủy, trả NCC hoặc điều chỉnh. Không xuất vượt tồn.
5. **Kiểm kho**: để trống cho hàng chưa kiểm; nhập 0 cho hàng đã hết. Lưu nháp để tiếp tục sau. Xác nhận tạo điều chỉnh và phiếu kiểm; số liệu được tính lại theo tồn lúc xác nhận.
6. Bấm tên hàng để xem drawer: tổng quan, lô, lịch sử, kiểm kho. Trong lô, **Sửa / xóa hạn sử dụng** cho phép bỏ ngày, yêu cầu lý do và xác nhận.
7. Thiết lập ngưỡng trong **Tác vụ khác → Thiết lập tồn tối thiểu**. Lọc nhóm không yêu cầu chọn danh mục con; tìm được cả tiếng Việt không dấu.
8. **Cảnh báo & đề xuất** cho phép chỉnh lượng dự kiến. Lưu phiếu chưa thay đổi tồn; mở phiếu và xác nhận nhập mới tạo giao dịch. Phiếu đã nhập không thể nhập lại.
9. **Tác vụ khác → Xuất CSV** xuất danh sách đang lọc để mở trong Excel. **Xuất bản sao JSON** giữ cả lô, giao dịch, kiểm kho, dự kiến và audit. Nhập JSON kiểm tra dữ liệu, ghép ID và dừng nếu xung đột lịch sử. Không hỗ trợ nhập CSV/XLSX trực tiếp trên UI.

## Nguồn và quy ước

- File người dùng cung cấp thực tế: `Finance & Asset.xlsx` (tài liệu yêu cầu ghi `(2)`). Chỉ đọc sheet CHI PHÍ, không nhập tài sản/thiết bị.
- `scripts/extract-inventory.ps1` đọc OpenXML bằng .NET, không cần Excel hay thư viện bổ sung. Ví dụ trên Windows:

  ```powershell
  powershell -ExecutionPolicy Bypass -File scripts/extract-inventory.ps1 -Path 'C:\path\Finance & Asset.xlsx'
  ```

- `inventorySource.json` giữ tên, hãng, quy cách, giá, lượng tháng, tổng gốc và số dòng. `inventorySeed.js` phân nhóm nghiệp vụ riêng với NCC và giữ `sourceGroup` (điền xuống nhóm trong ô gộp).
- Đơn vị tồn là **đơn vị mua**. Ví dụ 2 đơn vị kem quy cách 6L tương ứng 12L; giá 328.000₫ là giá mỗi hộp 6L. `conversionRate/contentUnit` chỉ cung cấp quy đổi tham khảo, không tự đổi giá/định mức. Có thể theo dõi lượng lẻ. Khi đã có lô, khóa sửa đơn vị và quy cách để tránh sai lịch sử.
- Nhóm được rà theo từng dòng. Đường/muối/bột rau câu thuộc nguyên liệu làm bánh; cốt dừa và kem béo thuộc sữa; bánh ốc quế thuộc topping. Có thể chỉnh nhóm và NCC.
- Ngưỡng tối thiểu/đặt hàng mặc định 0, người dùng tự thiết lập. Sắp hết khi `0 < tồn <= điểm đặt hàng`.
- Hạn được lưu ISO UTC theo ngày; so sánh theo ngày Việt Nam. Hết hạn hôm nay được đưa vào cảnh báo 7 ngày; hết hạn khi đã qua ngày đó. Chỉ cảnh báo lô còn tồn.
- Kiểm tăng: tạo lô điều chỉnh không có hạn, dùng giá vốn bình quân hiện tại hoặc giá danh mục nếu chưa có tồn. Kiểm giảm: trừ FEFO/FIFO và tính chênh lệch giá trị theo giá vốn lô thực tế. Form hiển thị giá trị ước tính trước xác nhận.
- Cảnh báo lâu chưa kiểm: quá 30 ngày hoặc chưa từng kiểm. Cảnh báo tăng giá: giá lô mới cao hơn 20% so với lô trước.
- `COUNT` là sự kiện kiểm (không cộng thêm tồn); chỉ `ADJUST_IN/OUT` điều chỉnh. Sửa metadata/HSD được ghi trong audit riêng, không giả tạo giao dịch thay đổi số lượng.

## Kiến trúc và giới hạn

- React/Vite/Tailwind; ứng dụng chuyển trang bằng state trong `App.jsx`, không có router/backend. Giữ layout màu nâu/kem và thêm nút menu mobile cần thiết trong `Layout.jsx`.
- `TonKho.jsx` điều phối UI; `components/inventory/` chứa các phần giao diện; `services/inventory*` tách repository, tính toán, validation, import/export và kiểu dữ liệu.
- Một khóa `my-store.inventory.v1` chứa toàn bộ snapshot để ghi các sổ cùng một lần. Chỉ seed khi chưa có dữ liệu; đọc lỗi không xóa hoặc seed lại. Hỗ trợ chuyển từ bốn khóa `.items/.batches/.transactions/.counts.v1` khi đủ dữ liệu hợp lệ.
- Mỗi lệnh sửa bản sao, validate, lưu thành công rồi mới cập nhật UI. Lỗi quota không làm UI báo lưu thành công. So sánh snapshot để phát hiện tab cũ; tác vụ **Tải lại dữ liệu kho** đọc lại bản mới. localStorage không phải cơ sở dữ liệu nhiều người dùng, không bảo đảm giao dịch đồng thời giữa nhiều tab tại đúng cùng thời điểm.
- Dữ liệu chỉ nằm trên trình duyệt, không đồng bộ thiết bị; xuất backup thường xuyên. Không có tài khoản, danh tính người thao tác do nhập tự nguyện. Không tự đặt hàng ngoài ứng dụng.
- Không xóa giao dịch. Ngừng theo dõi yêu cầu tồn bằng 0; vẫn xem được lịch sử và bật lại.
- Dùng bảng desktop cuộn trong vùng riêng và card mobile. Dialog native hỗ trợ Escape, modal focus và trả focus. Dùng CSS bars cho phân tích, không thêm chart library.

## Kiểm thử

```powershell
node --test tests/inventory.test.js
npm.cmd run build
npm.cmd run lint
```

Kiểm thử trình duyệt dùng Chrome headless và DevTools protocol, không cài dependency. Chạy `npm.cmd run dev -- --host 127.0.0.1` rồi `node scripts/check-inventory-browser.mjs`. Có thể đặt `CHROME_PATH` nếu Chrome ở vị trí khác. Script dùng profile tạm riêng, không sửa dữ liệu trình duyệt làm việc; ảnh desktop/mobile nằm trong thư mục tạm được in ra.

Các trường hợp đã kiểm: 84 dòng và tổng tiền; chưa nhập; nhiều lô; FEFO/FIFO; xuất từng phần/qua nhiều lô/vượt tồn; hạn hôm nay/7/30 ngày; kiểm tăng/giảm/nháp; xóa hạn; tìm không dấu/lọc nhóm; reload; dữ liệu hỏng; lỗi quota; tab cũ; merge backup; hủy/trả; phiếu dự kiến. Chrome kiểm thao tác thật trên desktop 1440px và mobile 390px, menu, Escape, focus modal và console ứng dụng.
