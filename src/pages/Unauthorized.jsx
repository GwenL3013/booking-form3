import { Container, Alert, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Unauthorized() {
  const navigate = useNavigate();
  const { isAdmin, isUser } = useAuth();

  const handleRedirect = () => {
    if (isAdmin()) {
      navigate('/admin-dashboard');
    } else if (isUser()) {
      navigate('/');
    } else {
      navigate('/login');
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: "80vh" }}>
      <div className="w-100" style={{ maxWidth: "600px" }}>
        <Alert variant="danger">
          <Alert.Heading>Access Denied</Alert.Heading>
          <p>
            You do not have permission to access this page. This could be because:
          </p>
          <ul>
            <li>You are not logged in</li>
            <li>You are logged in but don't have the required role</li>
            <li>You are trying to access an admin page as a regular user</li>
          </ul>
          <hr />
          <div className="d-flex justify-content-end">
            <Button onClick={handleRedirect} variant="outline-danger">
              Go to {isAdmin() ? 'Admin Dashboard' : isUser() ? 'Home' : 'Login'}
            </Button>
          </div>
        </Alert>
      </div>
    </Container>
  );
} 