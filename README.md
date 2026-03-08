# Learning Center Frontend

A modern, responsive eLearning dashboard built with React, Vite, and shadcn/ui.

## 🎨 Main Idea & Concepts

The frontend provide a high-fidelity user interface for four distinct user roles: Students, Parents, Teachers, and Administrators. It focuses on a premium aesthetic, ease of use, and real-time data visualization.

### Key Architectural Concepts

- **Role-Based Experience**: Tailored dashboards and features for each user role.
- **Component-Driven Design**: Highly reusable UI components powered by shadcn/ui and Tailwind CSS.
- **State Management**: Using `react-query` for efficient server-state management, caching, and synchronization.
- **API Proxying**: During development, Vite proxies requests to the backend server, allowing for a seamless single-repo developer experience while maintaining architectural separation.

---

## 📂 Folder Structure

```text
LearningCenterfrontend/
├── client/src/             # Main React application source
│   ├── components/         # Reusable UI components (shadcn/ui + custom)
│   │   ├── layout/         # Navigation, Sidebar, Shell
│   │   ├── dashboard/      # Role-specific dashboard widgets
│   │   └── ui/             # Atomic shadcn components
│   ├── hooks/              # Custom React hooks (auth, data fetching)
│   ├── lib/                # Utility functions & API client
│   ├── pages/              # Page components organized by role
│   │   ├── admin/          # Admin-only views
│   │   ├── auth/           # Login & Register views
│   │   ├── parent/         # Parent dashboard & child tracking
│   │   ├── student/        # Student classes & assignments
│   │   └── teacher/        # Teacher course management
│   ├── App.tsx             # Root component & Routing
│   └── main.tsx            # Application entry point
├── public/                 # Static public assets
├── attached_assets/        # Large media assets (images, etc.)
├── shared/                 # Shared types with Backend
├── .env                    # Frontend environment variables
├── vite.config.ts          # Vite configuration with API proxy
├── tailwind.config.ts      # Styling configuration
└── package.json            # Dependencies and scripts
```

---

## 🛠️ Technology Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: wouter (Lightweight)
- **Icons**: Lucide React

---

## 🚦 Getting Started

### Prerequisites
- Node.js (v18+)
- Backend server running (default: port 5001)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start Development Server:
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5173`. API requests are automatically proxied to `http://localhost:5001`.

---

## 🔌 API Communication

The frontend communicates with the backend via a proxy configured in `vite.config.ts`:

```typescript
server: {
  proxy: {
    "/api": {
      target: "http://localhost:5001",
      changeOrigin: true,
    },
    "/ws": {
      target: "http://localhost:5001",
      ws: true,
    },
  },
},
```
