# Self Assistant - To-Do Core & Personal Assistant

Hệ thống quản lý công việc và trợ lý cá nhân (Personal Assistant) được xây dựng với kiến trúc module hóa:
- **Backend**: FastAPI (Python 3.11) + SQLAlchemy Async + Pydantic v2
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons
- **Database**: PostgreSQL 16
- **Deployment**: Đóng gói container với Docker & Docker Compose

---

## 🔌 Cấu hình Port hệ thống (Tránh xung đột cổng)

Để tránh trùng với các port mặc định phổ biến (như 80, 3000, 5173, 5432, 8000), hệ thống đã được map sang các dải port riêng biệt:

| Dịch vụ | Port trên máy chủ (Host) | Port trong container | Mô tả |
| :--- | :---: | :---: | :--- |
| **Frontend (React)** | **`5274`** | `80` (Nginx) | Giao diện người dùng Web |
| **Backend (FastAPI)** | **`8974`** | `8000` (Uvicorn) | REST API & Swagger UI |
| **Database (PostgreSQL)** | **`5974`** | `5432` (Postgres) | Cơ sở dữ liệu quan hệ |

---

## 🚀 Khởi chạy nhanh bằng Docker Compose

### 1. Chuẩn bị môi trường
File `.env` đã được thiết lập sẵn với các port trên. Nếu cần đổi, bạn có thể chỉnh sửa trực tiếp file `.env`.

### 2. Build và khởi động toàn bộ hệ thống
```bash
docker compose up -d --build
```

### 3. Truy cập các dịch vụ:
- 🌐 **Giao diện Web:** [http://localhost:5274](http://localhost:5274)
- 📖 **API Docs (Swagger UI):** [http://localhost:8974/docs](http://localhost:8974/docs)
- 🩺 **Kiểm tra Healthcheck:** [http://localhost:8974/api/v1/health](http://localhost:8974/api/v1/health)

### 4. Dừng hệ thống:
```bash
docker compose down
```

---

## 💻 Chạy thủ công trên môi trường nội bộ (Local Development)

### Backend (FastAPI):
```bash
cd backend
python -m venv .venv
# Kích hoạt venv (Windows: .venv\Scripts\activate, Linux/macOS: source .venv/bin/activate)
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8974 --reload
```

### Frontend (React + Vite):
```bash
cd frontend
npm install
npm run dev
# Mở trình duyệt tại http://localhost:5274
```

---

## 📁 Cấu trúc thư mục

```
self_assistant-/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── api/v1/          # Endpoints (tasks, health)
│   │   ├── core/            # Config, Async DB Engine & Session
│   │   ├── crud/            # CRUD Data operations
│   │   ├── models/          # SQLAlchemy Models (Task, Priority, Status)
│   │   ├── schemas/         # Pydantic validation schemas
│   │   └── main.py          # FastAPI instance, CORS & Lifespan
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/                 # React 19 + TypeScript + Vite
│   ├── src/
│   │   ├── components/      # Sidebar, Header, TaskCard, TaskList, KanbanBoard, QuickAddModal, TaskDetailDrawer
│   │   ├── services/        # Axios API Client
│   │   ├── types/           # TypeScript interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile           # Multi-stage Nginx build
│   ├── nginx.conf
│   └── vite.config.ts       # Cấu hình dev port 5274 & Tailwind CSS
├── docker-compose.yml        # Orchestration PostgreSQL (5974), Backend (8974), Frontend (5274)
├── .env.example
└── README.md
```

---

## 🎯 Lộ trình phát triển (Roadmap)
- [x] **Giai đoạn 1**: Hoàn thiện nền tảng To-Do List core (CRUD, Quick capture, Phân loại P1-P4, Ước tính thời gian, Bộ lọc, Docker).
- [ ] **Giai đoạn 2**: Subtasks & Checklist phân rã công việc.
- [ ] **Giai đoạn 3**: Recurring rules & Smart reminders scheduler.
- [ ] **Giai đoạn 4**: Tích hợp trợ lý AI (NLP Task Parser, Auto-reschedule, Daily Briefing).

### Nhắc việc trước hạn

Khi tạo hoặc sửa nhiệm vụ có hạn chót, chọn nhắc trước **10 phút**, **1 giờ** hoặc **1 ngày**. Lời nhắc xuất hiện trong ứng dụng; nếu bật quyền thông báo, trình duyệt cũng hiển thị thông báo hệ thống. Mỗi hạn chót chỉ được nhắc một lần. Đổi hạn hoặc thời điểm nhắc sẽ đặt lại lần nhắc; nhiệm vụ lặp lại giữ nguyên lựa chọn cho lần kế tiếp.

Ứng dụng cần đang mở để hiển thị lời nhắc trong ứng dụng hoặc thông báo hệ thống. Thông báo hệ thống cần HTTPS hoặc localhost và quyền thông báo của trình duyệt. Email ở phần dưới được backend gửi cả khi đã đóng ứng dụng.

### Nhắc việc qua email

Trong form tạo hoặc sửa nhiệm vụ, chọn hạn chót, thời điểm nhắc, rồi nhập địa chỉ ở ô **Gửi nhắc việc qua email**. Để trống ô này nếu chỉ muốn nhắc trong ứng dụng. Nhiệm vụ lặp lại giữ địa chỉ email cho lần kế tiếp. Backend kiểm tra mỗi 30 giây và gửi email ngay cả khi trình duyệt đã đóng; mỗi lần nhắc chỉ gửi một email thành công. Nếu SMTP tạm lỗi, hệ thống thử lại sau 5 phút (tối đa đến 1 ngày sau hạn chót).

Để bật gửi email khi chạy Docker, sao chép các biến sau vào file `.env` ở thư mục gốc rồi điền thông tin SMTP của bạn. Không commit mật khẩu SMTP vào Git.

```dotenv
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=your-account@example.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-account@example.com
SMTP_SECURITY=starttls
REMINDER_TIMEZONE=Asia/Bangkok
```

Sau khi sửa `.env`, chạy `docker compose up -d --force-recreate backend`. `SMTP_SECURITY` nhận `starttls`, `ssl` (thường cổng 465) hoặc `none` (chỉ nên dùng với SMTP nội bộ). Nếu chưa cấu hình SMTP, vẫn có thể lưu địa chỉ email trong nhiệm vụ nhưng email chỉ bắt đầu được gửi khi backend đã được cấu hình và khởi động lại. Bản cài đặt này dành cho môi trường cá nhân tin cậy vì API hiện chưa có đăng nhập.
