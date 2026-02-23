import { Navigate, Route, Routes } from 'react-router-dom';

import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ToastHost from './components/ToastHost.jsx';
import CreateWorkshopPage from './pages/CreateWorkshopPage.jsx';
import FavoritesPage from './pages/FavoritesPage.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import TowingPage from './pages/TowingPage.jsx';
import WorkshopDetailsPage from './pages/WorkshopDetailsPage.jsx';

export default function App() {
  return (
    <div className="min-h-screen">
      <ToastHost />
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/towing" element={<TowingPage />} />
        <Route path="/workshops/:id" element={<WorkshopDetailsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <FavoritesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-workshop"
          element={
            <ProtectedRoute>
              <CreateWorkshopPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
