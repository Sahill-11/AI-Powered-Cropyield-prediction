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
    <nav className="navbar navbar-expand-lg navbar-light app-navbar">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">
          <span className="brand-mark"><i className="bi bi-flower1"></i></span>
          <span>CropYield<span className="brand-accent">AI</span></span>
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav" aria-controls="nav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="nav">
          <ul className="navbar-nav mx-auto">
            {user && (
              <>
                <li className="nav-item"><Link className="nav-link" to="/dashboard">Dashboard</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/predict">Predict</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/crops">My Crops</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/history">History</Link></li>
              </>
            )}
          </ul>
          <ul className="navbar-nav">
            {user ? (
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle user-menu" href="#" data-bs-toggle="dropdown">
                  <span className="user-avatar"><i className="bi bi-person"></i></span> {user.name}
                </a>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li><Link className="dropdown-item" to="/profile">Profile</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><button className="dropdown-item" onClick={handleLogout}>Logout</button></li>
                </ul>
              </li>
            ) : (
              <>
                <li className="nav-item"><Link className="nav-link nav-login" to="/login">Log in</Link></li>
                <li className="nav-item"><Link className="btn btn-success nav-signup" to="/register">Get started <i className="bi bi-arrow-up-right ms-1"></i></Link></li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}
