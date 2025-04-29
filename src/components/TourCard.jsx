import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Modal, Form, Badge, Spinner } from 'react-bootstrap';
import { db, storage } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Carousel } from 'react-bootstrap';
import './TourCard.css';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/bootstrap.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
        paymentImage: null,
        additionalPax: [],  // Store the image file here
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

    // Handle form input change
    const handleChange = (e) => {
        const { name, value } = e.target;
        setBookingData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    // Handle the file change for payment image
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setBookingData((prevData) => ({
            ...prevData,
            paymentImage: file,  // Store the file in state
        }));
    };

    const handleAdditionalPaxChange = (index, e) => {
        const { name, value } = e.target;
        const updatedPax = [...bookingData.additionalPax];

        // Ensure each additional pax has the same structure
        updatedPax[index] = {
            ...updatedPax[index],
            [name]: value,
        };

        setBookingData((prevData) => ({
            ...prevData,
            additionalPax: updatedPax,
        }));
    };

    const generatePDF = (confirmationCode, formattedDate) => {
        const doc = new jsPDF();

        // Set fonts for headings and regular text
        doc.setFont("helvetica", "normal");
        doc.setFontSize(16);

        // Set Logo (assuming you have a base64 image for the logo)
        const logoImage = "data: image/png;base64,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"; // Base64 encoded image string
        doc.addImage(logoImage, "PNG", 10, 10, 40, 20);  // (image, type, x, y, width, height)

        // Set Company Address - top-left or near the logo
        doc.setFontSize(12);
        doc.text("BetaHoliday", 10, 35); // Customize with your company name
        doc.text("123 Super Road, Super City, Super Country", 10, 40); // Customize with your company address

        // Set Confirmation Title
        doc.setFontSize(20);
        doc.setTextColor(0, 102, 204); // Blue color
        doc.text("Booking Confirmation", 105, 20, { align: "center" });

        // Set Booking Date at top-right
        // Format the date
        doc.setFontSize(12);
        doc.setTextColor(0); // Reset text color to black
        doc.text(`Booking Date: ${formattedDate}`, 200, 20, { align: "right" }); // Position at top-right

        const addWatermark = () => {
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            doc.saveGraphicsState(); // Save current settings

            // Set opacity to make watermark very light
            doc.setGState(new doc.GState({ opacity: 0.20 }));  // 8% visibility

            doc.setFontSize(60);
            doc.setTextColor(200, 200, 200); // Even lighter gray
            doc.text('BetaHoliday', pageWidth / 2, pageHeight / 2, {
                align: 'center',
                angle: 45,
            });

            doc.restoreGraphicsState(); // Restore settings
        };

        const startTableY = 60;

        // Basic Booking Details
        const tableBody = [
            ["Confirmation Code", confirmationCode],
            ["Tour Id", bookingData.tourId],
            ["Tour Date", bookingData.date],
            ["Total Pax", bookingData.totalPax],
            ["Name", bookingData.name],
            ["Email", bookingData.email],
            ["Contact", bookingData.contact],
            ["Payment Method", bookingData.paymentMethod],
            ["Payment Amount", bookingData.paymentAmount],
            ["Payment Image URL", bookingData.paymentImageUrl || 'No payment image uploaded'],
        ];

        // Add additional pax if needed
        if (bookingData.totalPax > 1 && bookingData.additionalPax?.length > 0) {
            bookingData.additionalPax.forEach((pax, index) => {
                tableBody.push([`Additional Pax ${index + 1} Name`, pax.name]);
                tableBody.push([`Additional Pax ${index + 1} Contact`, pax.contact]);
            });
        }

        autoTable(doc, {
            head: [['Tour Name', bookingData.tourName]],  // 2 columns: Field and Value
            body: tableBody,
            startY: startTableY,
            theme: 'striped',
            headStyles: { fillColor: [0, 102, 204] },  // Blue header
            styles: { cellPadding: 3 },
            margin: { bottom: 30 },
            didDrawPage: (data) => {
                addWatermark();
                // FOOTER (centered on every page)
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                doc.setFontSize(10);
                doc.setTextColor(150);
                const footerText = "Thanks for booking with us!";
                const textWidth = doc.getTextWidth(footerText);
                const xCenter = (pageWidth - textWidth) / 2;
                doc.setFontSize(10);
                doc.setTextColor(150);
                doc.text(footerText, xCenter, pageHeight - 10);

                doc.text(`Page ${doc.internal.getCurrentPageInfo().pageNumber}`, pageWidth - 30, pageHeight - 10);
            },
        });

        // Open PDF in new tab and save after delay
        doc.output('dataurlnewwindow');
        setTimeout(() => {
            doc.save(`Booking_Confirmation_${confirmationCode}.pdf`);
        }, 3000);
    };

    // Handle booking form submission
    const validateForm = () => {
        const errors = {};

        if (!bookingData.name) errors.name = "Name is required";
        if (!bookingData.email) errors.email = "Email is required";
        if (!bookingData.contact) errors.contact = "Contact number is required";
        if (!bookingData.date) errors.date = "Tour date is required";
        if (bookingData.totalPax <= 0) errors.totalPax = "Number of participants must be at least 1";

        // Validate additional pax if needed
        if (bookingData.totalPax > 1) {
            bookingData.additionalPax.forEach((pax, index) => {
                if (!pax.name) {
                    errors[`additionalPax_${index}_name`] = `Name is required for additional participant ${index + 2}`;
                }
                if (!pax.contact) {
                    errors[`additionalPax_${index}_contact`] = `Contact is required for additional participant ${index + 2}`;
                }
            });
        }

        setErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Double check authentication - if not logged in, show login prompt
        if (!user) {
            setShowModal(false);
            setShowLoginPrompt(true);
            return;
        }

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const bookingDate = new Date(); // Capture booking date
            const formattedDate = bookingDate.toLocaleDateString(); // Format for PDF

            const confirmationCode = `CONF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

            setBookingData((prevData) => ({
                ...prevData,
                confirmationCode,
                userId: user.uid, // Ensure user ID is included
            }));

            let paymentImageUrl = '';

            if (bookingData.paymentImage) {
                const storageRef = ref(storage, `payment_images/${user.uid}_${Date.now()}_${bookingData.paymentImage.name}`);
                const uploadTask = uploadBytesResumable(storageRef, bookingData.paymentImage);

                // Use promise-based approach for cleaner code
                try {
                    await new Promise((resolve, reject) => {
                        uploadTask.on(
                            "state_changed",
                            (snapshot) => {
                                // You could add progress tracking here if desired
                            },
                            (error) => reject(error),
                            () => resolve()
                        );
                    });

                    paymentImageUrl = await getDownloadURL(uploadTask.snapshot.ref);
                } catch (error) {
                    console.error("Upload failed", error);
                    toast.error('Failed to upload payment image. Please try again.');
                    setIsLoading(false);
                    return;
                }
            }

            // Save booking with user ID and payment image URL
            const bookingToSave = {
                ...bookingData,
                confirmationCode,
                paymentImageUrl,
                bookingDate: bookingDate.toISOString(),
                userId: user.uid,
                status: 'pending' // You might want to add a status field
            };

            // Remove the actual file object before saving to Firestore
            delete bookingToSave.paymentImage;

            await addDoc(collection(db, 'bookings'), bookingToSave);

            // Generate the PDF
            generatePDF(confirmationCode, formattedDate);

            // Close modal and show success message
            setShowModal(false);
            toast.success('Booking successful! You can view your booking details in your account.');

            // Optionally redirect to "My Bookings" page
            // navigate('/my-bookings');
        } catch (error) {
            console.error("Error submitting booking:", error);
            toast.error('An error occurred while processing your booking. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle "Book Now" button click to navigate to the tour details page
    const handleCardClick = () => {
        navigate(`/tour/${tour.id}`);
    };

    const handleCarouselClick = (e) => {
        e.stopPropagation();  // Prevent the event from propagating to the parent Card
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
                        Price: RM {tour.price}
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
                                        onChange={(e) => handleAdditionalPaxChange(index, e)}
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
                                        onChange={(e) => handleAdditionalPaxChange(index, e)}
                                        isInvalid={!!errors[`additionalPax_${index}_contact`]}
                                        required
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors[`additionalPax_${index}_contact`]}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </div>
                        ))}

                        {/* Payment Image Upload */}
                        <Form.Group controlId="formBasicFile" className="mb-3">
                            <Form.Label>Upload Payment Image (e.g., receipt)</Form.Label>
                            <Form.Control
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </Form.Group>

                        {/* Preview the uploaded image (optional) */}
                        {bookingData.paymentImage && (
                            <div className="mb-3">
                                <h5>Uploaded Image Preview:</h5>
                                <img
                                    src={URL.createObjectURL(bookingData.paymentImage)}
                                    alt="Payment Preview"
                                    style={{ width: "150px", marginTop: "10px" }}
                                />
                            </div>
                        )}

                        {/* Terms and Conditions Consent */}
                        <Form.Group controlId="formTerms" className="mb-3">
                            <Form.Check
                                type="checkbox"
                                label="I agree to the Terms and Conditions"
                                required
                            />
                        </Form.Group>

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