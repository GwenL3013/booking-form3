import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaFacebook, FaTwitter, FaGoogle } from 'react-icons/fa';
import { Button } from 'react-bootstrap';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, googleSignIn, facebookSignIn, twitterSignIn } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Failed to sign in: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      await googleSignIn();
      navigate('/');
    } catch (err) {
      setError('Failed to sign in with Google: ' + err.message);
    }
  }

  async function handleFacebookSignIn() {
    try {
      await facebookSignIn();
      navigate('/');
    } catch (err) {
      setError('Failed to sign in with Facebook: ' + err.message);
    }
  }

  async function handleTwitterSignIn() {
    try {
      await twitterSignIn();
      navigate('/');
    } catch (err) {
      setError('Failed to sign in with Twitter: ' + err.message);
    }
  }

  return (
    <div className="login-bg">
      <div className="login-card">
        <h2 className="text-center mb-4">Login</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Username</label>
            <input
              type="email"
              className="form-control"
              id="email"
              placeholder="Type your username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              id="password"
              placeholder="Type your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button
            disabled={loading}
            className="w-100 mb-3 login-gradient-btn"
            type="submit"
          >
            LOGIN
          </Button>
        </form>
        <div className="text-center mb-3">
          <small>
            <Link to="/forgot-password">Forgot password?</Link>
          </small>
        </div>
        <div className="text-center mb-3">Or Sign In using</div>
        <div className="d-flex justify-content-center gap-3 mb-3">
          <Button variant="outline-primary" onClick={handleFacebookSignIn}>
            <FaFacebook />
          </Button>
          <Button variant="outline-info" onClick={handleTwitterSignIn}>
            <FaTwitter />
          </Button>
          <Button variant="outline-danger" onClick={handleGoogleSignIn}>
            <FaGoogle />
          </Button>
        </div>
        <div className="text-center">
          Or Sign Up Using
          <div>
            <Link to="/signup" className="btn btn-link">SIGN UP</Link>
          </div>
        </div>
      </div>
    </div>
  );
} 