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
│   │   ├── components/      # TaskInput, TaskItem, TaskList, FilterBar, StatsBar, Navbar
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