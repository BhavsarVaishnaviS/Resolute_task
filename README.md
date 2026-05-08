# Student Management System

A full-stack React + Node.js application with **2-level AES encryption** for secure student data management.

## Tech Stack

| Layer     | Technology                                    |
|-----------|-----------------------------------------------|
| Frontend  | React 18, TypeScript, CryptoJS, Axios         |
| Backend   | Node.js, Express, TypeScript                  |
| Database  | MongoDB + Mongoose                            |
| Auth      | JWT (jsonwebtoken) + bcrypt                   |
| Encryption| AES-256 via CryptoJS (2-layer)               |

---

## How 2-Level Encryption Works

```
PLAINTEXT Student Data
        │
        ▼ [Frontend – Level 1 AES encrypt with VITE_ENCRYPTION_KEY]
LEVEL-1 ENCRYPTED payload
        │
        ▼  sent over HTTPS to backend
        │
        ▼ [Backend – Level 2 AES encrypt with ENCRYPTION_KEY_LEVEL2]
DOUBLE ENCRYPTED blob  ──▶  Stored in MongoDB
```

**On Fetch (reverse):**
```
MongoDB: DOUBLE ENCRYPTED blob
        │
        ▼ [Backend – Level 2 AES decrypt]
LEVEL-1 ENCRYPTED payload  ──▶  Sent to frontend
        │
        ▼ [Frontend – Level 1 AES decrypt]
PLAINTEXT displayed in UI
```

- Even if MongoDB is compromised, data is still AES-encrypted.
- Even if network traffic is intercepted (beyond TLS), backend key is required to read it.
- Passwords for student records are encrypted alongside other fields within the payload.
- Admin login passwords are separately hashed with bcrypt.

---

## Folder Structure

```
Resolute_task/
├── client/                        # React + TypeScript frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx      # Admin login with validation
│   │   │   ├── SignupForm.tsx     # Admin registration
│   │   │   ├── StudentForm.tsx    # Create / Edit student (Level-1 encrypts before send)
│   │   │   └── StudentList.tsx    # CRUD table (decrypts on render)
│   │   ├── context/
│   │   │   └── AuthContext.tsx    # JWT auth state
│   │   ├── types/
│   │   │   └── index.ts           # Shared TypeScript interfaces
│   │   ├── utils/
│   │   │   ├── api.ts             # Axios instance with JWT interceptor
│   │   │   └── crypto.ts          # Level-1 AES encrypt/decrypt helpers
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── server/                        # Node.js + Express + TypeScript backend
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.ts  # Login / Signup for admins
│   │   │   └── studentController.ts # CRUD + Level-2 encryption logic
│   │   ├── middleware/
│   │   │   └── auth.ts            # JWT verification middleware
│   │   ├── models/
│   │   │   ├── Student.ts         # Mongoose schema (stores double-encrypted blob)
│   │   │   └── User.ts            # Admin user with bcrypt password
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   └── studentRoutes.ts
│   │   ├── utils/
│   │   │   └── crypto.ts          # Level-2 AES encrypt/decrypt helpers
│   │   ├── app.ts
│   │   └── server.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

---

## API Routes

| Method | Route                  | Auth Required | Description              |
|--------|------------------------|---------------|--------------------------|
| POST   | `/api/auth/signup`     | No            | Register admin user      |
| POST   | `/api/auth/login`      | No            | Login, receive JWT       |
| POST   | `/api/register`        | ✅ JWT        | Create student (encrypted)|
| GET    | `/api/students`        | ✅ JWT        | Get all students (L1 encrypted) |
| PUT    | `/api/student/:id`     | ✅ JWT        | Update student           |
| DELETE | `/api/student/:id`     | ✅ JWT        | Delete student           |

---

## Setup Instructions

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)

### 1. Clone & setup server

```bash
cd server
cp .env.example .env
# Edit .env — set MONGO_URI, JWT_SECRET, ENCRYPTION_KEY_LEVEL2
npm install
npm run dev
```

### 2. Setup client

```bash
cd client
cp .env .env
# Edit .env — set VITE_ENCRYPTION_KEY
npm install
npm run dev
```

### 3. Open browser

Navigate to `http://localhost:5173`.  
Create an admin account via the Signup screen, then log in to manage students.

---

## Login 
create account using email `admin@gmail.com` and password any
Login with `admin@gmail.com` then you can add, update, delete students other wise you can only manage your account.


## Student Fields

- Full Name
- Email
- Phone Number
- Date of Birth
- Gender
- Address
- Course Enrolled
- Password (encrypted within payload)
