# NotesApp Frontend

The frontend user interface for **NotesApp**, built with React 19, Vite, Redux Toolkit, and Tailwind CSS v4. This web application provides a responsive client-side interface to create, read, update, and manage notes.

## Tech Stack

- **Framework:** [React 19](https://react.dev/)
- **Build Tool:** [Vite](https://vite.dev/)
- **State Management:** [Redux Toolkit](https://redux-toolkit.js.org/) & `react-redux`
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Form Handling:** `react-hook-form`

## Scripts and Commands

In the `frontend` directory, you can run the following scripts:

### Development

```bash
npm run dev
```

Starts the local development server with Hot Module Replacement (HMR) enabled. By default, access the application at `http://localhost:5173`.

### Build

```bash
npm run build
```

Compiles and optimizes the React application for production. Output files are placed in the `dist` directory.

### Lint

```bash
npm run lint
```

Runs ESLint across all source files to identify syntax errors, potential bugs, and code style issues.

### Preview

```bash
npm run preview
```

Serves the built production bundle locally from the `dist` directory to test production behavior prior to deployment.
