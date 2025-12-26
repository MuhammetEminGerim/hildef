# Kindergarten Management System

A comprehensive cross-platform desktop application for managing kindergarten/daycare operations, built with Electron.js, React, TypeScript, and SQLite.

## Features

- **Dashboard**: Overview with statistics and charts
- **Student Management**: Complete CRUD operations for student enrollment
- **Finance Tracking**: Payment and expense management
- **Reporting**: Generate and export financial reports

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Desktop Framework**: Electron 28
- **Database**: SQLite (better-sqlite3)
- **UI Library**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Charts**: Recharts
- **PDF Generation**: jsPDF
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- For macOS builds: macOS operating system
- For Windows builds: Windows operating system

### Installation

1. Clone the repository or navigate to the project directory:
```bash
cd "c:\Users\Emin\Desktop\kreş"
```

2. Install dependencies:
```bash
npm install
```

### Development

Run the application in development mode:

```bash
npm run dev
```

This will:
- Start the Vite development server on http://localhost:5173
- Launch the Electron application
- Enable hot reload for both renderer and main processes

### Building for Production

#### Build for Windows (.exe)

```bash
npm run build:win
```

Output: `release/Kindergarten Manager Setup X.X.X.exe`

#### Build for macOS (.dmg)

```bash
npm run build:mac
```

Output: `release/Kindergarten Manager-X.X.X.dmg`

#### Build for Both Platforms

```bash
npm run build:all
```

## Project Structure

```
kindergarten-management/
├── electron/               # Electron main process
│   ├── main.ts             # Main entry point
│   ├── preload.ts          # Preload script (IPC bridge)
│   ├── db/
│   │   ├── connection.ts   # SQLite connection and schema bootstrap
│   │   ├── schema.sql      # SQL schema
│   │   └── dal/            # Data Access Layer
│   │       ├── studentsDal.ts
│   │       ├── paymentsDal.ts
│   │       ├── expensesDal.ts
│   │       ├── reportsDal.ts
│   │       ├── authDal.ts
│   │       ├── activityLogDal.ts
│   │       └── settingsDal.ts
│   └── ipc/                # IPC handlers
│       ├── studentsIpc.ts
│       ├── financeIpc.ts
│       ├── reportsIpc.ts
│       └── authBackupIpc.ts
├── src/                    # React renderer process
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── MainLayout.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   └── ui/             # shadcn-style UI primitives
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── select.tsx
│   │       ├── table.tsx
│   │       └── toastProvider.tsx
│   ├── pages/              # Page components
│   │   ├── DashboardPage.tsx
│   │   ├── StudentsPage.tsx
│   │   ├── FinancePage.tsx
│   │   ├── ReportsPage.tsx
│   │   └── SettingsPage.tsx
│   ├── store/              # Zustand state management
│   │   └── authStore.ts
│   ├── lib/                # Utility helpers
│   │   ├── ipc.ts
│   │   └── utils.ts
│   └── styles/
│       └── globals.css     # Tailwind setup and CSS variables
├── dist/                   # Build output
└── release/                # Packaged applications
```

## Database

The application uses SQLite for local data storage. The database file is automatically created in the user's data directory:

- **Windows**: `%APPDATA%/kindergarten-management/kindergarten.db`
- **macOS**: `~/Library/Application Support/kindergarten-management/kindergarten.db`

### Schema

- **students**: Student enrollment information
- **payments**: Payment tracking with status
- **expenses**: Operational expenses by category

## Development Notes

- The main process code is in `electron/`
- The renderer process code is in `src/`
- IPC communication is type-safe via the preload script
- All database operations are synchronous (better-sqlite3)
- Photos and receipts are stored in the user data directory
 - Authentication, backup settings and activity logs are stored in SQLite as well.

## Scripts

- `npm run dev` - Start development mode
- `npm run build` - Build both renderer and main process
- `npm run build:win` - Package for Windows
- `npm run build:mac` - Package for macOS
- `npm run build:all` - Package for both platforms

## License

MIT

## Author

Your Name

---
*Last updated: 26.12.2024*
