# Airline Reservation System

A full-stack airline reservation system built with Django (backend), Django REST Framework (API), and Next.js (frontend).

---

## Software Requirements

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Python | 3.10+ | Backend runtime |
| Node.js | 18+ | Frontend runtime |
| pip | Latest | Python package manager |
| npm | 9+ | Node.js package manager |
| Git | Latest | Version control |

### Optional Software (for Production)

| Software | Purpose |
|----------|---------|
| PostgreSQL | Production database (instead of SQLite) |
| SQLite | Comes with Python (default dev database) |

---

## Database Overview

### Default Database: SQLite

- **File**: `db.sqlite3` (created automatically)
- **No installation required** - SQLite is included with Python
- **Best for**: Development and testing

### Optional: PostgreSQL

- **Recommended for**: Production deployment
- **Requires**: PostgreSQL 14+ installed on system

---

## Installation & Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd airline-project
```

### Step 2: Create Virtual Environment (Recommended)

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Python Dependencies

```bash
pip install -r requirements.txt
```

Expected output:
```
Installing collected packages: Django, djangorestframework, django-cors-headers, etc.
```

### Step 4: Configure Environment Variables

Create a `.env` file in the project root:

```env
# Security (change this in production!)
SECRET_KEY=your-secret-key-here
DEBUG=True

# Database (optional - leave empty for SQLite)
DATABASE_URL=

# Razorpay Payment Gateway (optional)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

### Step 5: Run Database Migrations

This creates all database tables based on the models:

```bash
python manage.py migrate
```

Expected output:
```
Operations to perform:
  Apply all migrations: admin, auth, api, contenttypes, sessions
Running migrations:
  Applying contenttypes.0001_initial... OK
  Applying auth.0001_initial... OK
  ...
```

### Step 6: Create Superuser (Admin Account)

```bash
python manage.py createsuperuser
```

Follow the prompts:
- Username: admin
- Email: admin@example.com
- Password: (enter a strong password)

### Step 7: Start the Backend Server

```bash
python manage.py runserver
```

The API will be available at: `http://127.0.0.1:8000`

### Step 8: Set Up the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at: `http://localhost:3000`

---

## Database Schema

### Tables Created by Migrations

#### 1. auth_user
Django's built-in user table for authentication.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| username | VARCHAR | Unique username |
| email | VARCHAR | User email |
| password | VARCHAR | Hashed password |
| is_staff | BOOLEAN | Admin access |
| is_active | BOOLEAN | Account status |

#### 2. api_userprofile
Extended user information.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| user_id | INTEGER | FK to auth_user |
| user_type | VARCHAR | passenger, flight_official, ministry_official |
| phone | VARCHAR | Contact number |
| loyalty_points | INTEGER | Loyalty program points |

#### 3. api_flight
Flight information and availability.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| flight_number | VARCHAR | Unique flight code (e.g., "AI101") |
| flight_name | VARCHAR | Flight name |
| origin | VARCHAR | Departure city |
| origin_code | VARCHAR | IATA airport code |
| destination | VARCHAR | Arrival city |
| destination_code | VARCHAR | IATA airport code |
| departure_time | DATETIME | Scheduled departure |
| arrival_time | DATETIME | Scheduled arrival |
| economy_seats | INTEGER | Total economy seats |
| economy_available | INTEGER | Available economy seats |
| economy_price | DECIMAL | Economy class price |
| business_seats | INTEGER | Total business seats |
| business_available | INTEGER | Available business seats |
| business_price | DECIMAL | Business class price |
| first_seats | INTEGER | Total first class seats |
| first_available | INTEGER | Available first class seats |
| first_price | DECIMAL | First class price |
| premium_economy_seats | INTEGER | Total premium economy seats |
| premium_economy_available | INTEGER | Available premium seats |
| premium_economy_price | DECIMAL | Premium economy price |
| status | VARCHAR | scheduled, boarding, in_flight, delayed, cancelled, completed |
| aircraft_type | VARCHAR | Aircraft model |
| created_by_id | INTEGER | FK to auth_user (who created) |

#### 4. api_reservation
Booking/reservation records.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| ticket_number | VARCHAR | Unique ticket ID (auto-generated) |
| passenger_id | INTEGER | FK to auth_user |
| flight_id | INTEGER | FK to api_flight |
| reservation_date | DATETIME | Booking timestamp |
| seats_booked | INTEGER | Number of seats |
| status | VARCHAR | confirmed, cancelled, waitlisted, completed |
| credit_card_number | VARCHAR | Payment info (optional) |
| bank_name | VARCHAR | Bank name (optional) |
| total_price | DECIMAL | Total booking price |
| seat_number | VARCHAR | Assigned seat (optional) |
| seat_type | VARCHAR | economy, business, first, premium_economy |
| travel_date | DATE | Date of travel |

---

## Upgrading to PostgreSQL (Optional)

### Installation

**Windows:**
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run the installer
3. Create a database named `airline_db`

**macOS:**
```bash
brew install postgresql
brew services start postgresql
createdb airline_db
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb airline_db
```

### Configuration

Update your `.env` file:

```env
# PostgreSQL connection string
DATABASE_URL=postgres://username:password@localhost:5432/airline_db
```

Re-run migrations:

```bash
python manage.py migrate
```

---

## Running the Application

### Development Mode

```bash
# Terminal 1 - Backend
python manage.py runserver

# Terminal 2 - Frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://127.0.0.1:8000
- Admin Panel: http://127.0.0.1:8000/admin

### Production Mode

```bash
# Install production dependencies
pip install gunicorn whitenoise

# Run with Gunicorn
gunicorn backend.wsgi:application --bind 0.0.0.0:8000
```

---

## Troubleshooting

### Common Issues

**1. "ModuleNotFoundError: No module named 'django'"**
```bash
pip install -r requirements.txt
```

**2. "sqlite3.OperationalError: database is locked"**
- Close all connections to the database
- Restart the development server

**3. "django.db.utils.OperationalError: could not connect to server"**
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env file

**4. Migration errors**
```bash
# Reset database (development only)
python manage.py migrate --fake-initial
# Or recreate
rm db.sqlite3
python manage.py migrate
```

---

## Project Structure

```
airline-project/
├── api/                  # Django app (models, views, serializers)
│   ├── migrations/       # Database migrations
│   ├── models.py        # Database models
│   ├── views.py         # API views
│   └── serializers.py  # DRF serializers
├── backend/             # Django project settings
│   ├── settings.py      # Main configuration
│   └── urls.py          # URL routing
├── frontend/            # Next.js frontend
│   ├── app/            # Next.js pages
│   ├── components/    # React components
│   └── lib/           # API utilities
├── db.sqlite3          # SQLite database
├── manage.py           # Django management script
├── requirements.txt    # Python dependencies
└── .env                # Environment variables
```

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `python manage.py migrate` | Create/update database tables |
| `python manage.py createsuperuser` | Create admin account |
| `python manage.py runserver` | Start backend server |
| `npm run dev` | Start frontend server |
| `python manage.py makemigrations` | Create migration from model changes |

---

## License

This project is for educational purposes.