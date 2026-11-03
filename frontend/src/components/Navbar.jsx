import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-success shadow-sm">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">
          <i className="bi bi-flower1"></i> CropYield AI
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="nav">
          <ul className="navbar-nav me-auto">
            {user && (
              <>
                <li className="nav-item"><Link className="nav-link" to="/dashboard"><i className="bi bi-speedometer2"></i> Dashboard</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/predict"><i className="bi bi-graph-up-arrow"></i> Predict</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/crops"><i className="bi bi-basket"></i> My Crops</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/history"><i className="bi bi-clock-history"></i> History</Link></li>
              </>
            )}
          </ul>
          <ul className="navbar-nav">
            {user ? (
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
                  <i className="bi bi-person-circle"></i> {user.name}
                </a>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li><Link className="dropdown-item" to="/profile">Profile</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><button className="dropdown-item" onClick={handleLogout}>Logout</button></li>
                </ul>
              </li>
            ) : (
              <>
                <li className="nav-item"><Link className="nav-link" to="/login">Login</Link></li>
                <li className="nav-item"><Link className="nav-link btn btn-outline-light btn-sm ms-2 px-3" to="/register">Sign Up</Link></li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}
