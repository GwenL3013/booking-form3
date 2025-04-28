import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { recreateAuthUser } from '../utils/recreateAuthUser';
import { useNavigate } from 'react-router-dom';

export default function RecreateAuthUser() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [migrationInfo, setMigrationInfo] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setMigrationInfo(null);
        setLoading(true);

        try {
            const user = await recreateAuthUser(email, password);
            setSuccess('User authentication record has been successfully recreated!');
            setMigrationInfo({
                newUid: user.uid,
                email: user.email
            });
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="mt-5">
            <Card className="mx-auto" style={{ maxWidth: '500px' }}>
                <Card.Body>
                    <h2 className="text-center mb-4">Recreate Authentication</h2>
                    <Alert variant="info" className="mb-4">
                        This process will:
                        <ul className="mb-0">
                            <li>Find your existing user data in the database</li>
                            <li>Create a new authentication record</li>
                            <li>Migrate all your data to the new authentication record</li>
                            <li>Preserve your access to all your existing data</li>
                        </ul>
                    </Alert>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}
                    {migrationInfo && (
                        <Alert variant="info">
                            <p>Migration successful!</p>
                            <p>New UID: {migrationInfo.newUid}</p>
                            <p>Email: {migrationInfo.email}</p>
                            <p>You will be redirected to the login page shortly...</p>
                        </Alert>
                    )}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>New Password</Form.Label>
                            <Form.Control
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <Form.Text className="text-muted">
                                This will be your new password for authentication
                            </Form.Text>
                        </Form.Group>
                        <Button
                            type="submit"
                            className="w-100"
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Recreate Authentication'}
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
} 