# ✈️ Secure Travel Booking System — Backend

A secure, full-featured travel booking REST API built with Django and Django REST Framework. The backend powers the **SafeNest** travel booking platform, providing JWT-based authentication, multi-factor authentication, role-based access control, AI-assisted search and listing creation, and a complete booking + payment workflow.

This project was developed as a final-semester capstone with a strong focus on **secure software engineering practices**.

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Security Features](#-security-features)
- [Project Structure](#-project-structure)
- [Installation & Setup](#️-installation--setup)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [User Roles](#-user-roles)
- [Security Audits](#-security-audits)
- [Git Branching Strategy](#-git-branching-strategy)
- [License](#-license)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Language** | Python 3.11+ |
| **Framework** | Django 6.0, Django REST Framework 3.17 |
| **Authentication** | SimpleJWT (JWT) + Email OTP + TOTP (Authenticator App) |
| **Database** | PostgreSQL |
| **AI Integration** | Google Gemini (`google-generativeai`) |
| **Security Tools** | `bandit`, `pip-audit`, `django-axes`, `django-ratelimit`, `django-csp` |
| **Other** | `pyotp`, `qrcode`, `cryptography`, `python-dotenv` |

---

## 🔒 Security Features

This project implements a defence-in-depth security model:

- **JWT Authentication** with access/refresh tokens, rotation, and blacklisting
- **Multi-Factor Authentication (MFA)**
  - Email-based OTP
  - TOTP via authenticator app (Google Authenticator, Authy, etc.) with QR-code setup
- **Role-Based Access Control (RBAC)** — Admin, Customer, Travel Agent
- **Password Hashing** with Django's PBKDF2 + strong validators (min length, common-password and numeric-password checks)
- **SQL Injection Prevention** via the Django ORM
- **XSS / Clickjacking Protection** — `X-Frame-Options: DENY`, `Content-Type-Options: nosniff`, browser XSS filter
- **Content Security Policy (CSP)** configured via `django-csp`
- **Rate Limiting** via `django-ratelimit` and `django-axes` (brute-force lockout)
- **CORS Configuration** for the React frontend (whitelisted origins only)
- **Audit Logging** middleware records security-relevant requests
- **Secure Cookies** — `HttpOnly`, `SameSite=Lax`, ready for `Secure=True` in production
- **Static Security Analysis** — Bandit and pip-audit reports included

---

## 📁 Project Structure

```
secure-travel-booking/
├── config/                  # Django project settings, URLs, WSGI/ASGI
│   ├── settings.py
│   └── urls.py
├── apps/
│   ├── users/               # Custom user model, JWT auth, MFA, RBAC
│   │   ├── models.py        # Custom User (email-based login, roles)
│   │   ├── otp.py           # Email OTP logic
│   │   ├── totp_helper.py   # TOTP authenticator-app helpers
│   │   ├── permissions.py   # Role-based permission classes
│   │   └── views.py
│   ├── listings/            # Travel packages, hotels, flights
│   │   ├── models.py        # Listing model (with price-comparison fields)
│   │   ├── ai_views.py      # AI search, recommendations, chatbot, autofill
│   │   └── ai_urls.py
│   ├── bookings/            # Booking creation, cancellation, admin views
│   ├── payments/            # Mock payment processing & refunds
│   ├── reviews/             # Listing reviews & ratings
│   ├── audit/               # Security headers + request logging middleware
│   └── tests/               # Security test suite
├── fixtures/                # Sample data fixtures
├── listings_data.json       # Seed listings
├── bandit_report.html       # Static security scan output
├── bandit_report.txt
├── pip_audit_report.txt     # Dependency vulnerability scan
├── requirements.txt
├── manage.py
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites

- Python 3.11 or higher
- PostgreSQL 13+
- `pip` and `virtualenv`
- (Optional) A Google Gemini API key for the AI features

### 1. Clone the Repository

```bash
git clone https://github.com/vumikashrestha1-creator/secure-travel-booking.git
cd secure-travel-booking
```

### 2. Create & Activate a Virtual Environment

**Windows**
```bash
python -m venv venv
venv\Scripts\activate
```

**macOS / Linux**
```bash
python -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the project root — see [Environment Variables](#-environment-variables) below.

### 5. Set Up the PostgreSQL Database

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

### 7. Create a Superuser

```bash
python manage.py createsuperuser
```

### 8. (Optional) Load Sample Listings

```bash
python manage.py loaddata listings_data.json
```

### 9. Run the Development Server

```bash
python manage.py runserver
```

The API will be available at:
- **API root:** `http://127.0.0.1:8000/api/`
- **Admin panel:** `http://127.0.0.1:8000/admin/`

---

## 🔐 Environment Variables

Create a `.env` file in the project root with the following keys:

```dotenv
# ── Django Core ─────────────────────────────────────
SECRET_KEY=your-very-long-random-django-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# ── PostgreSQL ──────────────────────────────────────
DB_NAME=travel_booking_db
DB_USER=travel_admin
DB_PASSWORD=your-db-password
DB_HOST=localhost
DB_PORT=5432

# ── Email (used for OTP delivery) ───────────────────
EMAIL_HOST_USER=your-gmail@gmail.com
EMAIL_HOST_PASSWORD=your-gmail-app-password
DEFAULT_FROM_EMAIL=your-gmail@gmail.com

# ── Third-party APIs ────────────────────────────────
GEMINI_API_KEY=your-google-gemini-api-key
AVIATIONSTACK_API_KEY=your-aviationstack-key
API_NINJAS_KEY=your-api-ninjas-key
```

> ⚠️ **Never commit `.env` to GitHub.** It is already in `.gitignore`.

---

## 🔗 API Endpoints

Base URL: `http://127.0.0.1:8000`

### Authentication & MFA — `/api/users/`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/register/` | Register a new user | Public |
| POST | `/login/` | Login (email + password) | Public |
| POST | `/logout/` | Logout & blacklist refresh token | Required |
| POST | `/token/refresh/` | Refresh JWT access token | Public |
| POST | `/verify-otp/` | Verify email OTP | Public |
| POST | `/resend-otp/` | Resend email OTP | Public |
| POST | `/toggle-mfa/` | Enable/disable email MFA | Required |
| POST | `/setup-totp/` | Generate TOTP secret & QR code | Required |
| POST | `/confirm-totp/` | Confirm TOTP setup with first code | Required |
| POST | `/disable-totp/` | Disable TOTP authenticator | Required |
| GET / PUT | `/profile/` | View / update own profile | Required |
| POST | `/change-password/` | Change password | Required |

### Admin User Management — `/api/users/admin/`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/users/` | List all users | Admin |
| POST | `/users/create/` | Create user with any role | Admin |
| DELETE | `/users/<id>/` | Delete user | Admin |
| PATCH | `/users/<id>/role/` | Update user role | Admin |
| POST | `/users/<id>/reset-password/` | Reset a user's password | Admin |
| POST | `/users/<id>/disable-mfa/` | Disable MFA for a user | Admin |

### Listings — `/api/listings/`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/` | List/search all listings | Public |
| GET | `/<id>/` | Listing detail | Public |
| POST | `/create/` | Create a listing | Agent / Admin |
| PUT | `/<id>/edit/` | Edit a listing | Agent / Admin |
| GET / PUT | `/<id>/manage/` | Manage a listing | Agent / Admin |
| GET | `/<id>/availability/` | Check availability | Public |
| GET | `/pending/` | List pending listings | Manager / Admin |
| POST | `/<id>/approve/` | Approve a pending listing | Manager / Admin |
| POST | `/<id>/reject/` | Reject a pending listing | Manager / Admin |

### AI Features — `/api/ai/`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/search/` | Smart natural-language search | Public |
| POST | `/recommend/` | Personalised AI recommendations | Required |
| POST | `/chat/` | AI travel chatbot | Public |
| POST | `/autofill/` | AI autofill for new listings | Agent / Admin |

### Bookings — `/api/bookings/`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/create/` | Create a booking | Customer |
| GET | `/my-bookings/` | View my bookings | Customer |
| GET | `/<id>/` | Booking detail | Owner / Admin |
| POST | `/<id>/cancel/` | Cancel a booking | Owner / Admin |
| POST | `/admin/create-for-user/` | Create booking for a user | Admin / Agent |
| GET | `/admin/all/` | All bookings | Admin |
| PATCH | `/admin/<id>/update/` | Update a booking | Admin |

### Payments — `/api/payments/`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/pay/` | Initiate (mock) payment | Customer |
| GET | `/my-payments/` | View my payments | Customer |
| GET | `/<id>/` | Payment detail | Owner / Admin |
| GET | `/admin/all/` | All payments | Admin |
| POST | `/admin/<id>/refund/` | Issue refund | Admin |

### Reviews — `/api/reviews/`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/create/` | Create a review | Customer |
| GET | `/listing/<listing_id>/` | Reviews for a listing | Public |
| GET | `/my-reviews/` | My reviews | Customer |
| DELETE | `/<id>/delete/` | Delete a review | Owner / Admin |
| GET | `/admin/all/` | All reviews | Admin |

---

## 👥 User Roles

The system supports three distinct roles, each with its own permissions:

| Role | Capabilities |
|---|---|
| **Customer** | Browse listings, book trips, make payments, leave reviews, manage own profile |
| **Travel Agent** | All customer actions + create/edit listings (subject to manager approval), view own listings, AI autofill |
| **Admin** | Full system access — manage users, approve listings, view all bookings/payments, issue refunds, disable MFA, etc. |

---

## 🛡️ Security Audits

Two pre-generated security reports ship with the repo:

- **`bandit_report.html` / `bandit_report.txt`** — Static analysis of Python source for common security issues
- **`pip_audit_report.txt`** — Known-vulnerability scan of the dependency tree

Re-run them at any time:

```bash
bandit -r apps/ config/ -f html -o bandit_report.html
pip-audit -r requirements.txt > pip_audit_report.txt
```

---

## 🌿 Git Branching Strategy

```
main          ← stable, production-ready code
develop       ← integration branch
feature/*     ← individual feature branches (e.g. feature/ai-search)
fix/*         ← bug-fix branches
```

Pull requests target `develop`; `develop` is merged into `main` for releases.

---

## 📄 License

This project was developed as a final-year academic capstone. All third-party dependencies retain their original licenses (see `requirements.txt`).

---

## 🙋 Author

**Vumika Shrestha**
GitHub: [@vumikashrestha1-creator](https://github.com/vumikashrestha1-creator)