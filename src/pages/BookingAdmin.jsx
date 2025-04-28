import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { Form, Button, Spinner, Alert, Card } from 'react-bootstrap';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/bootstrap.css';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function addWatermark(doc) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.10 }));
    doc.setFontSize(60);
    doc.setTextColor(180, 180, 180);
    doc.text('BetaHoliday', pageWidth / 2, pageHeight / 2, {
        align: 'center',
        angle: 45,
    });
    doc.restoreGraphicsState();
}

const BookingAdmin = () => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [tours, setTours] = useState([]);
    const [dialCode, setDialCode] = useState('60');
    const [bookingData, setBookingData] = useState({
        name: '',
        email: '',
        contact: '',
        date: '',
        tourId: '',
        tourName: '',
        confirmationCode: '',
        totalPax: 1,
        specialRequest: '',
        additionalPax: [],
        status: 'pending',
        bookingDate: new Date().toISOString()
    });

    useEffect(() => {
        fetchTours();
    }, []);

    const fetchTours = async () => {
        try {
            const toursCollection = collection(db, 'tourCards');
            const querySnapshot = await getDocs(toursCollection);
            const toursList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTours(toursList);
        } catch (error) {
            console.error('Error fetching tours:', error);
            toast.error('Failed to fetch tours');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setBookingData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleTourSelect = (e) => {
        const selectedTourId = e.target.value;
        const selectedTour = tours.find(tour => tour.id === selectedTourId);

        setBookingData(prev => ({
            ...prev,
            tourId: selectedTourId,
            tourName: selectedTour ? selectedTour.name : ''
        }));
    };

    const handleAdditionalPaxChange = (index, e) => {
        const { name, value } = e.target;
        const updatedPax = [...bookingData.additionalPax];
        updatedPax[index] = {
            ...updatedPax[index],
            [name]: value
        };
        setBookingData(prev => ({
            ...prev,
            additionalPax: updatedPax
        }));
    };

    const validateForm = () => {
        const errors = {};

        if (!bookingData.name) errors.name = 'Name is required';
        if (!bookingData.email) errors.email = 'Email is required';
        if (!bookingData.contact) errors.contact = 'Contact is required';
        if (!bookingData.date) errors.date = 'Date is required';
        if (!bookingData.tourId) errors.tourId = 'Tour selection is required';
        if (!bookingData.totalPax || bookingData.totalPax < 1) errors.totalPax = 'Number of pax is required';

        // Validate additional pax
        bookingData.additionalPax.forEach((pax, index) => {
            if (!pax.name) errors[`additionalPax_${index}_name`] = `Name is required for additional participant ${index + 2}`;
            if (!pax.contact) errors[`additionalPax_${index}_contact`] = `Contact is required for additional participant ${index + 2}`;
        });

        setErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            console.log('Form validation failed');
            return;
        }

        setIsLoading(true);

        try {
            console.log('Starting booking creation process...');
            const confirmationCode = `CONF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

            // Format the date to ensure consistency
            const formattedDate = new Date(bookingData.date).toISOString().split('T')[0];

            const bookingToSave = {
                name: bookingData.name,
                email: bookingData.email,
                contact: bookingData.contact,
                date: formattedDate,
                tourId: bookingData.tourId,
                tourName: bookingData.tourName,
                confirmationCode: confirmationCode,
                totalPax: parseInt(bookingData.totalPax),
                specialRequest: bookingData.specialRequest || '',
                additionalPax: bookingData.additionalPax || [],
                status: 'pending',
                bookingDate: new Date().toISOString(),
                paymentImageUrl: null,
                userId: user.uid,
                lastUpdated: new Date().toISOString()
            };

            console.log('Prepared booking data:', bookingToSave);

            // Verify Firestore connection
            if (!db) {
                throw new Error('Firestore database not initialized');
            }

            // Add the booking to Firestore
            console.log('Attempting to save to Firestore...');
            const bookingsCollection = collection(db, 'bookings');
            console.log('Collection reference created');

            const docRef = await addDoc(bookingsCollection, bookingToSave);
            console.log('Document saved successfully with ID:', docRef.id);

            // Show success message immediately
            toast.success(`Booking created successfully! Confirmation Code: ${confirmationCode}`);

            // Reset form immediately
            setBookingData({
                name: '',
                email: '',
                contact: '',
                date: '',
                tourId: '',
                tourName: '',
                confirmationCode: '',
                totalPax: 1,
                specialRequest: '',
                additionalPax: [],
                status: 'pending',
                bookingDate: new Date().toISOString()
            });

            // Generate PDF in a separate try-catch to not block the main flow
            try {
                console.log('Starting PDF generation...');
                const doc = new jsPDF();
                console.log('PDF document created');

                // --- LOGO & COMPANY INFO ---
                // const logoImage = "data:image/png;base64,iVBOElFTkSuQmCC"; // Replace with your real base64 logo
                //doc.addImage(logoImage, 'PNG', 10, 10, 50, 30);
                doc.setFontSize(12);
                doc.setTextColor(0, 0, 0);
                doc.text("BetaHoliday", 10, 45);
                doc.text("123 Super Road, Super City, Super Country", 10, 52);

                // --- TITLE & BOOKING DATE ---
                doc.setFontSize(22);
                doc.setTextColor(0, 102, 204);
                doc.text("Booking Confirmation", 10, 25);
                doc.setFontSize(12);
                doc.setTextColor(0, 0, 0);
                doc.text(`Booking Date: ${formattedDate}`, 200, 20, { align: 'right' });

                // --- TABLE DATA ---
                const tableBody = [
                    ["Confirmation Code", confirmationCode],
                    ["Tour Id", bookingData.tourId],
                    ["Tour Date", bookingData.date],
                    ["Total Pax", bookingData.totalPax],
                    ["Name", bookingData.name],
                    ["Email", bookingData.email],
                    ["Contact", bookingData.contact],
                    ["Payment Method", bookingData.paymentMethod || ''],
                    ["Payment Amount", bookingData.paymentAmount || ''],
                    ["Payment Image URL", bookingData.paymentImageUrl || 'No payment image uploaded'],
                ];
                if (bookingData.totalPax > 1 && bookingData.additionalPax?.length > 0) {
                    bookingData.additionalPax.forEach((pax, index) => {
                        tableBody.push([`Additional Pax ${index + 1} Name`, pax.name]);
                        tableBody.push([`Additional Pax ${index + 1} Contact`, pax.contact]);
                    });
                }

                // --- TABLE ---
                autoTable(doc, {
                    head: [['Tour Name', bookingData.tourName]],
                    body: tableBody,
                    startY: 60,
                    theme: 'striped',
                    headStyles: { fillColor: [0, 102, 204], halign: 'left', fontStyle: 'bold', fontSize: 13 },
                    styles: { cellPadding: 3, fontSize: 12 },
                    margin: { left: 10, right: 10 },
                    columnStyles: {
                        0: { halign: 'left' },
                        1: { halign: 'left' },
                    },
                    didDrawPage: (data) => {
                        addWatermark(doc);
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

                // --- SAVE PDF ---
                doc.save(`Booking_Confirmation_${confirmationCode}.pdf`);
                console.log('PDF saved successfully');

            } catch (pdfError) {
                console.error('Error in PDF generation:', pdfError);
                toast.error('PDF generation failed. You can try downloading it later.');
            }
        } catch (error) {
            console.error('Detailed error creating booking:', error);
            console.error('Error stack:', error.stack);
            toast.error(`Failed to create booking: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Dynamically add additional pax if totalPax is increased
    useEffect(() => {
        if (bookingData.totalPax > bookingData.additionalPax.length + 1) {
            const newAdditionalPax = [...bookingData.additionalPax];
            for (let i = newAdditionalPax.length; i < bookingData.totalPax - 1; i++) {
                newAdditionalPax.push({ name: '', contact: '' });
            }
            setBookingData(prev => ({
                ...prev,
                additionalPax: newAdditionalPax
            }));
        } else if (bookingData.totalPax < bookingData.additionalPax.length + 1) {
            const newAdditionalPax = bookingData.additionalPax.slice(0, bookingData.totalPax - 1);
            setBookingData(prev => ({
                ...prev,
                additionalPax: newAdditionalPax
            }));
        }
    }, [bookingData.totalPax]);

    return (
        <div style={{ padding: '2rem' }}>
            <Card className="shadow mx-auto" style={{ maxWidth: '800px', width: '100%' }}>
                <Card.Header className="bg-primary text-white">
                    <h3 className="mb-0">Create New Booking</h3>
                </Card.Header>
                <Card.Body className="p-4">
                    <Form onSubmit={handleSubmit}>
                        {/* Tour Selection */}
                        <Form.Group className="mb-3">
                            <Form.Label>Select Tour</Form.Label>
                            <Form.Select
                                name="tourId"
                                value={bookingData.tourId}
                                onChange={handleTourSelect}
                                isInvalid={!!errors.tourId}
                                required
                            >
                                <option value="">Select a tour</option>
                                {tours.map(tour => (
                                    <option key={tour.id} value={tour.id}>
                                        {tour.name}
                                    </option>
                                ))}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">
                                {errors.tourId}
                            </Form.Control.Feedback>
                        </Form.Group>

                        {/* Personal Details */}
                        <Form.Group className="mb-3">
                            <Form.Label>Full Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                value={bookingData.name}
                                onChange={handleChange}
                                isInvalid={!!errors.name}
                                required
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.name}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                type="email"
                                name="email"
                                value={bookingData.email}
                                onChange={handleChange}
                                isInvalid={!!errors.email}
                                required
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.email}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Contact Number</Form.Label>
                            <PhoneInput
                                country={'my'}
                                value={bookingData.contact}
                                onChange={(phone, countryData) => {
                                    setBookingData(prev => ({ ...prev, contact: phone }));
                                    if (countryData?.dialCode) {
                                        setDialCode(countryData.dialCode);
                                    }
                                }}
                                inputStyle={{
                                    width: "100%",
                                    height: "38px",
                                    padding: "0.375rem 0.75rem 0.375rem 48px",
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
                                countryCodeEditable={false}
                                inputProps={{ autoComplete: 'off' }}
                                required
                            />
                            {errors.contact && (
                                <div className="text-danger small mt-1">
                                    {errors.contact}
                                </div>
                            )}
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Tour Date</Form.Label>
                            <Form.Control
                                type="date"
                                name="date"
                                value={bookingData.date}
                                onChange={handleChange}
                                isInvalid={!!errors.date}
                                required
                                min={new Date().toISOString().split('T')[0]}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.date}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Number of Pax</Form.Label>
                            <Form.Control
                                type="number"
                                name="totalPax"
                                value={bookingData.totalPax}
                                onChange={handleChange}
                                isInvalid={!!errors.totalPax}
                                required
                                min={1}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.totalPax}
                            </Form.Control.Feedback>
                        </Form.Group>

                        {/* Additional Pax */}
                        {bookingData.totalPax > 1 && bookingData.additionalPax.map((pax, index) => (
                            <div key={index} className="p-3 mb-3 border rounded">
                                <h5>Additional Pax {index + 2}</h5>
                                <Form.Group className="mb-3">
                                    <Form.Label>Full Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        value={pax.name}
                                        onChange={(e) => handleAdditionalPaxChange(index, e)}
                                        isInvalid={!!errors[`additionalPax_${index}_name`]}
                                        required
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors[`additionalPax_${index}_name`]}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Contact Number</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="contact"
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

                        <Form.Group className="mb-3">
                            <Form.Label>Special Requests</Form.Label>
                            <Form.Control
                                as="textarea"
                                name="specialRequest"
                                rows={3}
                                value={bookingData.specialRequest}
                                onChange={handleChange}
                            />
                        </Form.Group>

                        <Button variant="primary" type="submit" disabled={isLoading} className="w-100">
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
                                    Creating Booking...
                                </>
                            ) : (
                                'Create Booking'
                            )}
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
};

export default BookingAdmin;
