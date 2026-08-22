<<<<<<< HEAD
# SheSafe
# 🛡️ SheSafe

> Women's Safety Web Application built for HackFest 2026

SheSafe is a safety-focused web application designed to help women quickly access emergency assistance, share live location, find nearby police stations, and receive AI-powered safety guidance during critical situations.

---

## 📸 Screenshots

### Home Screen

![Home Screen](screenshot/home.png)

### SOS Activation

![SOS Screen](screenshot/sos.png)

### Live Location

![Location Screen](screenshot/location.png)

---

## ✨ Features

### 🚨 Emergency SOS
- One-tap SOS activation
- Emergency alert screen
- Quick access during emergencies

### 📍 Live Location Sharing
- Detects user's current location
- Displays area and region information
- Live tracking status

### 🤖 AI Safety Assistant
- Analyzes user situations
- Provides instant safety suggestions
- Emergency guidance support

### 🚔 Nearby Police Stations
- Quick access to nearby police stations
- Google Maps integration

### 👨‍👩‍👧 Emergency Contacts
- Dedicated emergency contact section
- Fast access during emergencies

### ⚙️ Settings
- User preference management
- Safety configuration options

---

## 🛠️ Tech Stack

- HTML5
- CSS3
- JavaScript
- Geolocation API
- OpenStreetMap Reverse Geocoding
- Gemini AI API (planned integration)

---

## 📂 Project Structure

```bash
SheSafe/
│
├── index.html
├── signup.html
├── home.html
├── sos.html
├── map.html
├── contacts.html
├── police.html
├── settings.html
│
├── style.css
├── script.js
│
└── screenshot/
    ├── home.png
    ├── sos.png
    └── location.png
```

---

## 🚀 How to Run

1. Clone the repository

```bash
git clone https://github.com/ushashimandal13-hub/SheSafe.git
```

2. Open project folder

```bash
cd SheSafe
```

3. Launch using VS Code Live Server

or simply open:

```bash
index.html
```

---

## 🎯 Future Improvements

- Real-time SMS alerts
- WhatsApp emergency notifications
- Live GPS tracking
- Voice activated SOS
- AI-powered threat detection
- Emergency contact database
- Backend integration

---

## 👩‍💻 Developed By

**Ushashi Mandal**

Engineering Student • HackFest 2026 Participant

GitHub:
https://github.com/ushashimandal13-hub

---

## 📜 License

This project is developed for educational and hackathon purposes.
=======
# 🛡️ SheSafe - Women Safety Backend & Web Platform

A full-stack, secure, real-time women safety web application built with **Node.js, Express, SQLite, JWT Authentication, and Gemini AI Safety Intelligence**.

---

## 🌟 Key Features

- **🔐 Secure Authentication**: JWT token-based authentication with `bcryptjs` password hashing and user profiles.
- **🚨 Instant SOS Dispatcher**: Triggers distress alerts with GPS coordinates, battery level, and logs emergency events with automated contact notifications.
- **👨‍👩‍👧 Emergency Contacts (CRUD)**: Manage trusted contacts (Mom, Dad, Sister, etc.) who receive immediate SMS/Push alerts.
- **📍 Live GPS Tracking**: Reverse-geocodes locations and generates live Google Maps share links.
- **🤖 AI Safety Assistant**: Secure backend proxy communicating with Google Gemini AI with built-in emergency fallback advice for crisis situations.
- **🚔 Police & Verified Helplines**: Direct access to national emergency lines (112, 1091, 181, 100, 1090, 1930).
- **⚙️ Settings & Preferences**: Persists notification, auto-location, and alarm preferences in the database.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` (already pre-configured for local development):
```env
PORT=5000
JWT_SECRET=your_secure_jwt_secret_here
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash

### 3. Run the Server
```bash
# Production mode
npm start

# Development mode (with auto-reload)
npm run dev
```

The application will be accessible at:
👉 **`http://localhost:5000`**

---

## ⚡ Demo Account
A default demo user is automatically provisioned for quick testing:
- **Email:** `ushashi@shesafe.app`
- **Password:** `password123`

---

## 📡 REST API Documentation

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/signup` | Register new user | No |
| `POST` | `/api/auth/login` | Login and get JWT token | No |
| `GET` | `/api/auth/me` | Get current user profile | Yes (Bearer Token) |
| `PUT` | `/api/auth/profile` | Update profile info | Yes |

### 👨‍👩‍👧 Emergency Contacts (`/api/contacts`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/contacts` | Get user's emergency contacts | Yes |
| `POST` | `/api/contacts` | Add new contact | Yes |
| `PUT` | `/api/contacts/:id` | Update contact | Yes |
| `DELETE` | `/api/contacts/:id` | Delete contact | Yes |

### 🚨 SOS & Emergencies (`/api/sos`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/sos/trigger` | Trigger distress alert with GPS coordinates | Yes |
| `GET` | `/api/sos/status` | Get active SOS status | Yes |
| `POST` | `/api/sos/resolve` | Cancel / Resolve SOS | Yes |
| `GET` | `/api/sos/history` | View past SOS logs | Yes |

### 📍 Location Tracking (`/api/location`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/location/update` | Log live GPS coordinates | Yes |
| `GET` | `/api/location/current` | Get latest tracked position | Yes |
| `GET` | `/api/location/history` | Get location history breadcrumbs | Yes |

### 🤖 AI Safety Assistant (`/api/ai`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/ai/advise` | Get actionable AI crisis guidance | Optional |

### 🚔 Police & Helplines (`/api/police`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/police/helplines` | Get list of official emergency helplines | No |
| `GET` | `/api/police/nearby` | Query nearest police stations | No |

---

## 🗄️ Database Architecture (SQLite)
The application uses SQLite (`database/shesafe.db`) with zero external database dependencies:
- **`users`**: Account credentials, hashed password, phone, custom emergency message.
- **`contacts`**: User-specific emergency contacts with relationships and primary status.
- **`sos_alerts`**: Emergency logs with GPS coordinates, address, and status.
- **`location_logs`**: Live GPS track points and tracking history.
- **`settings`**: User preferences (notifications, siren sound, auto-GPS).
>>>>>>> 63ace77 (SheSafe Backend)
