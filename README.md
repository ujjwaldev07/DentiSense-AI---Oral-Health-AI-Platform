# 🦷 DentiSense AI — AI-Powered Oral Health & Dental Disease Prediction Platform

A production-quality educational MERN stack web application empowering users with evidence-based oral health education, intelligent disease prediction & symptom risk assessment, multilingual dental assistance (English, Hindi, Marathi), voice input/TTS, and an Admin knowledge management & analytics suite—strictly adhering to clinical safety guardrails.

> ⚠️ **Important Safety Disclaimer**: This platform is designed exclusively for **educational and oral disease awareness purposes**. It **never provides medical diagnosis, treatment planning, or prescriptions**. Every AI response and report clearly states that it does not replace a licensed dentist and highlights warning signs requiring urgent clinical care.

---

## 🚀 Core Stack & Features

- **Frontend**: React 18, Vite, Tailwind CSS v4, Lucide Icons, Recharts (topic frequencies, activity trends, language split, risk breakdown), Web Speech Recognition & Speech Synthesis (TTS).
- **Backend**: Node.js, Express.js (Modular MVC + Service architecture, Zod validation, Helmet, Morgan, Rate Limiting, Centralized Error Handling).
- **Database**: MongoDB Atlas / Local MongoDB with Mongoose ODM.
- **AI & RAG Engine**: Google Gemini API (`@google/genai` with `gemini-3.7-flash` & `gemini-embedding-001`), MongoDB Atlas `$vectorSearch` with high-performance in-memory Cosine Similarity fallback.
- **Multilingual Support**: English, हिंदी (Hindi), मराठी (Marathi) with full i18n support across UI, assessment wizard, and voice I/O.
- **Role-Based Auth**: Secure JWT + bcrypt authentication with User and Admin roles, plus 1-click Demo logins.

---

## 🛠️ Quick Start Guide

### 1. Backend Setup

```bash
cd backend
npm install
# Seed the database with multilingual dental knowledge, demo accounts & sample analytics:
npm run seed
# Start the backend server:
npm start
```
The backend will run on `http://localhost:5060`.

### 2. Frontend Setup

```bash
cd frontend
npm install
# Start the frontend development server:
npm run dev
```
The frontend will run on `http://localhost:5174`.

---


---

## 🛡️ Medical Safety Guardrails

1. **Prescription Refusal**: Strictly rejects requests for medication prescriptions, antibiotic dosages, or painkillers, providing safe non-pharmacological comfort guidance (e.g., warm saline rinses).
2. **Red-Flag Emergency Triage**: Detects non-healing ulcers (>14 days), acute facial swelling, dental trauma/avulsion, and difficulty swallowing, triggering prominent emergency consultation alerts.
3. **Transparent Evidence Citations**: Every RAG consultation response links directly to verified clinical guidelines (ADA, IDA, WHO, EFP).
4. **Mandatory Disclaimers**: Disclaimers are embedded across all pages, chat bubbles, and downloadable assessment reports in English, Hindi, and Marathi.

---

## 📡 REST API Overview

- `GET /api/health` — System health, AI model status, database connection, and active guardrails.
- `POST /api/auth/signup` — User registration.
- `POST /api/auth/login` — JWT user login.
- `GET /api/auth/profile` — User profile.
- `POST /api/chat/message` — Send query to RAG Gemini Assistant with guardrails & citations.
- `GET /api/chat/conversations` — Paginated user chat history.
- `POST /api/chat/conversations/:id/rate` — Star rating & feedback for AI consultation.
- `POST /api/assessment` — Submit 5-step symptom check, calculate Risk Tier & Red Flags.
- `GET /api/assessment` — Retrieve previous assessments.
- `GET /api/knowledge` — Search & browse dental encyclopedia articles.
- `POST /api/knowledge` — (Admin) Add new article, chunk text, and generate vector embeddings.
- `POST /api/knowledge/admin/reindex` — (Admin) Re-index all document chunks and dense embeddings.
- `GET /api/analytics/me` — User personal oral health trends.
- `GET /api/analytics/admin` — (Admin) Platform analytics (topics, language distribution, risk tiers, activity trends).
- `GET /api/users` — (Admin) Manage user profiles and access roles.
- `GET /api/feedback` — (Admin) Feedback monitoring and review status.
