import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Predict from './pages/Predict'
import Crops from './pages/Crops'
import History from './pages/History'
import Profile from './pages/Profile'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="text-center py-5">Loading...</div>
  return user ? children : <Navigate to="/login" />
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <main className="container my-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/predict" element={<PrivateRoute><Predict /></PrivateRoute>} />
          <Route path="/crops" element={<PrivateRoute><Crops /></PrivateRoute>} />
          <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        </Routes>
      </main>
      <footer className="bg-dark text-light py-4 mt-5">
        <div className="container text-center">
          <p className="mb-1">🌾 AI-Powered Crop Yield Prediction & Optimization</p>
          <small className="text-muted">React + Node.js · College Major Project</small>
        </div>
      </footer>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
