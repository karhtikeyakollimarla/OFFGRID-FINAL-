import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { CitizenFormPage } from './pages/CitizenFormPage';
import { TicketResultPage } from './pages/TicketResultPage';
import { TrackTicketPage } from './pages/TrackTicketPage';
import { OfficerDashboardPage } from './pages/OfficerDashboardPage';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');

  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#F4F7FA] text-[#172B4D] flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 pb-12">{children}</main>
      <footer className="bg-[#0B1F3A] text-slate-400 py-6 text-xs border-t border-[#142B48]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white tracking-tight text-sm">
              Nagrik
            </span>
            <span className="text-slate-300">• Your City. Your Voice.</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Official Municipal Grievance Redressal Platform • Automated Triage & Citizen Notifications
          </div>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<CitizenFormPage />} />
          <Route path="/ticket/:id" element={<TicketResultPage />} />
          <Route path="/track" element={<TrackTicketPage />} />
          <Route path="/track/:id" element={<TrackTicketPage />} />
          <Route path="/dashboard" element={<OfficerDashboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;
