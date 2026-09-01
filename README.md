# NotesApp — Full-Stack AI-Powered Workspace & Knowledge Base

An enterprise-grade, full-stack MERN application engineered for seamless note-taking, rich-text document editing, intelligent inline autocomplete, and secure multi-tier user subscriptions. Built with a modern micro-client architecture, **NotesApp** bridges intuitive content creation with AI capabilities, automated media handling, and payment processing.

---

## 📌 Project Overview

In today's fast-paced digital environment, modern note-taking requires more than static plain-text inputs. Content creators, students, and professionals need an expressive workspace that integrates media management, distraction-free writing, intelligent suggestions, and secure access across devices. **NotesApp** resolves this by delivering a rich-text editing experience backed by AI-driven inline autocompletion and cloud-native media processing.

The core architecture follows modern security and design standards: client-side state management powered by **Redux Toolkit**, sleek responsive styling built on **Tailwind CSS v4**, and robust server-side processing using **Express 5**, **MongoDB**, **Redis**, and **Groq AI**. Authenticated through HTTP-only JWT cookies with refresh token mechanics, the platform ensures user session security while keeping performance and request latency at a minimum.

Whether managing daily scratchpads or producing full-length articles, **NotesApp** equips users with flexible organization tools, secure cloud media uploads via **Cloudinary**, and subscription workflows integrated directly with **Stripe Checkout and Webhooks**.

---

## 🛠️ Tech Stack

### **Frontend**
* **Core Framework:** React 19 (Vite 8 build engine)
* **State Management:** Redux Toolkit (`@reduxjs/toolkit` v2), React Redux
* **Routing:** React Router v7 (`react-router-dom`)
* **Styling & UI:** Tailwind CSS v4 (`@tailwindcss/vite`), Custom CSS Utility Classes
* **Rich Text Editing:** React Quill New (`react-quill-new`) & `html-react-parser`
* **Form & API Handling:** Axios with request/response interceptors, React Hook Form
* **Linting:** ESLint 10 with React Hooks & React Refresh rules

### **Backend**
* **Runtime:** Node.js (ES Modules `type: "module"`)
* **Web Framework:** Express v5 (`express` v5.2.1)
* **Database & ORM:** MongoDB & Mongoose v9 (`mongoose` v9.9.1)
* **Caching & Rate Limiting:** Redis Cloud (`redis` v6), `express-rate-limit`, `rate-limit-redis`
* **File Uploads & Media:** Multer (Memory Storage) & Cloudinary SDK (`cloudinary` v2)
* **AI & Language Processing:** Groq SDK (`groq-sdk` with `openai/gpt-oss-20b` inline completion engine)
* **Payment Gateway:** Stripe API & Webhooks (`stripe` v22)
* **Logging:** Pino & Pino Pretty (`pino` v10)

### **Security & Quality Assurance**
* **Authentication:** JSON Web Tokens (`jsonwebtoken`), HTTP-only SameSite Cookies, `bcrypt` password hashing (10 salt rounds)
* **HTTP Security:** Helmet (`helmet`), CORS configuration, Cookie Parser
* **Testing Framework:** Mocha v11, Chai v6, Supertest v7, Sinon v22, Nock v14
* **Static Analysis:** SonarQube Code Analysis & CodeRabbit AI integration

---

## ✨ Key Features

* **🔐 Authentication & Session Security:**
  * Secure User Registration & Login with double-token JWT mechanics (Short-lived Access Tokens & Long-lived HTTP-Only Refresh Tokens).
  * Express Auth Rate Limiter (max 5 authentication attempts per IP per minute using Redis store).

* **📝 Rich-Text Note Editing:**
  * WYSIWYG editor with support for custom headers, inline formatting, code blocks, blockquotes, list structures, text coloring, and hyperlinks.
  * Debounced autosave mechanism preventing redundant API requests and lost progress.
  * Note versioning and revision tracking.

* **🤖 AI Inline Autocomplete:**
  * Powered by Groq's high-speed LLM engine (`openai/gpt-oss-20b`).
  * Context-aware prompt engineering synthesizing note title and previous text to complete sentences seamlessly on demand.

* **🖼️ Media Handling & Cloud Storage:**
  * Drag-and-drop / inline image insertion within notes.
  * Direct upload to Cloudinary with automatic file format optimization.
  * Automatic Cloudinary media cleanup when images are removed from notes.

