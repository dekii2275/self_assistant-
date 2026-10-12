# 🚀 Hướng Dẫn Triển Khai Miễn Phí 100% (Vercel + Render + Neon)

Tài liệu này hướng dẫn bạn đưa toàn bộ ứng dụng **OtterTodo (Self Assistant)** lên môi trường Cloud hoạt động 24/7 hoàn toàn **MIỄN PHÍ**.

---

## 🏗️ Kiến Trúc Hệ Thống (Phương án A)
* **Frontend (React + Vite)**: Triển khai trên **[Vercel.com](https://vercel.com)** (Tốc độ tải cực nhanh, HTTPS miễn phí, CDN toàn cầu).
* **Backend (FastAPI)**: Triển khai trên **[Render.com](https://render.com)** (Web Service miễn phí).
* **Database (PostgreSQL)**: Sử dụng **[Neon.tech](https://neon.tech)** (PostgreSQL Cloud miễn phí vĩnh viễn, cực kỳ ổn định).

---

## 📌 Bước 1: Tạo Database PostgreSQL Miễn Phí Trên Neon.tech (1 phút)

1. Truy cập: **[https://neon.tech](https://neon.tech)** và đăng ký/đăng nhập bằng tài khoản **GitHub**.
2. Bấm **Create a Project**:
   - Project name: `self-assistant-db` (hoặc tên tuỳ thích).
   - Region: Chọn vùng gần bạn nhất (ví dụ: `Singapore / ap-southeast-1`).
3. Sau khi tạo xong, màn hình sẽ hiển thị mục **Connection Details**:
   - Chọn dropdown **Connection string** (Postgres).
   - Sao chép toàn bộ chuỗi kết nối dạng:
     ```text
     postgresql://neondb_owner:xxxxxx@ep-xyz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
     ```
   *(Lưu lại chuỗi này để dùng ở Bước 2).*

---

## 📌 Bước 2: Triển Khai Backend Lên Render.com (3 phút)

1. Truy cập: **[https://render.com](https://render.com)** và đăng nhập bằng tài khoản **GitHub**.
2. Ở trang Dashboard, bấm nút **New +** ở góc trên cùng bên phải -> chọn **Web Service**.
3. Chọn kho lưu trữ GitHub của bạn: `dekii2275/self_assistant-` (Bấm *Connect*).
4. Điền các thông tin cấu hình như sau:
   - **Name**: `self-assistant-backend` (hoặc tên bạn thích).
   - **Region**: `Singapore` (để cùng khu vực với Database cho tốc độ nhanh nhất).
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Chọn **Free** ($0/month).
5. Kéo xuống mục **Environment Variables** (Biến môi trường), bấm **Add Environment Variable**:
   - Key: `DATABASE_URL`
   - Value: *(Dán chuỗi kết nối bạn vừa copy từ Neon ở Bước 1 vào đây)*.
6. Bấm **Deploy Web Service** (hoặc *Create Web Service*).
7. Đợi khoảng 1-2 phút để Render build xong. Khi xuất hiện chữ **Live**, bạn hãy sao chép URL của backend (ví dụ: `https://self-assistant-backend.onrender.com`).
   - Kiểm tra nhanh bằng cách mở link: `https://self-assistant-backend.onrender.com/docs` -> Nếu thấy giao diện Swagger UI là backend đã chạy thành công!

---

## 📌 Bước 3: Triển Khai Frontend Lên Vercel.com (2 phút)

1. Truy cập: **[https://vercel.com](https://vercel.com)** và đăng nhập bằng tài khoản **GitHub**.
2. Bấm **Add New...** -> chọn **Project**.
3. Tìm kho lưu trữ `self_assistant-` và bấm **Import**.
4. Ở phần **Configure Project**:
   - **Project Name**: `self-assistant` (hoặc tên bạn muốn).
   - **Framework Preset**: Chọn `Vite`.
   - **Root Directory**: Bấm nút **Edit** bên cạnh và chọn thư mục `frontend` (rồi bấm *Continue*).
5. Mở rộng mục **Environment Variables** (Biến môi trường), thêm biến sau:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://self-assistant-backend.onrender.com/api/v1` *(Thay bằng URL Render backend của bạn ở Bước 2, nhớ có đuôi `/api/v1`)*.
6. Bấm nút **Deploy**.
7. Vercel sẽ tự động build trong khoảng 30-45 giây. Khi hoàn tất, bạn sẽ nhận được một đường link chính thức (ví dụ: `https://self-assistant.vercel.app`).

---

## 🔄 Cập Nhật Mã Nguồn Sau Này
Từ giờ trở đi, bất kỳ khi nào bạn push code mới lên GitHub (`git push origin main`):
* **Vercel** sẽ tự động build và cập nhật Frontend mới ngay lập tức.
* **Render** sẽ tự động build lại Backend mới mà bạn không cần phải thao tác thủ công.
