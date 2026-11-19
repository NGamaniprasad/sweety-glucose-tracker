
# Sweety — Blood Glucose Tracker

A full-stack web application for recording daily blood glucose readings and viewing daily and monthly reports.

Built as a technical assessment for the Junior Full Stack Developer – JavaScript & AI position at Kenpath.

## Features

### User Authentication

- Register with name, email, and password
- Secure password hashing using bcrypt
- Login using JWT authentication
- Protected application routes
- Logout functionality
- User-specific data access

### Glucose Reading Management

Users can add, view, edit, and delete glucose readings.

Each reading contains:

- Date
- Time slot
- Glucose value in mg/dl

Supported time slots:

1. Morning (fasting)
2. After breakfast
3. After lunch
4. After dinner

Validation rules:

- Glucose value is required
- Value must be a whole number from 40 to 600 mg/dl
- Only one reading per time slot per day
- Maximum four readings per day
- Future dates are not allowed

Validation errors are displayed in the frontend.

### Reports

Three reports are supported:

**Daily Report**
- Statistics for the selected date
- Highest, lowest, average, and reading count
- Individual readings displayed by time slot

**Month-to-Date Report**
- From the first day of the selected month through the selected date
- Highest, lowest, average, and reading count

**Previous-Month Report**
- Covers the entire calendar month preceding the selected month
- Highest, lowest, average, and reading count

Averages are displayed to one decimal place.

Reports without readings display a friendly empty state.

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React.js, Vite, JavaScript, CSS3 |
| Routing | React Router |
| HTTP Client | Axios |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Authentication | JWT |
| Password Security | bcrypt |
| Testing | Vitest, Supertest |
| Version Control | Git, GitHub |

## Project Structure

```text
sweety-glucose-tracker/
├── client/          React frontend
├── server/
│   ├── src/         Express application
│   ├── db/          PostgreSQL schema
│   ├── scripts/     Demo seed script
│   └── tests/       Automated API tests
├── screenshots/     Application screenshots
└── README.md
```

## Prerequisites

Install the following:

- Node.js (version compatible with the installed Vite release)
- npm
- PostgreSQL
- Git
- A code editor such as VS Code

pgAdmin is optional but recommended for local database management.

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/NGamaniprasad/sweety-glucose-tracker
cd sweety-glucose-tracker
```

### 2. Create the PostgreSQL database

Open pgAdmin or another PostgreSQL client.

Create a database named:

```text
sweety_db
```

Open Query Tool for `sweety_db` and execute the SQL in:

```text
server/db/schema.sql
```

This creates the `users` and `readings` tables and their constraints.

### 3. Configure backend environment variables

Open the `server` directory.

Create `.env` using `.env.example` as the template.

```dotenv
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sweety_db
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRESQL_PASSWORD
JWT_SECRET=YOUR_LONG_RANDOM_JWT_SECRET
```

Replace the placeholders with your local credentials.

Never commit real environment secrets.

### 4. Install backend dependencies

```bash
cd server
npm install
```

### 5. Start the backend

```bash
npm run dev
```

Backend URL:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

A healthy response confirms Express and PostgreSQL connectivity.

### 6. Install frontend dependencies

Open another terminal from the project root:

```bash
cd client
npm install
```

### 7. Configure frontend API URL

The frontend uses this local API URL by default:

```text
http://localhost:5000/api
```

Optionally create `client/.env`:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

### 8. Start the frontend

```bash
npm run dev
```

Open the local URL displayed by Vite, typically:

```text
http://localhost:5173
```

Register a new account or log in with the seeded demo account.

## Demo Data

A repeatable seed script is provided.

From the `server` directory run:

```bash
npm run seed
```

The script creates or updates the demo account and populates eight sample readings.

Demo credentials:

```text
Email: sweety.demo@example.com
Password: SweetyDemo123!
```

These are public demonstration credentials only.

The sample readings include values across September and October 2026.

The seed script can be executed repeatedly without duplicating sample readings.

Note: Running it again resets readings belonging to the demo account.

The seed script is intended only for the local `sweety_db` database.

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login and receive JWT |
| GET | /api/auth/me | Retrieve authenticated user |

### Readings

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/readings | Add reading |
| GET | /api/readings | List own readings |
| GET | /api/readings/:id | Retrieve own reading |
| PUT | /api/readings/:id | Update own reading |
| DELETE | /api/readings/:id | Delete own reading |

Optional date filter:

```text
GET /api/readings?date=2026-10-15
```

### Reports

| Method | Endpoint |
|--------|----------|
| GET | /api/reports/daily?date=2026-10-15 |
| GET | /api/reports/month-to-date?date=2026-10-15 |
| GET | /api/reports/previous-month?date=2026-10-15 |

Protected endpoints require:

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

## Automated Testing

The backend includes automated API tests using Vitest and Supertest.

Tests cover:

- User registration
- bcrypt password hashing
- Duplicate email validation
- Login and invalid credentials
- JWT authentication
- Reading creation, retrieval, editing, and deletion
- All five glucose validation requirements
- Reading ownership and user isolation
- Daily report calculations
- Month-to-date calculations
- Previous-month calculations
- Empty reports
- Calendar boundaries and leap years

### Create the test database

Create a separate PostgreSQL database:

```text
sweety_test_db
```

Execute `server/db/schema.sql` in that database.

### Configure test environment

Create `server/.env.test`:

```dotenv
NODE_ENV=test
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sweety_test_db
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRESQL_PASSWORD
JWT_SECRET=YOUR_TEST_JWT_SECRET
```

### Run tests

From the `server` directory:

```bash
npm test
```

The test suite contains 37 test cases.

Tests run against `sweety_test_db`, not the normal development database.

**Warning:** Tests clear records in `sweety_test_db`. Do not use a database containing important data.

## Screenshots

Application screenshots are available in the `screenshots/` directory.

They demonstrate authentication, reading management, validation, and daily/monthly reports.

## Security

- Passwords are hashed using bcrypt
- JWT verification protects private API endpoints
- Database queries are parameterized
- Reading access is restricted to the authenticated user
- PostgreSQL constraints prevent duplicate slots and invalid stored values
- Real secrets are excluded from Git


### Assumptions

- The application uses mg/dl as the glucose measurement unit.
- Four fixed time slots are supported per day.
- Each user manages only their own readings.
- Report calculations use stored reading values without clinical interpretation.
- The selected date determines report boundaries.
- Dates are interpreted using the application/server's configured local calendar.
- Full-field PUT requests are used for updating readings.
- Local development uses PostgreSQL.
- The demo account and sample data are intended for assessment testing.

### Improvements With More Time

- Use secure HttpOnly cookie-based sessions for production
- Add stronger password policies and rate limiting
- Improve timezone handling for users in different regions
- Add more automated UI and integration tests
- Improve accessibility and mobile usability
- Add production monitoring and structured logging
- Set up automated CI checks and deployment

These improvements are not required for this assessment.

## Author

N Gamini Prasad

B.Tech Computer Science Engineering



