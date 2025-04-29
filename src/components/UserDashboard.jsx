import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Tab, Nav, Form, Modal, Badge, Spinner, Alert, Table } from 'react-bootstrap';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/bootstrap.css';
import { FaCalendarAlt, FaEdit, FaUser, FaListAlt, FaCog, FaEye, FaCloudSun, FaBook, FaBookOpen, FaExchangeAlt, FaPlane } from 'react-icons/fa';
import Weather from './Weather';
import TodoList from './todo/TodoList';
import TodoCard from "./todo/TodoCard";
import { NavLink, Link, Outlet } from "react-router-dom";
import AddTodo from './todo/AddTodo';
import TranslatorPage from '../pages/TranslatorPage';
import CommunityFeed from '../pages/CommunityFeed';
import CommunityFeedImg from '../assets/community-feed.jpg';
import TravelDiariesList from './TravelDiariesList';
import TravelDiariesPage from '../pages/TravelDiariesPage';
import CurrencyConverter from './CurrencyConverter';
import PlanesPage from './PlanesPage';

const UserDashboard = () => {
    const { user, updateUserProfile } = useAuth();
    const [userBookings, setUserBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('bookings'); // Default to bookings tab
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const storage = getStorage();

    // Profile state
    const [profile, setProfile] = useState({
        displayName: user?.displayName || '',
        email: user?.email || '',
        phoneNumber: user?.phoneNumber || '',
        avatar: user?.photoURL || ''
    });

    // Edit booking modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentBooking, setCurrentBooking] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // View booking details modal
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Add Todo modal state
    const [showAddTodo, setShowAddTodo] = useState(false);

    // Load user profile data when component mounts
    useEffect(() => {
        if (user) {
            const fetchUserData = async () => {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        // Prioritize Firestore data over Auth data for profile picture
                        setProfile({
                            displayName: userData.displayName || user.displayName || '',
                            email: userData.email || user.email || '',
                            phoneNumber: userData.phoneNumber || user.phoneNumber || '',
                            avatar: userData.photoURL || user.photoURL || ''
                        });
                    } else {
                        // If no Firestore document exists, create one with current user data
                        await setDoc(doc(db, 'users', user.uid), {
                            displayName: user.displayName || '',
                            email: user.email || '',
                            phoneNumber: user.phoneNumber || '',
                            photoURL: user.photoURL || '',
                            createdAt: new Date().toISOString()
                        });
                        setProfile({
                            displayName: user.displayName || '',
                            email: user.email || '',
                            phoneNumber: user.phoneNumber || '',
                            avatar: user.photoURL || ''
                        });
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            };
            fetchUserData();
        }
    }, [user]);

    // Fetch user bookings on component mount
    useEffect(() => {
        if (user) {
            fetchUserBookings();
        }
    }, [user]);

    const fetchUserBookings = async () => {
        setIsLoading(true);
        try {
            const bookingsRef = collection(db, 'bookings');
            const q = query(bookingsRef, where("userId", "==", user.uid));
            const querySnapshot = await getDocs(q);

            const bookings = [];
            querySnapshot.forEach((doc) => {
                bookings.push({
                    id: doc.id,
                    ...doc.data(),
                    date: doc.data().date,
                    bookingDate: doc.data().bookingDate ? new Date(doc.data().bookingDate) : new Date()
                });
            });

            // Sort bookings by date (most recent first)
            bookings.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));

            setUserBookings(bookings);
        } catch (err) {
            console.error("Error fetching bookings:", err);
            setError("Failed to load your bookings. Please try again later.");
            toast.error("Failed to load your bookings");
        } finally {
            setIsLoading(false);
        }
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error('Image size should be less than 5MB');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedFile(file);
                // Don't update the profile avatar yet, just show preview
                setProfile(prev => ({
                    ...prev,
                    tempAvatar: reader.result // Use tempAvatar for preview
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadProfilePicture = async (file) => {
        if (!file) return null;

        const fileExtension = file.name.split('.').pop();
        const fileName = `profile-pictures/${user.uid}_${Date.now()}.${fileExtension}`;
        const storageRef = ref(storage, fileName);

        try {
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            return downloadURL;
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            throw error;
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setUploadingImage(true);

        try {
            let photoURL = profile.avatar;

            if (selectedFile) {
                // Upload new profile picture if one was selected
                photoURL = await uploadProfilePicture(selectedFile);
            }

            // Update user profile using the new updateUserProfile function
            await updateUserProfile({
                displayName: profile.displayName,
                photoURL: photoURL,
                phoneNumber: profile.phoneNumber
            });

            // Update local state
            setProfile(prev => ({
                ...prev,
                avatar: photoURL,
                tempAvatar: null
            }));

            // Update Firestore user document
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                displayName: profile.displayName,
                photoURL: photoURL,
                phoneNumber: profile.phoneNumber,
                updatedAt: new Date().toISOString()
            });

            setSelectedFile(null);
            toast.success("Profile updated successfully!");
        } catch (err) {
            console.error("Error updating profile:", err);
            toast.error("Failed to update profile");
        } finally {
            setIsSubmitting(false);
            setUploadingImage(false);
        }
    };

    const viewBookingDetails = (booking) => {
        setCurrentBooking(booking);
        setShowDetailsModal(true);
    };

    const openEditModal = (booking) => {
        setCurrentBooking(booking);

        // Initialize form data with current booking details
        setEditFormData({
            name: booking.name || '',
            email: booking.email || '',
            contact: booking.contact || '',
            date: booking.date || '',
            specialRequest: booking.specialRequest || '',
            totalPax: booking.totalPax || 1,
            additionalPax: booking.additionalPax || []
        });

        setShowEditModal(true);
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleContactChange = (phone) => {
        setEditFormData(prev => ({
            ...prev,
            contact: phone
        }));
    };

    const handleTotalPaxChange = (e) => {
        const totalPax = parseInt(e.target.value, 10);

        setEditFormData(prev => {
            const currentAdditionalPax = prev.additionalPax || [];
            let newAdditionalPax = [...currentAdditionalPax];

            // If increasing, add empty objects for new participants
            if (totalPax > prev.totalPax) {
                const additionalNeeded = totalPax - prev.totalPax;
                for (let i = 0; i < additionalNeeded; i++) {
                    newAdditionalPax.push({ name: '', contact: '' });
                }
            }
            // If decreasing, remove extra participants
            else if (totalPax < prev.totalPax) {
                newAdditionalPax = newAdditionalPax.slice(0, Math.max(0, totalPax - 1));
            }

            return {
                ...prev,
                totalPax,
                additionalPax: newAdditionalPax
            };
        });
    };

    const handleAdditionalPaxChange = (index, e) => {
        const { name, value } = e.target;

        setEditFormData(prev => {
            const updatedPax = [...prev.additionalPax];
            updatedPax[index] = {
                ...updatedPax[index],
                [name]: value
            };

            return {
                ...prev,
                additionalPax: updatedPax
            };
        });
    };

    const validateForm = () => {
        const errors = {};

        if (!editFormData.name) errors.name = "Name is required";
        if (!editFormData.email) errors.email = "Email is required";
        if (!editFormData.contact) errors.contact = "Contact number is required";
        if (!editFormData.date) errors.date = "Tour date is required";

        // Validate additional pax
        editFormData.additionalPax?.forEach((pax, index) => {
            if (!pax.name) {
                errors[`additionalPax_${index}_name`] = "Name is required";
            }
            if (!pax.contact) {
                errors[`additionalPax_${index}_contact`] = "Contact is required";
            }
        });

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSaveBooking = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // Update the booking document in Firestore
            const bookingRef = doc(db, 'bookings', currentBooking.id);

            // Prepare data for update
            const updateData = {
                name: editFormData.name,
                email: editFormData.email,
                contact: editFormData.contact,
                date: editFormData.date,
                specialRequest: editFormData.specialRequest,
                totalPax: editFormData.totalPax,
                additionalPax: editFormData.additionalPax,
                lastUpdated: new Date().toISOString()
            };

            await updateDoc(bookingRef, updateData);

            // Refresh bookings list
            await fetchUserBookings();

            setShowEditModal(false);
            toast.success("Booking updated successfully!");
        } catch (err) {
            console.error("Error updating booking:", err);
            toast.error("Failed to update booking");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Format date for displaying
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Get status badge variant
    const getStatusVariant = (status) => {
        switch (status?.toLowerCase()) {
            case 'confirmed':
                return 'success';
            case 'pending':
                return 'warning';
            case 'cancelled':
                return 'danger';
            default:
                return 'secondary';
        }
    };

    return (
        <Container fluid className="py-4 px-4 bg-light min-vh-100">
            <div className="bg-white rounded-3 shadow-sm p-4 mb-4">
                <h2 className="fw-bold mb-0">My Dashboard</h2>
            </div>

            <Row className="g-4">
                {/* Sidebar */}
                <Col lg={2}>
                    <Card className="shadow-sm border-0 mb-4">
                        <Card.Body className="p-0">
                            <div className="text-center p-4 bg-primary bg-opacity-10">
                                <div className="avatar mb-3 d-flex justify-content-center">
                                    <div
                                        className="position-relative"
                                        style={{ width: '120px', height: '120px' }}
                                    >
                                        <img
                                            src={profile.tempAvatar || profile.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 24 24' fill='%23CCCCCC'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E"}
                                            alt="Profile"
                                            className="rounded-circle border shadow-sm"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                            onError={(e) => {
                                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 24 24' fill='%23CCCCCC'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";
                                            }}
                                        />
                                        <label
                                            htmlFor="profile-upload"
                                            className="position-absolute bottom-0 end-0 bg-white rounded-circle p-1 shadow-sm cursor-pointer"
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <FaEdit className="text-primary" size={16} />
                                        </label>
                                        <input
                                            type="file"
                                            id="profile-upload"
                                            className="d-none"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                </div>
                                <h5 className="fw-bold">{profile.displayName || 'User'}</h5>
                                <p className="text-muted small mb-0">{profile.email}</p>
                            </div>

                            <div className="p-2">
                                <Nav className="flex-column">
                                    <Nav.Item>
                                        <Nav.Link
                                            eventKey="bookings"
                                            className="d-flex align-items-center py-3"
                                            onClick={() => setActiveTab('bookings')}
                                        >
                                            <FaListAlt className="me-3" /> My Bookings
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link
                                            eventKey="weather"
                                            className="d-flex align-items-center py-3"
                                            onClick={() => setActiveTab('weather')}
                                        >
                                            <FaCloudSun className="me-3" /> Weather
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link
                                            eventKey="currency"
                                            className="d-flex align-items-center py-3"
                                            onClick={() => setActiveTab('currency')}
                                        >
                                            <FaExchangeAlt className="me-3" /> Currency Converter
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link
                                            eventKey="profile"
                                            className="d-flex align-items-center py-3"
                                            onClick={() => setActiveTab('profile')}
                                        >
                                            <FaUser className="me-3" /> Profile
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link
                                            eventKey="community-feed"
                                            className="d-flex align-items-center py-3"
                                            onClick={() => setActiveTab('community-feed')}
                                        >
                                            <FaUser className="me-3" /> Community Feed
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link
                                            eventKey="settings"
                                            className="d-flex align-items-center py-3"
                                            onClick={() => setActiveTab('settings')}
                                        >
                                            <FaCog className="me-3" /> Settings
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link
                                            eventKey="todo"
                                            className="d-flex align-items-center py-3"
                                            onClick={() => setActiveTab('todo')}
                                        >
                                            <FaListAlt className="me-3" /> My Todos
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link
                                            eventKey="translator"
                                            className="d-flex align-items-center py-3"
                                            onClick={() => setActiveTab('translator')}
                                        >
                                            <FaListAlt className="me-3" /> My Translator
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link
                                            eventKey="diaries"
                                            className="d-flex align-items-center py-3"
                                            onClick={() => setActiveTab('diaries')}
                                        >
                                            <FaBookOpen className="me-3" /> My Diaries
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link
                                            eventKey="planes"
                                            className="d-flex align-items-center py-3"
                                            onClick={() => setActiveTab('planes')}
                                        >
                                            <FaPlane className="me-3" /> Live Planes
                                        </Nav.Link>
                                    </Nav.Item>
                                </Nav>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Main Content */}
                <Col lg={10}>
                    <div className="bg-white rounded-3 shadow-sm">
                        <Tab.Content>
                            {/* Bookings Tab */}
                            <Tab.Pane active={activeTab === 'bookings'}>
                                <div className="p-4">
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h4 className="mb-0">My Bookings</h4>
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={fetchUserBookings}
                                        >
                                            Refresh
                                        </Button>
                                    </div>

                                    {isLoading ? (
                                        <div className="text-center py-5">
                                            <Spinner animation="border" variant="primary" />
                                            <p className="mt-3">Loading your bookings...</p>
                                        </div>
                                    ) : error ? (
                                        <Alert variant="danger">{error}</Alert>
                                    ) : userBookings.length === 0 ? (
                                        <div className="text-center py-5">
                                            <FaCalendarAlt size={50} className="text-muted mb-3" />
                                            <h5>No Bookings Found</h5>
                                            <p className="text-muted">You haven't made any bookings yet.</p>
                                            <Button variant="primary" href="/tours">Browse Tours</Button>
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <Table hover className="align-middle mb-0">
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: "40%" }}>Tour Information</th>
                                                        <th style={{ width: "25%" }}>Tour Date</th>
                                                        <th style={{ width: "20%" }}>Participants</th>
                                                        <th style={{ width: "15%" }} className="text-end">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {userBookings.map((booking) => (
                                                        <tr key={booking.id}>
                                                            <td>
                                                                <div>
                                                                    <h6 className="mb-1">{booking.tourName}</h6>
                                                                    <div className="text-muted small mb-2">
                                                                        {booking.confirmationCode}
                                                                    </div>
                                                                    <Badge
                                                                        bg={getStatusVariant(booking.status)}
                                                                        className="text-uppercase"
                                                                        style={{ fontSize: '0.75rem' }}
                                                                    >
                                                                        {booking.status || 'Processing'}
                                                                    </Badge>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div>
                                                                    <div>{formatDate(booking.date)}</div>
                                                                    <small className="text-muted">
                                                                        Booked: {formatDate(booking.bookingDate)}
                                                                    </small>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                {booking.totalPax} person(s)
                                                            </td>
                                                            <td className="text-end">
                                                                <Button
                                                                    variant="link"
                                                                    className="me-2 p-1"
                                                                    onClick={() => viewBookingDetails(booking)}
                                                                    title="View details"
                                                                >
                                                                    <FaEye className="text-primary" />
                                                                </Button>
                                                                <Button
                                                                    variant="link"
                                                                    className="p-1"
                                                                    onClick={() => openEditModal(booking)}
                                                                    title="Edit booking"
                                                                >
                                                                    <FaEdit className="text-primary" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )}
                                </div>
                            </Tab.Pane>

                            {/* Weather Tab */}
                            <Tab.Pane active={activeTab === 'weather'}>
                                <Card.Header className="bg-white p-4 border-0">
                                    <h4 className="mb-0 fw-bold">Weather Forecast</h4>
                                </Card.Header>
                                <Card.Body className="p-4">
                                    <Weather />
                                </Card.Body>
                            </Tab.Pane>

                            {/* Currency Converter Tab */}
                            <Tab.Pane active={activeTab === 'currency'}>
                                <Card.Header className="bg-white p-4 border-0">
                                    <h4 className="mb-0 fw-bold">Currency Converter</h4>
                                </Card.Header>
                                <Card.Body className="p-4">
                                    <CurrencyConverter />
                                </Card.Body>
                            </Tab.Pane>

                            {/* Profile Tab */}
                            <Tab.Pane active={activeTab === 'profile'}>
                                <Card.Header className="bg-white p-4 border-0">
                                    <h4 className="mb-0 fw-bold">Profile Information</h4>
                                </Card.Header>
                                <Card.Body className="p-4">
                                    <Form onSubmit={handleProfileSubmit}>
                                        <Row className="g-3">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Full Name</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="displayName"
                                                        value={profile.displayName}
                                                        onChange={handleProfileChange}
                                                    />
                                                </Form.Group>
                                            </Col>

                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Email Address</Form.Label>
                                                    <Form.Control
                                                        type="email"
                                                        value={profile.email}
                                                        disabled
                                                        readOnly
                                                    />
                                                    <Form.Text className="text-muted">
                                                        Email cannot be changed
                                                    </Form.Text>
                                                </Form.Group>
                                            </Col>

                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Phone Number</Form.Label>
                                                    <PhoneInput
                                                        country={'my'}
                                                        value={profile.phoneNumber}
                                                        onChange={(phone) => setProfile(prev => ({ ...prev, phoneNumber: phone }))}
                                                        inputStyle={{
                                                            width: "100%",
                                                            height: "38px",
                                                            padding: "0.375rem 0.75rem",
                                                            border: "1px solid #ced4da",
                                                            borderRadius: "0.375rem",
                                                            fontSize: "1rem",
                                                            fontFamily: "inherit",
                                                        }}
                                                    />
                                                </Form.Group>
                                            </Col>

                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Profile Picture</Form.Label>
                                                    <div className="d-flex align-items-center gap-3">
                                                        <img
                                                            src={profile.tempAvatar || profile.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='%23CCCCCC'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E"}
                                                            alt="Profile Preview"
                                                            className="rounded-circle border"
                                                            style={{ width: '64px', height: '64px', objectFit: 'cover' }}
                                                            onError={(e) => {
                                                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='%23CCCCCC'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";
                                                            }}
                                                        />
                                                        <Form.Control
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleFileChange}
                                                        />
                                                    </div>
                                                </Form.Group>
                                            </Col>

                                            <Col xs={12} className="mt-4">
                                                <Button
                                                    type="submit"
                                                    variant="primary"
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <Spinner as="span" animation="border" size="sm" className="me-2" />
                                                            {uploadingImage ? 'Uploading Image...' : 'Saving...'}
                                                        </>
                                                    ) : "Save Changes"}
                                                </Button>
                                            </Col>
                                        </Row>
                                    </Form>
                                </Card.Body>
                            </Tab.Pane>

                            {/* Settings Tab */}
                            <Tab.Pane active={activeTab === 'settings'}>
                                <Card.Header className="bg-white p-4 border-0">
                                    <h4 className="mb-0 fw-bold">Account Settings</h4>
                                </Card.Header>
                                <Card.Body className="p-4">
                                    <p>
                                        Manage your account settings, notification preferences, and privacy options here.
                                    </p>
                                    <Alert variant="info">
                                        This section is under development. More settings options will be available soon.
                                    </Alert>
                                </Card.Body>
                            </Tab.Pane>

                            {/* Todo Tab */}
                            <Tab.Pane active={activeTab === 'todo'}>
                                <Card.Header className="bg-white p-4 border-0">
                                    <h4 className="mb-0 fw-bold">My Todo List</h4>
                                </Card.Header>
                                <Card.Body className="p-4">
                                    <div className="mb-4">
                                        <Button variant="primary" onClick={() => setShowAddTodo(true)}>
                                            Add Todo
                                        </Button>
                                    </div>
                                    <TodoList />
                                    <AddTodo show={showAddTodo} onHide={() => setShowAddTodo(false)} />
                                </Card.Body>
                            </Tab.Pane>

                            {/* Translator Tab */}
                            <Tab.Pane active={activeTab === 'translator'}>
                                <Card.Header className="bg-white p-4 border-0">
                                    <h4 className="mb-0 fw-bold">In-App Translator</h4>
                                </Card.Header>
                                <Card.Body className="p-4">
                                    <TranslatorPage />
                                </Card.Body>
                            </Tab.Pane>

                            {/* Community Feed Tab */}
                            <Tab.Pane active={activeTab === 'community-feed'}>
                                <Row>
                                    <Col lg={8}>
                                        <div style={{ position: 'relative', marginBottom: '2rem' }}>
                                            <img
                                                src={CommunityFeedImg}
                                                alt="Community Feed Cover"
                                                style={{ width: '100%', height: '400px', objectFit: 'cover', borderRadius: '18px' }}
                                            />
                                            <h2 style={{
                                                position: 'absolute',
                                                left: '2rem',
                                                bottom: '1.5rem',
                                                color: 'white',
                                                textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                                                fontWeight: 700
                                            }}>
                                                Community Feed
                                            </h2>
                                        </div>
                                        <CommunityFeed />
                                    </Col>
                                    <Col lg={4}>
                                        {/* Right column intentionally left empty or for future widgets */}
                                    </Col>
                                </Row>
                            </Tab.Pane>

                            {/* Travel Diaries Tab */}
                            <Tab.Pane active={activeTab === 'diaries'}>
                                <Card.Header className="bg-white p-4 border-0">
                                    <h4 className="mb-0 fw-bold">My Travel Diaries</h4>
                                </Card.Header>
                                <Card.Body className="p-4">
                                    <TravelDiariesPage />
                                </Card.Body>
                            </Tab.Pane>

                            {/* Planes Tab */}
                            <Tab.Pane active={activeTab === 'planes'}>
                                <Card.Header className="bg-white p-4 border-0">
                                    <h4 className="mb-0 fw-bold">Live Planes Tracker</h4>
                                </Card.Header>
                                <Card.Body className="p-4">
                                    <PlanesPage />
                                </Card.Body>
                            </Tab.Pane>
                        </Tab.Content>
                        <Outlet />
                    </div>
                </Col>
            </Row>

            {/* View Booking Details Modal */}
            <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)}>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title>Booking Details</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-0">
                    {currentBooking && (
                        <div>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5>{currentBooking.tourName}</h5>
                                <Badge bg={getStatusVariant(currentBooking.status)}>
                                    {currentBooking.status || 'Processing'}
                                </Badge>
                            </div>

                            <div className="booking-info bg-light p-3 rounded mb-3">
                                <Row className="mb-2">
                                    <Col xs={4} className="text-muted">Confirmation:</Col>
                                    <Col xs={8} className="fw-bold">{currentBooking.confirmationCode}</Col>
                                </Row>
                                <Row className="mb-2">
                                    <Col xs={4} className="text-muted">Tour Date:</Col>
                                    <Col xs={8}>{formatDate(currentBooking.date)}</Col>
                                </Row>
                                <Row className="mb-2">
                                    <Col xs={4} className="text-muted">Booked On:</Col>
                                    <Col xs={8}>{formatDate(currentBooking.bookingDate)}</Col>
                                </Row>
                                <Row className="mb-2">
                                    <Col xs={4} className="text-muted">Total People:</Col>
                                    <Col xs={8}>{currentBooking.totalPax} person(s)</Col>
                                </Row>
                            </div>

                            <div className="contact-info mb-3">
                                <h6 className="text-muted mb-3">Contact Information</h6>
                                <Row className="mb-2">
                                    <Col xs={4} className="text-muted">Name:</Col>
                                    <Col xs={8}>{currentBooking.name}</Col>
                                </Row>
                                <Row className="mb-2">
                                    <Col xs={4} className="text-muted">Email:</Col>
                                    <Col xs={8}>{currentBooking.email}</Col>
                                </Row>
                                <Row className="mb-2">
                                    <Col xs={4} className="text-muted">Contact:</Col>
                                    <Col xs={8}>{currentBooking.contact}</Col>
                                </Row>
                            </div>

                            {currentBooking.specialRequest && (
                                <div className="special-requests mb-3">
                                    <h6 className="text-muted mb-2">Special Requests</h6>
                                    <p className="bg-light p-3 rounded">{currentBooking.specialRequest}</p>
                                </div>
                            )}

                            {currentBooking.additionalPax && currentBooking.additionalPax.length > 0 && (
                                <div className="additional-pax mb-3">
                                    <h6 className="text-muted mb-3">Additional Participants</h6>
                                    {currentBooking.additionalPax.map((pax, idx) => (
                                        <div key={idx} className="bg-light p-3 rounded mb-2">
                                            <p className="mb-1"><strong>Name:</strong> {pax.name}</p>
                                            <p className="mb-0"><strong>Contact:</strong> {pax.contact}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={() => {
                        setShowDetailsModal(false);
                        openEditModal(currentBooking);
                    }}>
                        Edit Booking
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Edit Booking Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title>Edit Booking</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-2">
                    {currentBooking && (
                        <Form onSubmit={handleSaveBooking}>
                            <div className="mb-4 bg-light p-3 rounded">
                                <h6 className="mb-2">Tour Information</h6>
                                <p className="mb-1 fw-bold">{currentBooking.tourName}</p>
                                <p className="mb-0 small text-muted">Confirmation: {currentBooking.confirmationCode}</p>
                            </div>

                            <Row className="g-3">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Full Name</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="name"
                                            value={editFormData.name}
                                            onChange={handleEditFormChange}
                                            isInvalid={!!formErrors.name}
                                            required
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {formErrors.name}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>

                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Email Address</Form.Label>
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            value={editFormData.email}
                                            onChange={handleEditFormChange}
                                            isInvalid={!!formErrors.email}
                                            required
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {formErrors.email}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>

                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Contact Number</Form.Label>
                                        <PhoneInput
                                            country={'my'}
                                            value={editFormData.contact}
                                            onChange={handleContactChange}
                                            inputStyle={{
                                                width: "100%",
                                                height: "38px",
                                                padding: "0.375rem 0.75rem",
                                                border: formErrors.contact ? "1px solid #dc3545" : "1px solid #ced4da",
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
                                            enableSearch
                                            required
                                        />
                                        {formErrors.contact && (
                                            <div className="text-danger small mt-1">
                                                {formErrors.contact}
                                            </div>
                                        )}
                                    </Form.Group>
                                </Col>

                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Tour Date</Form.Label>
                                        <Form.Control
                                            type="date"
                                            name="date"
                                            value={editFormData.date}
                                            onChange={handleEditFormChange}
                                            isInvalid={!!formErrors.date}
                                            required
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {formErrors.date}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>

                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Number of Participants</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="totalPax"
                                            value={editFormData.totalPax}
                                            onChange={handleTotalPaxChange}
                                            min={1}
                                            required
                                        />
                                    </Form.Group>
                                </Col>

                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Special Requests</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            name="specialRequest"
                                            value={editFormData.specialRequest || ''}
                                            onChange={handleEditFormChange}
                                            rows={2}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            {/* Additional Participants */}
                            {editFormData.totalPax > 1 && editFormData.additionalPax && (
                                <div className="mt-4">
                                    <h6 className="mb-3">Additional Participants</h6>
                                    {editFormData.additionalPax.map((pax, index) => (
                                        <div key={index} className="p-3 mb-3 border rounded">
                                            <h6 className="mb-3">Additional Pax {index + 2}</h6>
                                            <Form.Group controlId={`formAdditionalName${index}`} className="mb-3">
                                                <Form.Label>Full Name</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="name"
                                                    placeholder={`Enter name for additional pax ${index + 2}`}
                                                    value={pax.name || ''}
                                                    onChange={(e) => handleAdditionalPaxChange(index, e)}
                                                    isInvalid={!!formErrors[`additionalPax_${index}_name`]}
                                                    required
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {formErrors[`additionalPax_${index}_name`]}
                                                </Form.Control.Feedback>
                                            </Form.Group>

                                            <Form.Group controlId={`formAdditionalContact${index}`} className="mb-3">
                                                <Form.Label>Contact Number</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="contact"
                                                    placeholder={`Enter contact number for pax ${index + 2}`}
                                                    value={pax.contact || ''}
                                                    onChange={(e) => handleAdditionalPaxChange(index, e)}
                                                    isInvalid={!!formErrors[`additionalPax_${index}_contact`]}
                                                    required
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {formErrors[`additionalPax_${index}_contact`]}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="d-flex justify-content-end gap-2 mt-4">
                                <Button variant="outline-secondary" onClick={() => setShowEditModal(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    type="submit"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Spinner as="span" animation="border" size="sm" className="me-2" />
                                            Saving...
                                        </>
                                    ) : "Save Changes"}
                                </Button>
                            </div>
                        </Form>
                    )}
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default UserDashboard;