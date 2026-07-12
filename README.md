# Student Management University System

A full-stack academic management solution built with Node.js, Express, PostgreSQL (Supabase), and vanilla HTML/CSS/JS. It provides separate role-based portals for students and administrators, with dynamic transcript rendering, weighted GPA calculation, and administrative course management.

---

## Tech Stack

- **Backend:** Node.js, Express.js, PostgreSQL (Supabase), JWT + bcrypt
- **Frontend:** HTML5, CSS3 (Grid/Flexbox), Vanilla JavaScript
- **Hosting:** Render
- **Database:** Supabase PostgreSQL

---

## Features

- JWT-based authentication with secure bcrypt password hashing
- Role-based access control (`student` / `admin`)
- Student portal: transcript, enrollment, profile setup, weighted GPA, Pass/Fail status badges
- Admin portal: grade updates, course creation with validation
- Server-side GPA source of truth via `utils/gpaUtils.js`
- Unit tests for GPA engine (`npm test`)

---

## Project Structure

```
├── config/
│   └── db.js                 # PostgreSQL connection singleton
├── controllers/
│   ├── authController.js      # Registration & login
│   ├── studentController.js   # Student profile, enrollment, grading
│   └── coursesController.js   # Course creation (admin)
├── middleware/
│   └── authMiddleware.js      # JWT verification
├── public/
│   ├── index.html            # Student portal
│   ├── admin.html            # Admin portal
│   ├── css/style.css         # Dark-mode responsive styles
│   └── js/app.js             # SPA logic, GPA engine, route guards
├── routes/
│   ├── authRoutes.js
│   ├── studentRoutes.js
│   └── coursesRoutes.js
├── utils/
│   ├── gpaUtils.js           # Server-side GPA/grade validation
│   └── gpaUtils.test.js      # Jest tests
├── seedCourses.js            # Database seeding script
├── server.js                 # Express app entry point
└── package.json
```

---

## Setup Instructions

### Prerequisites
- Node.js v22+
- PostgreSQL database (or Supabase project)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/gscorpion289/student-management-university-system.git
cd student-management-university-system

# Install dependencies
npm install
```

### Environment Configuration

Create a `.env` file in the root:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your_secure_random_secret_here
```

### Database Initialization

```bash
node seedCourses.js
```

### Run the App

```bash
# Development
npm run dev

# Production
npm start
```

### Access

- **Student Portal:** `http://localhost:3000/`
- **Admin Portal:** `http://localhost:3000/admin.html`

---

## Testing

```bash
npm test
```

---

## Live Deployment

**Live URL:** `https://student-management-university-system-sms.onrender.com`

---

## Video Walkthrough

**🎥 Demo Video:** `https://youtu.be/rynHRj2GCzk`

---

## Author

- **Name:** Zechariah Jah
- **Student ID:** 1053
- **Course:** Webprogramming
- **Institution:** IMATT College

---

## License

ISC
