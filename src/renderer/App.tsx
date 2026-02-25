import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/ui/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { ResumesPage } from './pages/ResumesPage';
import { ResumeDetailPage } from './pages/ResumeDetailPage';
import { OptimizePage } from './pages/OptimizePage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/resumes" element={<ResumesPage />} />
          <Route path="/resumes/:id" element={<ResumeDetailPage />} />
          <Route path="/optimize" element={<OptimizePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}
