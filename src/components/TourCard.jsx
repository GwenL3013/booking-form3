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
        const logoImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAfQAAAH0CAYAAADL1t+KAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAE6mlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSfvu78nIGlkPSdXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQnPz4KPHg6eG1wbWV0YSB4bWxuczp4PSdhZG9iZTpuczptZXRhLyc+CjxyZGY6UkRGIHhtbG5zOnJkZj0naHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyc+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczpBdHRyaWI9J2h0dHA6Ly9ucy5hdHRyaWJ1dGlvbi5jb20vYWRzLzEuMC8nPgogIDxBdHRyaWI6QWRzPgogICA8cmRmOlNlcT4KICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0nUmVzb3VyY2UnPgogICAgIDxBdHRyaWI6Q3JlYXRlZD4yMDI1LTAzLTE1PC9BdHRyaWI6Q3JlYXRlZD4KICAgICA8QXR0cmliOkV4dElkPjY0ZDgwZjVjLTRmMDUtNDc5My04MThmLTU5ZWM2OWVmNzhiMTwvQXR0cmliOkV4dElkPgogICAgIDxBdHRyaWI6RmJJZD41MjUyNjU5MTQxNzk1ODA8L0F0dHJpYjpGYklkPgogICAgIDxBdHRyaWI6VG91Y2hUeXBlPjI8L0F0dHJpYjpUb3VjaFR5cGU+CiAgICA8L3JkZjpsaT4KICAgPC9yZGY6U2VxPgogIDwvQXR0cmliOkFkcz4KIDwvcmRmOkRlc2NyaXB0aW9uPgoKIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PScnCiAgeG1sbnM6ZGM9J2h0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvJz4KICA8ZGM6dGl0bGU+CiAgIDxyZGY6QWx0PgogICAgPHJkZjpsaSB4bWw6bGFuZz0neC1kZWZhdWx0Jz5Zb3VyIHBhcmFncmFwaCB0ZXh0IC0gMTwvcmRmOmxpPgogICA8L3JkZjpBbHQ+CiAgPC9kYzp0aXRsZT4KIDwvcmRmOkRlc2NyaXB0aW9uPgoKIDxyZGY6RGVzY3Jp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"; // Replace with your logo base64 string
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