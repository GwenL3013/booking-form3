import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useDispatch } from 'react-redux';
import { setUser } from '../authSlice'; // Assuming you have an auth slice for Redux
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Form fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    // Get the return URL if redirected from booking attempt
    const returnTo = location.state?.returnTo || '/dashboard';

    const handleAuth = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isLogin) {
                // Login
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                dispatch(setUser({
                    uid: userCredential.user.uid,
                    email: userCredential.user.email,
                    displayName: userCredential.user.displayName
                }));
            } else {
                // Sign up
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                // Update the user profile with the name
                await updateProfile(userCredential.user, {
                    displayName: name
                });

                dispatch(setUser({
                    uid: userCredential.user.uid,
                    email: userCredential.user.email,
                    displayName: name
                }));
            }

            // Check if there's a pending booking
            const pendingBooking = localStorage.getItem('pendingBooking');
            if (pendingBooking) {
                const tour = JSON.parse(pendingBooking);
                localStorage.removeItem('pendingBooking');
                navigate(`/booking/${tour.id}`);
            } else {
                navigate(returnTo);
            }

        } catch (error) {
            console.error("Authentication error:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const checkUserRole = async (uid) => {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            dispatch(setUser({
                uid: uid,
                email: userCredential.user.email,
                displayName: userCredential.user.displayName,
                role: userData.role || "user"
            }));
        } else if (!isLogin) {
            // New user registration, create user document
            await setDoc(userRef, {
                email: email,
                displayName: name,
                role: "user",
                createdAt: new Date()
            });

            dispatch(setUser({
                uid: uid,
                email: email,
                displayName: name,
                role: "user"
            }));
        }
    };

    return (
        <Container className="my-5">
            <Row className="justify-content-center">
                <Col md={6}>
                    <Card>
                        <Card.Body className="p-4">
                            <h2 className="text-center mb-4">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>

                            {error && <Alert variant="danger">{error}</Alert>}

                            <Form onSubmit={handleAuth}>
                                {!isLogin && (
                                    <Form.Group className="mb-3">
                                        <Form.Label>Full Name</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Enter your name"
                                            required={!isLogin}
                                        />
                                    </Form.Group>
                                )}

                                <Form.Group className="mb-3">
                                    <Form.Label>Email Address</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter email"
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Password"
                                        required
                                        minLength={6}
                                    />
                                </Form.Group>

                                <div className="d-grid">
                                    <Button
                                        variant="primary"
                                        type="submit"
                                        disabled={loading}
                                    >
                                        {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                                    </Button>
                                </div>
                            </Form>

                            <div className="text-center mt-3">
                                <p>
                                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                                    <Button
                                        variant="link"
                                        onClick={() => setIsLogin(!isLogin)}
                                        className="p-0"
                                    >
                                        {isLogin ? 'Sign Up' : 'Sign In'}
                                    </Button>
                                </p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}