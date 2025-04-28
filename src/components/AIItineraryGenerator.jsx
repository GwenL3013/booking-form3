import React, { useState } from 'react';
import { Container, Form, Button, Card, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const AIItineraryGenerator = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [itinerary, setItinerary] = useState(null);
    const [formData, setFormData] = useState({
        destination: '',
        duration: '3',
        interests: [],
        budget: 'medium',
        travelStyle: 'balanced'
    });

    const interestsOptions = [
        'Adventure', 'Culture', 'Food', 'Nature', 'Shopping',
        'History', 'Art', 'Relaxation', 'Nightlife', 'Family'
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleInterestToggle = (interest) => {
        setFormData(prev => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest]
        }));
    };

    const generateItinerary = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Here you would integrate with an AI service like OpenAI
            // For now, we'll simulate a response
            const mockItinerary = {
                days: Array(parseInt(formData.duration)).fill().map((_, dayIndex) => ({
                    day: dayIndex + 1,
                    activities: [
                        {
                            time: '09:00',
                            activity: 'Breakfast at local cafe',
                            description: 'Start your day with traditional local cuisine'
                        },
                        {
                            time: '10:30',
                            activity: 'Visit main attraction',
                            description: 'Explore the most popular tourist spot'
                        },
                        {
                            time: '12:30',
                            activity: 'Lunch',
                            description: 'Enjoy local specialties'
                        },
                        {
                            time: '14:00',
                            activity: 'Cultural activity',
                            description: 'Experience local culture'
                        }
                    ]
                }))
            };

            setItinerary(mockItinerary);
        } catch (err) {
            setError('Failed to generate itinerary. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="py-4">
            <h2 className="mb-4">AI-Powered Itinerary Generator</h2>
            
            <Card className="mb-4">
                <Card.Body>
                    <Form onSubmit={generateItinerary}>
                        <Form.Group className="mb-3">
                            <Form.Label>Destination</Form.Label>
                            <Form.Control
                                type="text"
                                name="destination"
                                value={formData.destination}
                                onChange={handleChange}
                                placeholder="Enter your destination"
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Duration (days)</Form.Label>
                            <Form.Select
                                name="duration"
                                value={formData.duration}
                                onChange={handleChange}
                            >
                                {[1, 2, 3, 4, 5, 6, 7].map(days => (
                                    <option key={days} value={days}>{days} {days === 1 ? 'day' : 'days'}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Interests</Form.Label>
                            <div className="d-flex flex-wrap gap-2">
                                {interestsOptions.map(interest => (
                                    <Button
                                        key={interest}
                                        variant={formData.interests.includes(interest) ? 'primary' : 'outline-primary'}
                                        onClick={() => handleInterestToggle(interest)}
                                        size="sm"
                                    >
                                        {interest}
                                    </Button>
                                ))}
                            </div>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Budget</Form.Label>
                            <Form.Select
                                name="budget"
                                value={formData.budget}
                                onChange={handleChange}
                            >
                                <option value="low">Budget</option>
                                <option value="medium">Moderate</option>
                                <option value="high">Luxury</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Travel Style</Form.Label>
                            <Form.Select
                                name="travelStyle"
                                value={formData.travelStyle}
                                onChange={handleChange}
                            >
                                <option value="relaxed">Relaxed</option>
                                <option value="balanced">Balanced</option>
                                <option value="active">Active</option>
                            </Form.Select>
                        </Form.Group>

                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                                    Generating...
                                </>
                            ) : 'Generate Itinerary'}
                        </Button>
                    </Form>
                </Card.Body>
            </Card>

            {error && <Alert variant="danger">{error}</Alert>}

            {itinerary && (
                <Card>
                    <Card.Body>
                        <h3 className="mb-4">Your Personalized Itinerary</h3>
                        {itinerary.days.map(day => (
                            <div key={day.day} className="mb-4">
                                <h4>Day {day.day}</h4>
                                {day.activities.map((activity, index) => (
                                    <div key={index} className="mb-3">
                                        <div className="d-flex justify-content-between">
                                            <strong>{activity.time}</strong>
                                            <strong>{activity.activity}</strong>
                                        </div>
                                        <p className="text-muted mb-0">{activity.description}</p>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </Card.Body>
                </Card>
            )}
        </Container>
    );
};

export default AIItineraryGenerator; 