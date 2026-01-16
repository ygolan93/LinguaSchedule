# LinguaSched

A modular scheduling dashboard for managing lesson bookings between language teachers and students across multiple learning levels.

## 🧠 Project Overview

LinguaSched is a React + TypeScript web application designed to help language schools streamline scheduling, subscriptions, and teacher-student interactions. It includes:

- 📅 Weekly calendar for booking and managing lessons
- 👨‍🏫👩‍🎓 Dashboards for teachers and students
- 🔁 Subscription tracking with lesson balance logic
- 🧠 Smart logic to avoid booking conflicts
- 📊 Dynamic views for both admin and teaching staff

## 🛠️ Tech Stack

- **Frontend:** React 19 + TypeScript
- **Bundler:** Vite 6
- **Icons:** Lucide React
- **Styling:** Tailwind CSS (via CDN)
- **Build & Hosting:** Netlify

## 🚀 Getting Started
``
npm install
npm run dev
``

To build for production:
``
npm run build
``

📁 Project Structure
├── App.tsx

├── index.tsx

├── index.html

├── vite.config.ts

├── .env.local

├── .gitignore

├── netlify.toml

├── utils.ts

├── types.ts

├── components/

│   ├── BookingModal.tsx

│   ├── StudentModal.tsx

│   ├── TeacherModal.tsx

│   └── LessonModal.tsx



🚧 In Development

 Google Calendar sync for teacher hours

 Admin panel with analytics

 Import/export CSV of lessons

 Auth system (admin/staff roles)

 Mobile responsiveness polish

🧪 Mock Data

The current prototype uses in-memory mock data for students, teachers, and lessons. All logic (booking, conflict detection, refund policy) works without backend.

🌐 Live Demo

Currently hosted on:
https://linguaschedule.netlify.app


© 2026 LinguaSched – built with ♥️ by ygolan93
https://github.com/ygolan93?tab=repositories


