import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { createAdminUser, setupExistingUserAsAdmin } from '../utils/createAdmin';
import { useNavigate } from 'react-router-dom';

export default function AdminSetup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [isExistingUser, setIsExistingUser] = useState(true); // Default to existing user
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (isExistingUser) {
                await setupExistingUserAsAdmin(email, password);
                setSuccess('Existing user set up as admin successfully! You can now log in.');
            } else {
                await createAdminUser(email, password);
                setSuccess('New admin user created successfully! You can now log in.');
            }
            
            setTimeout(() => {
                navigate('/admin-login');
            }, 2000);
        } catch (error) {
            setError('Failed to set up admin user: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
            <div className="w-100" style={{ maxWidth: "400px" }}>
                <Card>
                    <Card.Body>
                        <h2 className="text-center mb-4">Set Up Admin User</h2>
                        {error && <Alert variant="danger">{error}</Alert>}
                        {success && <Alert variant="success">{success}</Alert>}
                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Check
                                    type="radio"
                                    label="Existing User"
                                    name="userType"
                                    checked={isExistingUser}
                                    onChange={() => setIsExistingUser(true)}
                                />
                                <Form.Check
                                    type="radio"
                                    label="New User"
                                    name="userType"
                                    checked={!isExistingUser}
                                    onChange={() => setIsExistingUser(false)}
                                />
                            </Form.Group>

                            <Form.Group id="email" className="mb-3">
                                <Form.Label>Admin Email</Form.Label>
                                <Form.Control
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </Form.Group>
                            <Form.Group id="password" className="mb-3">
                                <Form.Label>Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </Form.Group>
                            <Button
                                disabled={loading}
                                className="w-100"
                                type="submit"
                                variant="primary"
                            >
                                {loading ? 'Processing...' : (isExistingUser ? 'Set Up Existing User as Admin' : 'Create New Admin User')}
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
            </div>
        </Container>
    );
} 