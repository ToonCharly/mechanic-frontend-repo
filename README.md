# 🖥️ Workshop Management — Frontend

Web client for the Workshop Management platform. Built with React, TypeScript, and Tailwind CSS.

## Features

- Service order management (create, edit, delete, status updates)
- Vehicle and payment views
- JWT authentication with automatic token refresh
- Responsive UI

## Tech Stack

- **Framework:** React 18
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Build tool:** Vite

## Getting Started

### Prerequisites

- [Node.js 18+](https://nodejs.org/)
- Backend API running (see [backend repo](#))

### Setup

1. Clone the repository:
```bash
   git clone https://github.com/your-username/your-frontend-repo.git
   cd your-frontend-repo
```

2. Install dependencies:
```bash
   npm install
```

3. Copy the example environment file and fill in your values:
```bash
   cp .env.example .env
```

4. Start the dev server:
```bash
   npm run dev
```

The app will be available at `http://localhost:5173`.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Base URL of the backend API (e.g. `http://localhost:8080/api/v1`) |

> ⚠️ Never commit your `.env` file. It is listed in `.gitignore`.

## Project Structure
```
.
├── src/
│   ├── components/     # UI components (Services, etc.)
│   ├── services/       # API client with token management
│   ├── types/          # TypeScript types (auth, services, vehicles, payments)
│   └── main.tsx        # Entry point
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── .env.example
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |

## License

MIT
