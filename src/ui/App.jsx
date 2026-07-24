import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AIInsightsPage from './pages/AIInsightsPage';
import CoverageMetrics from './pages/CoverageMetrics';
import './styles/index.css';

export default function App() {
  return (
    <Router basename="/test-monitor">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/insights" element={<AIInsightsPage />} />
        <Route path="/coverage" element={<CoverageMetrics />} />
      </Routes>
    </Router>
  );
}
