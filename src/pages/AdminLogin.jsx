import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import './AdminLogin.css';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const db = getFirestore();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      const userCredential = await login(email, password);
      
      // Check if the user has admin role
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        // If not admin, sign them out and show error
        await userCredential.user.delete();
        setError('Access denied. This login is for administrators only.');
      }
    } catch (err) {
      setError('Failed to sign in: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="adminlogin-bg">
      <div className="adminlogin-card">
        <div className="adminlogin-slogan">THE JOURNEY GOES ON</div>
        <Card className="adminlogin-inner-card">
          <Card.Body>
            <h2 className="text-center mb-4 adminlogin-title">Admin Login</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group id="email" className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter admin email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="adminlogin-input"
                />
              </Form.Group>
              <Form.Group id="password" className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="adminlogin-input"
                />
              </Form.Group>
              <Button
                disabled={loading}
                className="w-100 adminlogin-gradient-btn"
                type="submit"
              >
                Admin Login
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}
