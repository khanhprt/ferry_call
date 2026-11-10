# Lái Đò Tri Thức

Ứng dụng chọn ngẫu nhiên học sinh theo chủ đề chuyến đò, xây dựng bằng Vite và Tailwind CSS.

## Chạy dự án

```bash
npm install
npm run dev
```

Mở địa chỉ Vite hiển thị trong terminal. Chạy `npm run build` để tạo bản production và `npm run preview` để xem bản build.

Danh sách lớp, trạng thái có mặt và ảnh học sinh được lưu trong trình duyệt trên thiết bị hiện tại. Có thể dán danh sách, mỗi dòng một học sinh; nhấn avatar để thêm ảnh hoặc tải nhiều ảnh có tên trùng với học sinh. Trong chuyến đò, chọn “Cho bạn nghỉ, chờ tiếp” để loại học sinh vừa chọn khỏi lượt tiếp theo.

## Nhân vật và chuyển động

Bộ học sinh nằm tại `public/students/classmates.png`: 4 cột nhân vật, 3 hàng tư thế (ngồi, chân trái bước, chân phải bước). Cùng một học sinh giữ nguyên kiểu tóc khi chuyển từ áo phao trên thuyền sang đồng phục đi lên bến. Tài liệu tạo ảnh nằm trong `public/students/ASSETS.md`.

`src/students.js` xử lý các khung hình, bố trí chỗ ngồi so le và đường đi qua mũi thuyền, bậc bến rồi ra khỏi cảnh. Những tư thế trong atlas được căn theo chân để tránh nhảy vị trí khi đổi khung hình.

Thuyền dùng hai PNG riêng tại `public/boat/rear.png` và `public/boat/front.png`, được tạo bằng công cụ tạo ảnh tích hợp. Prompt của cả hai ảnh được lưu trong `public/boat/generation.json`. Lớp sau chứa lòng thuyền và ghế, lớp trước chỉ chứa mạn gần với phần miệng thuyền trong suốt. `src/boat.js` ghép theo thứ tự lớp sau → giáo viên và học sinh → mạn trước. Tất cả dùng chung tọa độ trong khung thuyền, nên nhân vật giữ đúng vị trí khi thuyền nghiêng và di chuyển. Chuyển động ngồi có ba kiểu nhẹ, với chu kỳ và thời điểm khác nhau cho từng bạn; tùy chọn giảm chuyển động của hệ điều hành sẽ tắt các chuyển động phụ này.

## Nước và thời tiết

`src/weather.js` điều khiển các giai đoạn trời quang, mây kéo đến, bão, mưa tan và trời sáng lại theo tiến độ chuyến đò. Dòng nước gồm hai lớp SVG chảy độc lập và một vệt nước chuyển động cùng đáy thuyền. Mưa xiên và các vòng nước ở tiền cảnh được vẽ bằng Canvas, tự căn lại theo kích thước màn hình. Sóng nhỏ ở hai đầu thuyền và đợt sóng cuộn lớn chỉ xuất hiện trong bão.

Ba PNG được tạo bằng công cụ tạo ảnh tích hợp nằm tại `public/weather/wave-curl.png`, `public/weather/wave-splash.png` và `public/weather/clouds.png`; prompt được lưu trong `public/weather/generation.json`. `src/weather-audio.js` tạo tiếng mưa và sấm bằng Web Audio, có độ trễ nhẹ sau tia chớp. Nút âm thanh điều khiển cả tiếng mưa và sấm. Khi dừng hoặc mở chuyến mới, hiệu ứng, âm thanh và bộ vẽ của chuyến cũ đều được dọn dẹp. Chế độ giảm chuyển động tắt chớp lóe và làm chậm nước, sóng, mưa.

Sóng bão hiện dùng atlas mới `public/weather/wave-cycle.png`, gồm bốn hình trong lưới 2×2: dâng lên, cuộn cao, vỡ và tan thành bọt. `src/storm-waves.js` điều khiển ba đợt sóng lệch nhịp, chuyển hình và tăng độ nhô theo tiếng sấm; sóng trở về bọt rồi rút đi khi trời quang. Atlas `public/weather/jumping-fish.png` có cá vàng và cá xanh, mỗi loài có tư thế nhảy lên và lao xuống. `src/river-life.js` điều khiển đường nhảy vòng cung, giọt nước và vòng gợn ở điểm rơi; chim bay xa xuất hiện khi bão tan. Prompt của hai atlas được lưu trong `public/weather/river-life-generation.json`. Tiếng nước bắn và sấm đều theo nút âm thanh. Giảm chuyển động sẽ giữ hình sóng tĩnh và tắt cá nhảy, nước bắn, chim vỗ cánh và chớp lóe.

