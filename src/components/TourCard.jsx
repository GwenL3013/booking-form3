import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Modal, Form, Badge, Spinner } from 'react-bootstrap';
import { db } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { Carousel } from 'react-bootstrap';
import './TourCard.css';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/bootstrap.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../context/AuthContext';

const TourCard = ({ tour }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [dialCode, setDialCode] = useState('60');
    const [bookingData, setBookingData] = useState({
        name: '',
        email: '',
        contact: '',
        date: '',
        tourId: tour.id,
        tourName: tour.name,
        confirmationCode: '',
        totalPax: 1,
        additionalPax: [],
        userId: user ? user.uid : null,
    });

    const handleShow = () => {
        if (!user) {
            setShowLoginPrompt(true);
        } else {
            setShowModal(true);
            // Pre-fill user data if available
            setBookingData(prev => ({
                ...prev,
                name: user.displayName || '',
                email: user.email || '',
                userId: user.uid
            }));
        }
    };

    const handleClose = () => setShowModal(false);
    const handleLoginPromptClose = () => setShowLoginPrompt(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setBookingData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});

        try {
            // Generate a random confirmation code
            const confirmationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            
            // Add the booking to Firestore
            await addDoc(collection(db, 'bookings'), {
                ...bookingData,
                confirmationCode,
                status: 'pending',
                bookingDate: new Date().toISOString()
            });

            toast.success('Booking submitted successfully!');
            handleClose();
        } catch (error) {
            console.error("Error submitting booking:", error);
            toast.error('An error occurred while processing your booking. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCardClick = () => {
        navigate(`/tour/${tour.id}`);
    };

    const handleCarouselClick = (e) => {
        e.stopPropagation();
    };

    const handleTotalPaxChange = (e) => {
        const totalPax = parseInt(e.target.value, 10);
        setBookingData((prevData) => {
            const newAdditionalPax = Array.from({ length: Math.max(0, totalPax - 1) }, (_, i) => 
                prevData.additionalPax[i] || { name: '', contact: '' }
            );
            return {
                ...prevData,
                totalPax,
                additionalPax: newAdditionalPax,
            };
        });
    };

    const redirectToLogin = () => {
        handleLoginPromptClose();
        navigate('/login', { state: { returnUrl: `/tour/${tour.id}` } });
    };

    const redirectToSignup = () => {
        handleLoginPromptClose();
        navigate('/signup', { state: { returnUrl: `/tour/${tour.id}` } });
    };

    return (
        <div className="tour-cards-container">
            <Card
                key={tour.id}
                className="tour-card shadow-sm rounded-4 overflow-hidden"
                onClick={(e) => {
                    const isInsideImage = e.target.closest('img');
                    const isInsideCardBody = e.target.closest('.card-body');
                    const button = e.target.closest('button');
                    const isFullyBooked = e.target.closest('[data-role="fully-booked"]');

                    const shouldIgnoreClick = isInsideImage || button || isFullyBooked;

                    if (isInsideCardBody && !shouldIgnoreClick) {
                        handleCardClick();
                    }
                }}
                style={{ cursor: 'pointer', border: 'none' }}
            >
                <div className="position-relative">
                    {tour.images && tour.images.length > 0 && (
                        <Carousel
                            nextLabel={null}
                            prevLabel={null}
                            controls={true}
                            indicators={false}
                            onClick={handleCarouselClick}
                        >
                            {tour.images.map((url, index) => (
                                <Carousel.Item key={index}>
                                    <img
                                        src={url}
                                        alt={`Slide ${index}`}
                                        className="w-100"
                                        style={{
                                            height: '200px',
                                            objectFit: 'cover',
                                            border: 'none',
                                            display: 'block',
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    {/* Mobile Overlay */}
                                    <div className="d-md-none image-overlay">
                                        <h5 className="card-title">{tour.name}</h5>
                                        <p className="card-text">{tour.description}</p>
                                        <h6 className="card-subtitle">Price: RM {tour.price}</h6>
                                    </div>
                                </Carousel.Item>
                            ))}
                        </Carousel>
                    )}
                    {tour.status && (
                        <Badge
                            bg={
                                tour.status === 'available'
                                    ? 'success'
                                    : tour.status === 'sold-out'
                                        ? 'danger'
                                        : 'warning'
                            }
                            className="position-absolute top-0 start-0 m-2 text-uppercase fw-bold"
                        >
                            {tour.status.replace('-', ' ')}
                        </Badge>
                    )}
                </div>
                <Card.Body>
                    <Card.Title>{tour.name}</Card.Title>
                    <Card.Text>{tour.description}</Card.Text>
                    <Card.Subtitle className="mb-2 text-muted">
                        Price from : RM {tour.price}
                    </Card.Subtitle>
                    <div data-role={tour.status === 'sold-out' ? 'fully-booked' : 'book-now'}>
                        <Button
                            variant={tour.status === 'sold-out' ? 'danger' : 'primary'}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (tour.status !== 'sold-out') {
                                    handleShow();
                                }
                            }}
                            disabled={tour.status === 'sold-out'}
                            style={{
                                cursor: tour.status === 'sold-out' ? 'default' : 'pointer',
                            }}
                        >
                            {tour.status === 'sold-out' ? 'Fully Booked' : 'Book Now'}
                        </Button>
                    </div>
                </Card.Body>
            </Card>

            {/* Modal for Booking Form */}
            <Modal show={showModal} onHide={handleClose} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Booking Form for {tour.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        {/* Personal Details */}
                        <Form.Group controlId="formBasicName" className="mb-3">
                            <Form.Label>Full Name as per ID</Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                placeholder="Enter your full name"
                                value={bookingData.name}
                                onChange={handleChange}
                                isInvalid={!!errors.name}
                                required
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.name}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group controlId="formBasicEmail" className="mb-3">
                            <Form.Label>Email Address</Form.Label>
                            <Form.Control
                                type="email"
                                name="email"
                                placeholder="Enter your email"
                                value={bookingData.email}
                                onChange={handleChange}
                                isInvalid={!!errors.email}
                                required
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.email}
                            </Form.Control.Feedback>
                        </Form.Group>

                        {/* Contact Number */}
                        <Form.Group controlId="formBasicContact" className="mb-3">
                            <Form.Label>Contact Number</Form.Label>
                            <PhoneInput
                                country={'my'}
                                value={bookingData.contact}
                                onChange={(phone, countryData) => {
                                    setBookingData({ ...bookingData, contact: phone });
                                    if (countryData?.dialCode) {
                                        setDialCode(countryData.dialCode);
                                    }
                                }}
                                inputStyle={{
                                    width: "100%",
                                    height: "38px",
                                    padding: "0.375rem 0.75rem",
                                    border: errors.contact ? "1px solid #dc3545" : "1px solid #ced4da",
                                    borderRadius: "0.375rem",
                                    fontSize: "1rem",
                                    fontFamily: "inherit",
                                }}
                                buttonStyle={{
                                    borderTopLeftRadius: "0.375rem",
                                    borderBottomLeftRadius: "0.375rem",
                                    borderRight: "1px solid #ced4da",
                                    backgroundColor: "#fff",
                                }}
                                placeholder={`+${dialCode} `}
                                enableSearch
                                preferredCountries={['my', 'sg', 'us', 'gb']}
                                required
                            />
                            {errors.contact && (
                                <div className="text-danger small mt-1">
                                    {errors.contact}
                                </div>
                            )}
                        </Form.Group>

                        {/* Date of Tour */}
                        <Form.Group controlId="formBasicDate" className="mb-3">
                            <Form.Label>Date of Tour</Form.Label>
                            <Form.Control
                                type="date"
                                name="date"
                                value={bookingData.date}
                                onChange={handleChange}
                                isInvalid={!!errors.date}
                                required
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.date}
                            </Form.Control.Feedback>
                        </Form.Group>

                        {/* Number of People */}
                        <Form.Group controlId="formBasicPeople" className="mb-3">
                            <Form.Label>Number of Pax</Form.Label>
                            <Form.Control
                                type="number"
                                name="totalPax"
                                placeholder="How many people will be joining?"
                                value={bookingData.totalPax}
                                onChange={handleTotalPaxChange}
                                isInvalid={!!errors.totalPax}
                                required
                                min={1}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.totalPax}
                            </Form.Control.Feedback>
                        </Form.Group>

                        {/* Special Requests */}
                        <Form.Group controlId="formBasicSpecialRequest" className="mb-3">
                            <Form.Label>Special Requests</Form.Label>
                            <Form.Control
                                as="textarea"
                                name="specialRequest"
                                rows={3}
                                placeholder="Any special requirements? (e.g., vegetarian meals, wheelchair access)"
                                value={bookingData.specialRequest}
                                onChange={handleChange}
                            />
                        </Form.Group>

                        {/* Dynamic Inputs for Additional Pax */}
                        {bookingData.totalPax > 1 && bookingData.additionalPax.map((pax, index) => (
                            <div key={index} className="p-3 mb-3 border rounded">
                                <h5>Additional Pax {index + 2}</h5>
                                <Form.Group controlId={`formAdditionalName${index}`} className="mb-3">
                                    <Form.Label>Full Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        placeholder={`Enter name for additional pax ${index + 2}`}
                                        value={pax.name}
                                        onChange={(e) => handleChange({ target: { name: `additionalPax_${index}_name`, value: e.target.value } })}
                                        isInvalid={!!errors[`additionalPax_${index}_name`]}
                                        required
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors[`additionalPax_${index}_name`]}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group controlId={`formAdditionalContact${index}`} className="mb-3">
                                    <Form.Label>Contact Number</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="contact"
                                        placeholder={`Enter contact number for pax ${index + 2}`}
                                        value={pax.contact}
                                        onChange={(e) => handleChange({ target: { name: `additionalPax_${index}_contact`, value: e.target.value } })}
                                        isInvalid={!!errors[`additionalPax_${index}_contact`]}
                                        required
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors[`additionalPax_${index}_contact`]}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </div>
                        ))}

                        <Button variant="primary" type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Spinner
                                        as="span"
                                        animation="border"
                                        size="sm"
                                        role="status"
                                        aria-hidden="true"
                                        className="me-2"
                                    />
                                    Processing...
                                </>
                            ) : (
                                'Submit Booking'
                            )}
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Login Prompt Modal */}
            <Modal show={showLoginPrompt} onHide={handleLoginPromptClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Authentication Required</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>You need to be logged in to book a tour. Please log in or create an account to continue.</p>
                    <div className="d-flex justify-content-center mt-3 gap-3">
                        <Button variant="primary" onClick={redirectToLogin}>
                            Log In
                        </Button>
                        <Button variant="outline-primary" onClick={redirectToSignup}>
                            Sign Up
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default TourCard;