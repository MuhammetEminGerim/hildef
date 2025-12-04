import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import { Toaster } from './components/ui/toaster';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { ThemeProvider } from './components/theme-provider';


function Bootstrap() {
  // Auth initialization is now handled in App.tsx

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
      <Toaster />
    </ThemeProvider>
  );
}

const rootElement = document.getElementById('root') as HTMLElement;

// Prevent double root creation in dev mode (HMR)
if (!rootElement.dataset.rootCreated) {
  rootElement.dataset.rootCreated = 'true';
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <Bootstrap />
    </React.StrictMode>
  );
}



