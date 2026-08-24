# NotesFlow - Frontend

NotesFlow is a modern, Notion-like rich-text note-taking workspace application built with **React**, **Redux Toolkit**, **Tailwind CSS**, and **Vite**. It features an intuitive rich-text editor with inline media uploads, note management, secure JWT authentication, and dark mode support.

---

## 🚀 Features

- **Notion-Style Rich Text Editor**: Powered by React Quill, offering full formatting options including headers, lists, blockquotes, code snippets, and inline image uploads.
- **Inline Image Handling**: Upload images directly into notes with automated Cloudinary integration and tracked image lifecycle.
- **Workspace Dashboard**: Create, view, search, organize, and delete notes effortlessly through a clean sidebar navigation interface.
- **Secure Authentication**: Integrated with JWT authentication (Access & Refresh Tokens) with protected routes and persistent login state via Redux.
- **Modern UI & Dark Mode**: Responsive interface styled with Tailwind CSS, supporting seamless dark and light mode themes.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/) (`@reduxjs/toolkit`, `react-redux`)
- **Routing**: [React Router v7](https://reactrouter.com/) (`react-router-dom`)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Rich Text Editor**: `react-quill-new`
- **Form Handling**: `react-hook-form`
- **HTTP Client**: `axios`

---

## 📂 Project Structure

```text
frontend/
├── src/
│   ├── api/          # Axios instance and API call configurations
│   ├── components/   # Reusable UI components (NoteEditor, ProtectedRoute, etc.)
│   ├── context/      # React contexts (ThemeContext, etc.)
│   ├── layouts/      # Layout components (DashboardLayout, etc.)
│   ├── pages/        # Application views (Home, Login, Register, Dashboard, NoteEditor)
│   ├── store/        # Redux store and slices (authSlice, noteSlice)
│   ├── utils/        # Helper functions and loggers
│   ├── App.jsx       # App routes and global layout setup
│   ├── main.jsx      # Entry point
│   └── index.css     # Tailwind CSS styles and theme rules
├── public/           # Static assets and favicon
├── index.html        # Main HTML file
├── vite.config.js    # Vite configuration
└── package.json      # Dependencies and scripts
```

---

## 💻 Getting Started

### Prerequisites

Ensure you have **Node.js** (v18+ recommended) and **npm** installed.

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser.

---

## 📜 Available Scripts

- `npm run dev` - Starts the Vite development server with HMR.
- `npm run build` - Builds the application for production deployment.
- `npm run preview` - Locally previews the production build.
- `npm run lint` - Runs ESLint to check for code quality and style issues.