* **💳 Subscription Tiers & Stripe Webhooks:**
  * Multi-tier subscription model (`Starter`, `Pro Creator`, `Team Workspace`).
  * Integrated Stripe Checkout session generation for subscription upgrades.
  * Asynchronous Stripe Webhook listener handling `checkout.session.completed` to auto-provision user plan upgrades in real time.

* **🛡️ Production Security & Infrastructure:**
  * Helmet HTTP headers security (X-Frame-Options, CSP, HSTS).
  * Global Redis-backed Rate Limiter (max 100 requests per IP per minute).
  * Structured JSON logging via `pino` for production monitoring.

---

## 🏗️ Architecture & Project Structure

```text
cohort-9-mern-7288-anas/
├── .coderabbit.yaml             # CodeRabbit AI PR review guidelines
├── sonar-qube-report/           # SonarQube analysis PDF & coverage screenshots
│   ├── NotesApp-analysis-report.pdf
│   ├── Soanr-qube-report-New_Code.png
│   └── Soanr-qube-report-Overall_Code.png
│
├── backend/                     # Express 5 REST API Engine
│   ├── public/                  # Static assets directory
│   ├── src/
│   │   ├── app.js               # Express application configuration, middlewares, & Stripe webhook
│   │   ├── index.js             # Server startup & MongoDB initialization listener
│   │   ├── constants.js         # Global system constants
│   │   ├── controllers/         # API Route Handlers
│   │   │   ├── ai.controller.js
│   │   │   ├── notes.controller.js
│   │   │   └── user.controller.js
│   │   ├── db/                  # Mongoose MongoDB connection builder
│   │   ├── middlewares/         # Middleware suite (JWT, Multer, Rate Limiting)
│   │   │   ├── auth.middleware.js
│   │   │   ├── multer.middleware.js
│   │   │   └── rateLimiter.middleware.js
│   │   ├── models/              # Mongoose Data Models
│   │   │   ├── note.model.js
│   │   │   ├── noteImage.model.js
│   │   │   └── user.model.js
│   │   ├── routes/              # Express API Routes
│   │   │   ├── ai.routes.js
│   │   │   ├── note.routes.js
│   │   │   ├── payment.route.js
│   │   │   └── user.routes.js
│   │   └── utils/               # Helpers (ApiError, ApiResponse, asyncHandler, Cloudinary, Pino Logger)
│   ├── test/                    # Integration & Unit test suite
│   │   ├── ai.api.test.js
│   │   ├── note.api.test.js
│   │   ├── noteImage.api.test.js
│   │   └── user.api.test.js
│   ├── .env.sample              # Environment blueprint for backend
│   └── package.json
│
└── frontend/                    # React 19 Single Page Application
    ├── index.html               # Entry HTML mount
    ├── vite.config.js           # Vite server configuration & Tailwind CSS plugin
    ├── eslint.config.js         # ESLint 10 code quality rules
    ├── src/
    │   ├── main.jsx             # React DOM root renderer & Redux Provider
    │   ├── App.jsx              # Application router & base auth checker
    │   ├── index.css            # Tailwind CSS directives & custom styling
    │   ├── api/                 # Axios client instance configuration
    │   ├── components/          # Reusable UI components & Editor
    │   │   ├── NoteEditor.jsx
    │   │   └── ProtectedRoute.jsx
    │   ├── layouts/             # Page layouts (Dashboard Layout)
    │   │   └── DashboardLayout.jsx
    │   ├── pages/               # Views (Home, Login, Register, Dashboard)
    │   │   ├── DashboardIndex.jsx
    │   │   ├── Home.jsx
    │   │   ├── Login.jsx
    │   │   └── Register.jsx
    │   └── store/               # Redux Toolkit Slices (authSlice, notesSlice, store setup)
    ├── .env.sample              # Environment blueprint for frontend
    └── package.json
```

---

## 🚀 Getting Started (Local Setup)

### **Prerequisites**
Ensure you have the following installed on your machine:
* **Node.js:** `v18.x` or higher
* **npm:** `v9.x` or higher
* **MongoDB Database:** Local MongoDB instance running on `mongodb://127.0.0.1:27017` OR a MongoDB Atlas cluster connection URI.
* **Redis Server:** Local Redis instance running on `redis://127.0.0.1:6379` OR a Redis Cloud URI.

---

### **Step-by-step Installation**

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/AnasTaha52/cohort-9-mern-7288-anas.git
   cd cohort-9-mern-7288-anas
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

