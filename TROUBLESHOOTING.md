# Troubleshooting Guide - Kindergarten Management System

## Issue: "Error launching app - Cannot find module"

### Problem
The error occurred because `package.json` was pointing to `dist/main/main.js` which doesn't exist until the project is built.

### Solution Applied
✅ Changed the main entry point in `package.json` from `dist/main/main.js` to `electron/main.ts`
✅ Electron 28 has built-in TypeScript support and can load `.ts` files directly in development mode
✅ Installed all dependencies (551 packages)

---

## How to Run the Application

### Development Mode

```bash
npm run dev
```

This command will:
1. Start Vite development server on http://localhost:5173
2. Wait for the server to be ready
3. Launch Electron application with hot reload enabled

### First Launch
The first time you run the application:
- Vite will take a few seconds to start
- Electron window will open automatically
- You should see the Dashboard with statistics cards

---

## Common Issues & Solutions

### 1. Port 5173 Already in Use

**Error**: `Port 5173 is already in use`

**Solution**:
```bash
# Find and kill the process using port 5173
netstat -ano | findstr :5173
taskkill /PID <process_id> /F
```

Or change the port in `vite.config.ts`:
```typescript
server: {
  port: 5174,  // Change to any available port
  strictPort: true,
}
```

### 2. better-sqlite3 Native Module Error

**Error**: `Error: The module was compiled against a different Node.js version`

**Solution**:
```bash
# Rebuild native modules for Electron
npm run postinstall
# or
npx electron-builder install-app-deps
```

### 3. TypeScript Compilation Errors

**Error**: TypeScript errors in the console

**Solution**:
- These are warnings and won't prevent the app from running
- To fix them, run: `npm run build:main` to check for actual errors
- Most errors are due to missing type definitions which will resolve after running the app

### 4. Database Initialization Error

**Error**: `Failed to initialize database`

**Solution**:
- Check that the user data directory is writable
- On Windows: `%APPDATA%/kindergarten-management/`
- Delete the database file and restart the app to recreate it

### 5. Blank White Screen

**Error**: Electron window opens but shows blank screen

**Solution**:
1. Check if Vite dev server is running (should see output in console)
2. Open DevTools in Electron (View → Toggle Developer Tools)
3. Check console for errors
4. Verify `http://localhost:5173` is accessible in a browser

---

## Development Workflow

### Making Changes

**Frontend (React) Changes:**
- Edit files in `src/`
- Changes will hot-reload automatically
- No need to restart Electron

**Backend (Electron) Changes:**
- Edit files in `electron/`
- Restart the dev command (Ctrl+C then `npm run dev`)
- Or use nodemon for auto-restart

**Database Changes:**
- Edit schema in `electron/database/schema.ts`
- Delete the database file to recreate with new schema
- Or implement migrations

### Debugging

**Enable DevTools:**
- Already enabled in development mode
- Press `Ctrl+Shift+I` or `Cmd+Option+I`

**View Database:**
- Use SQLite browser: https://sqlitebrowser.org/
- Database location: `%APPDATA%/kindergarten-management/kindergarten.db`

**Check Logs:**
- Main process logs appear in terminal
- Renderer process logs appear in DevTools console

---

## Building for Production

### Before Building

1. Test the application thoroughly in development mode
2. Fix any TypeScript errors: `npm run build:main`
3. Ensure all features work as expected

### Build Commands

**Windows (.exe):**
```bash
npm run build:win
```

**macOS (.dmg):**
```bash
npm run build:mac
```

**Both Platforms:**
```bash
npm run build:all
```

### Build Output

Built applications will be in the `release/` directory:
- Windows: `Kindergarten Manager Setup X.X.X.exe`
- macOS: `Kindergarten Manager-X.X.X.dmg`

---

## Next Steps

Once the application is running successfully:

1. **Test Basic Functionality:**
   - Navigate between pages (Dashboard, Students, Finance, Reports)
   - Check that the sidebar navigation works
   - Verify the dashboard statistics load

2. **Add Sample Data:**
   - Use the IPC handlers to add test students
   - Create sample payments and expenses
   - Verify data persists between app restarts

3. **Implement Remaining Features:**
   - Student registration form
   - Payment tracking interface
   - Expense logging
   - Charts for dashboard
   - PDF invoice generation
   - CSV export

---

## Getting Help

If you encounter issues not covered here:

1. Check the console output for error messages
2. Open DevTools to see renderer process errors
3. Verify all dependencies are installed: `npm install`
4. Try deleting `node_modules` and reinstalling: `rm -rf node_modules && npm install`
5. Check that you're using Node.js 18+ and npm 9+

---

## Useful Commands

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build TypeScript (main process)
npm run build:main

# Build React (renderer)
npm run build:renderer

# Build everything
npm run build

# Package for Windows
npm run build:win

# Package for macOS
npm run build:mac

# Clean build artifacts
rm -rf dist release

# Rebuild native modules
npm run postinstall
```
