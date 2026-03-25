# ✈️ Secure Travel Booking System

A full-stack secure travel booking web application built as a final semester capstone project.

## 👩‍💻 Built By
**Vumika Shrestha**
Final Semester Capstone Project — 2026

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, Django, Django REST Framework |
| Authentication | JWT (SimpleJWT) + MFA |
| Database | PostgreSQL |
| Payments | Stripe API + Mock Payment |
| Frontend | React + Vite + Axios |
| Security | AES-256, Rate Limiting, RBAC, Audit Logging |
| Version Control | Git + GitHub |

---

## 🔒 Security Features

- JWT Authentication with token blacklisting
- Multi-Factor Authentication (MFA)
- Role-Based Access Control (Admin, Customer, Travel Agent)
- AES-256 field encryption for sensitive data
- Password hashing (PBKDF2)
- SQL Injection prevention via Django ORM
- XSS protection via secure headers
- Rate limiting and DDoS protection
- Audit logging and activity monitoring
- CORS configuration

---

## 📁 Project Structure
```
secure-travel-booking/
├── config/          # Django project settings and URLs
├── users/           # Custom user model, JWT auth, roles
├── bookings/        # Booking management
├── listings/        # Travel packages and listings
├── payments/        # Payment processing
├── .env             # Environment variables (not on GitHub)
├── manage.py
└── requirements.txt
```

---

## ⚙️ How to Run This Project Locally

### 1. Clone the Repository
```bash
git clone https://github.com/vumikashrestha1-creator/secure-travel-booking.git
cd secure-travel-booking
```

### 2. Create Virtual Environment
```bash
virtualenv venv
venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Create `.env` File
Create a `.env` file in the project root with these values:
```
SECRET_KEY=your-django-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=travel_booking_db
DB_USER=travel_admin
DB_PASSWORD=your-db-password
DB_HOST=localhost
DB_PORT=5432
```

### 5. Setup PostgreSQL Database
```bash
psql -U postgres
```
```sql
CREATE DATABASE travel_booking_db;
CREATE USER travel_admin WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE travel_booking_db TO travel_admin;
\c travel_booking_db
GRANT ALL ON SCHEMA public TO travel_admin;
ALTER SCHEMA public OWNER TO travel_admin;
\q
```

### 6. Run Migrations
```bash
python manage.py migrate
```

### 7. Create Superuser
```bash
python manage.py createsuperuser
```

### 8. Start the Server
```bash
python manage.py runserver
```

Visit: http://127.0.0.1:8000/admin/

---

## 🔗 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | /api/auth/register/ | Register new user | No |
| POST | /api/auth/login/ | Login with email/password | No |
| POST | /api/auth/logout/ | Logout and blacklist token | Yes |
| GET | /api/auth/profile/ | View profile | Yes |
| PUT | /api/auth/profile/ | Update profile | Yes |
| POST | /api/auth/change-password/ | Change password | Yes |

### Listings
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | /api/listings/ | Browse all listings | No |
| GET | /api/listings/?search=Bali | Search listings | No |
| GET | /api/listings/<id>/ | View listing detail | No |
| POST | /api/listings/create/ | Create listing | Agent/Admin |

### Bookings
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | /api/bookings/create/ | Create booking | Yes |
| GET | /api/bookings/my-bookings/ | View my bookings | Yes |
| POST | /api/bookings/<id>/cancel/ | Cancel booking | Yes |
| GET | /api/bookings/all/ | View all bookings | Admin only |

### Payments
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | /api/payments/mock-pay/ | Make mock payment | Yes |
| GET | /api/payments/my-payments/ | View my payments | Yes |
| GET | /api/payments/all/ | View all payments | Admin only |

---

## 🌿 Git Branching Strategy
```
main          ← stable, production-ready code
develop       ← integration branch
feature/*     ← individual feature branches
```

---

## 📸 Screenshots
*(Add screenshots of your running application here)*

---

## 📄 License
This project is for educational purposes only.