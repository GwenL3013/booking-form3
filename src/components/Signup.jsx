import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaFacebook, FaTwitter, FaGoogle } from 'react-icons/fa';
import { Button } from 'react-bootstrap';
import './Signup.css';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signup, googleSignIn, facebookSignIn, twitterSignIn } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      setError('');
      setLoading(true);
      await signup(email, password);
      navigate('/');
    } catch (err) {
      setError('Failed to create an account: ' + err.message);
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
    <div className="signup-bg">
      <div className="signup-card">
        <h2 className="text-center mb-4">Sign Up</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              id="email"
              placeholder="Enter your email"
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
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password-confirm" className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-control"
              id="password-confirm"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <Button
            disabled={loading}
            className="w-100 mb-3 signup-gradient-btn"
            type="submit"
          >
            SIGN UP
          </Button>
        </form>
        <div className="text-center mb-3">Or Sign Up using</div>
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
          Already have an account?{' '}
          <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
} 