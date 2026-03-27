import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Heatmap from './pages/Heatmap';
import Insights from './pages/Insights';
import Complaints from './pages/Complaints';
import Eligibility from './pages/Eligibility';
import Simulation from './pages/Simulation';
import Login from './pages/Login';
import Signup from './pages/Signup';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="heatmap" element={<Heatmap />} />
            <Route path="insights" element={<Insights />} />
            <Route path="complaints" element={<Complaints />} />
            <Route path="eligibility" element={<Eligibility />} />
            <Route path="simulation" element={<Simulation />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
