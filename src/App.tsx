import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { MainLayout } from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import FinancePage from './pages/FinancePage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import EventsPage from './pages/EventsPage';
import PersonnelPage from './pages/PersonnelPage';
import ClassesPage from './pages/ClassesPage';
import AttendancePage from './pages/AttendancePage';
import AttendanceHistoryPage from './pages/AttendanceHistoryPage';
import { useGlobalHotkeys } from './hooks/use-hotkeys';

function App() {
  useGlobalHotkeys();
  const { user, loading, initialize } = useAuthStore();

  useEffect(() => {
    const unsubscribe = initialize();
    return () => unsubscribe();
  }, [initialize]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-[#3e5c45]">Yükleniyor...</div>;
  }

  // If not logged in, show login page
  if (!user) {
    return (
      <HashRouter>
        <Routes>
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </HashRouter>
    );
  }

  // If logged in, show main app
  return (
    <HashRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/classes" element={<ClassesPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/attendance-history" element={<AttendanceHistoryPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/personnel" element={<PersonnelPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </MainLayout>
    </HashRouter>
  );
}

export default App;