Các đợt sóng được lên lịch ngẫu nhiên riêng cho từng chuyến, có khoảng nghỉ giữa các lần xuất hiện. Mỗi đợt sống khoảng 1,25–1,9 giây, chọn vị trí, hướng và kích thước riêng; sóng thường rộng 20–27% cảnh, đợt lớn rộng 32–37%. Hiệu ứng co giãn, nghiêng nhẹ và rút xuống bám theo vòng đời của từng đợt, thay vì lặp liên tục một nhóm sóng cố định.

## Giáo viên chèo đò

Màn chính có hai lựa chọn bằng hình ảnh “Cô” và “Thầy” ngay trên danh sách học sinh. Lựa chọn được lưu trên thiết bị và áp dụng cho chuyến tiếp theo; đổi giáo viên không làm mất tên đang nhập. `src/teacher-picker.js` dùng chân dung cắt từ chính bộ nhân vật để giữ cùng phong cách với cảnh chèo đò.

`public/teachers/female-states.png` và `male-states.png` có sáu tư thế trong lưới 2×3: hai nhịp chèo có nón, bất ngờ khi bay nón, chèo trong bão không nón, vẫy tay và cười vui. `public/teachers/flying-hat.png` là nón rời. Cả ba ảnh được tạo bằng công cụ tích hợp; prompt nằm trong `public/teachers/generation.json`.

`src/teacher.js` giữ chung tọa độ chân giữa các tư thế, đổi nhịp chèo và điều khiển nón bay ra rồi quay về theo thời tiết. Khi tìm ra học sinh còn trên đò, giáo viên chuyển sang tư thế cười vui. Tất cả được hủy khi dừng chuyến; chế độ giảm chuyển động giữ các tư thế nhưng tắt đường bay và rung lắc phụ.

## Bến chỉ xuất hiện lúc cập bến

`public/scene/river-open.png` là nền sông không có cầu, bậc thang hay cột cờ của bến. Lớp PNG trong suốt `public/scene/dock.png` chứa riêng toàn bộ bến và cột cờ ở cùng tọa độ với ảnh gốc. Cả hai ảnh được tạo bằng công cụ tích hợp, với prompt lưu tại `public/scene/generation.json`.

`src/harbor.js` giữ thuyền giữa phần màn hình đang nhìn thấy trong hành trình, kể cả khi cảnh bị cắt theo tỷ lệ cửa sổ. Trong 10% cuối chuyến đi, bến hiện dần từ bên phải và thuyền dịch về vị trí lên bờ. Học sinh chỉ rời chỗ sau khi đã cập bến. Lớp bến nằm trên dòng nước phía xa để nước không phủ lên mặt cầu và bậc thang. Khi chơi lại, bến lại ẩn và thuyền trở về giữa dòng.

## Học sinh ngủ quên và tỉnh dậy

`public/students/finale.png` là atlas trong suốt gồm bốn nhân vật cùng kiểu tóc với bộ học sinh ban đầu. Ba hàng lần lượt là ngủ gật trong áo phao, dụi mắt tỉnh dậy và đứng trả lời trong đồng phục. Prompt đầy đủ và bố cục ảnh được lưu tại `public/students/finale-generation.json`.

Sau khi cập bến, học sinh cuối cùng ngủ gật trong lúc các bạn còn lại lên bờ. `src/finale.js` đổi tư thế ngay trên nhân vật đang ngồi, giữ mạn thuyền che đúng phần chân. Khi giáo viên gọi, nền dịu tối, quầng sáng vàng và các đốm sáng tập trung quanh học sinh; tên luôn hiện kể cả khi đã ẩn tên trong chuyến đi. Sau khoảng 1,45 giây ngủ gật, nhân vật dụi mắt, rồi đứng trả lời “Dạ… em dậy rồi ạ!” trước khi hiện bảng kết quả. Chế độ giảm chuyển động giữ các tư thế và ánh sáng nhưng bỏ rung, nhún và nhấp nháy. Dừng chuyến sẽ hủy toàn bộ đoạn gọi tên đang chạy.

Chạy `npm test` để kiểm tra bằng Google Chrome đã cài trên máy. Playwright sẽ tự khởi động Vite tại cổng 5180 nếu cần, kiểm tra đủ 36 học sinh, chuyển tư thế, đi lên bờ, lựa chọn giáo viên, chuỗi ngủ–tỉnh dậy cho cả nam và nữ, điều khiển tên/dừng/lượt mới và tỷ lệ cảnh trên điện thoại.