---

### **Environment Variable Configuration**

Create a `.env` file in both `backend/` and `frontend/` directories based on the provided samples.

#### 📄 **Backend Environment Variables (`backend/.env`)**

| Key | Description | Example / Default Value |
| :--- | :--- | :--- |
| `PORT` | Port for Express server | `8000` |
| `MONGODB_URI` | MongoDB connection URI | `mongodb://localhost:27017/notesapp` |
| `CORS_ORIGIN` | Allowed client CORS origins | `http://localhost:5173` |
| `ACCESS_TOKEN_SECRET` | Secret key for JWT Access Tokens | `your_super_secret_access_key` |
| `ACCESS_TOKEN_EXPIRY` | Access token lifespan | `1d` |
| `REFRESH_TOKEN_SECRET` | Secret key for JWT Refresh Tokens | `your_super_secret_refresh_key` |
| `REFRESH_TOKEN_EXPIRY` | Refresh token lifespan | `10d` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `1234567890` |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | `your_cloudinary_api_secret` |
| `GROQ_API_KEY` | Groq AI Platform API Key | `gsk_your_groq_api_key` |
| `STRIPE_SECRET_KEY` | Stripe Secret API Key | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Endpoint Secret | `whsec_...` |
| `STRIPE_PRICE_ID` | Default Stripe Subscription Price ID | `price_...` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `CLIENT_URL` | Frontend client application URL | `http://localhost:5173` |

#### 📄 **Frontend Environment Variables (`frontend/.env`)**

| Key | Description | Example / Default Value |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base endpoint URL of backend API | `http://localhost:8000/api/v1` |

---

### **Running the Application Locally**

Start the backend API server and frontend Vite development server in separate terminals:

1. **Start Backend Server:**
   ```bash
   cd backend
   npm run dev
   ```
   *Backend server will start listening at `http://localhost:8000`.*

2. **Start Frontend Client:**
   ```bash
   cd frontend
   npm run dev
   ```
   *Frontend development server will open at `http://localhost:5173`.*

---

## 📜 Available Scripts

### **Backend Scripts (`backend/package.json`)**

| Command | Action |
| :--- | :--- |
| `npm run dev` | Runs backend in development mode with live-reloading via `nodemon`. |
| `npm run start` | Runs backend in production mode using standard `node src/index.js`. |
| `npm test` | Executes backend unit and integration tests using `mocha` with environment preloading. |

### **Frontend Scripts (`frontend/package.json`)**

| Command | Action |
| :--- | :--- |
| `npm run dev` | Launches Vite local development web server with HMR. |
| `npm run build` | Compiles production-ready bundle to the `dist/` directory. |
| `npm run lint` | Runs ESLint to inspect static syntax and code formatting issues. |
| `npm run preview` | Serves the production build locally for verification. |

---

## 🧪 Testing & Code Quality

The backend includes a comprehensive automated test suite powered by **Mocha**, **Chai**, **Supertest**, **Sinon**, and **Nock**. 

### Running Tests
To run backend API tests locally:
```bash
cd backend
npm test
```

### Static Code Analysis
This repository has been audited with **SonarQube** static analysis. Inspection artifacts, coverage statistics, and PDF reports are available under the `/sonar-qube-report` folder. Key quality metrics verified include:
* **Code Smells & Vulnerabilities:** Clean security gate pass with zero high-severity vulnerabilities.
* **Code Reliability:** Strict handling of JWT refresh token rotation, parameter validation via middlewares, and rate limiters on sensitive endpoints.

---

## ☁️ Deployment Notes

### **Backend Deployment (Render / Railway / Fly.io)**
1. Ensure environment variables listed in `backend/.env` are populated in your hosting provider's panel.
2. Set the build command to `npm install` and start command to `npm start`.
3. Configure your custom backend domain in `CORS_ORIGIN` and `CLIENT_URL`.

### **Stripe Webhook Listener Setup**
For production deployment or local testing via Stripe CLI:
```bash
stripe listen --forward-to localhost:8000/api/stripe/webhook
```
Pass the generated Webhook Secret (`whsec_...`) into your backend `.env`.

### **Frontend Deployment (Vercel / Netlify)**
1. Root directory setting: `frontend`
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set environment variable `VITE_API_URL` to point to your live backend endpoint (e.g. `https://api.yourdomain.com/api/v1`).

---

## 📄 License

This project is open-source and licensed under the **ISC License**.
