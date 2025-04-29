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
import { NavLink, Link, Outlet, useLocation } from "react-router-dom";
import AddTodo from './todo/AddTodo';
import TranslatorPage from '../pages/TranslatorPage';
import CommunityFeed from '../pages/CommunityFeed';
import CommunityFeedImg from '../assets/community-feed.jpg';
import TravelDiariesList from './TravelDiariesList';
import TravelDiariesPage from '../pages/TravelDiariesPage';
import CurrencyConverter from './CurrencyConverter';
import PlanesPage from './PlanesPage';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

const UserDashboard = () => {
    const { user, updateUserProfile } = useAuth();
    const location = useLocation();
    const [userBookings, setUserBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(location.state?.tab || 'bookings');
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

    // Password change state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    // Get the current tab name for display
    const getCurrentTabName = () => {
        switch (activeTab) {
            case 'bookings':
                return 'My Bookings';
            case 'profile':
                return 'Profile';
            case 'community-feed':
                return 'Community Feed';
            case 'todo':
                return 'My Todos';
            case 'diaries':
                return 'My Diaries';
            case 'currency':
                return 'Currency Converter';
            case 'translator':
                return 'My Translator';
            case 'weather':
                return 'Weather';
            case 'planes':
                return 'Live Planes';
            case 'settings':
                return 'Settings';
            case 'tools':
                return 'Tools';
            default:
                return 'Dashboard';
        }
    };

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

    // Add useEffect to handle tab changes from navigation
    useEffect(() => {
        if (location.state?.tab) {
            setActiveTab(location.state.tab);
        }
    }, [location.state]);

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

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');
        setIsUpdatingPassword(true);

        try {
            // Validate passwords match
            if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                throw new Error('New passwords do not match');
            }

            // Validate password length
            if (passwordForm.newPassword.length < 6) {
                throw new Error('New password must be at least 6 characters long');
            }

            // First, reauthenticate the user with their current password
            const credential = EmailAuthProvider.credential(
                user.email,
                passwordForm.currentPassword
            );
            await reauthenticateWithCredential(user, credential);

            // Then update the password
            await updatePassword(user, passwordForm.newPassword);

            setPasswordSuccess('Password updated successfully!');
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error) {
            console.error('Error updating password:', error);
            setPasswordError(error.message);
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const handlePasswordInputChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <Container fluid className="py-4 px-3 px-md-4 bg-light min-vh-100 d-flex flex-column">
            {/* Mobile Navigation Header */}
            <div className="d-lg-none position-sticky top-0 z-3" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                width: '100%',
                left: 0,
                right: 0
            }}>
                <div className="container-fluid px-3">
                    <div className="d-flex align-items-center p-3">
                        <Button
                            variant="link"
                            className="p-0 me-3 text-white"
                            onClick={() => setActiveTab('')}
                        >
                            <FaListAlt size={20} />
                        </Button>
                        <h5 className="mb-0 fw-bold text-white">{getCurrentTabName()}</h5>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3 shadow-sm p-3 p-md-4 mb-4 mt-0 mt-md-4 d-none d-md-block">
                <h2 className="fw-bold mb-0">
                    Hi, {profile.displayName || 'there'}! 👋
                </h2>
            </div>

            <Row className="g-3 g-md-4 flex-grow-1">
                {/* Sidebar - Hidden on mobile when a tab is active */}
                <Col xs={12} lg={2} className={`mb-4 mb-lg-0 ${activeTab ? 'd-none d-lg-block' : ''}`}>
                    <Card className="shadow-sm border-0 h-100 mx-auto" style={{ maxWidth: '500px' }}>
                        <Card.Body className="p-0">
                            {/* Profile section - centered on small screens */}
                            <div className="text-center p-4 bg-primary bg-opacity-10">
                                <div className="avatar mb-3 d-flex justify-content-center">
                                    <div
                                        className="position-relative mx-auto"
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

                            {/* Navigation section - centered on small screens */}
                            <div className="p-2">
                                <Nav className="flex-column text-start">
                                    <Nav.Item>
                                        <Nav.Link
                                            eventKey="bookings"
                                            className="d-flex align-items-center py-3 nav-link-hover"
                                            onClick={() => setActiveTab('bookings')}
                                        >
                                            <FaListAlt className="me-3" /> My Bookings
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link
                                            eventKey="profile"
                                            className="d-flex align-items-center py-3 nav-link-hover"
                                            onClick={() => setActiveTab('profile')}
                                        >
                                            <FaUser className="me-3" /> Profile
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link
                                            eventKey="community-feed"
                                            className="d-flex align-items-center py-3 nav-link-hover"
                                            onClick={() => setActiveTab('community-feed')}
                                        >
                                            <FaUser className="me-3" /> Community Feed
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link
                                            eventKey="settings"
                                            className="d-flex align-items-center py-3 nav-link-hover"
                                            onClick={() => setActiveTab('settings')}
                                        >
                                            <FaCog className="me-3" /> Settings
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link
                                            eventKey="tools"
                                            className="d-flex align-items-center py-3 nav-link-hover"
                                            onClick={() => setActiveTab('tools')}
                                        >
                                            <FaCog className="me-3" /> Tools
                                        </Nav.Link>
                                    </Nav.Item>
                                </Nav>
                            </div>

                            <style>
                                {`
                                .nav-link-hover {
                                    transition: all 0.3s ease;
                                    color: var(--bs-body-color);
                                }
                                .nav-link-hover:hover {
                                    background-color: var(--bs-primary);
                                    color: white !important;
                                    transform: translateX(5px);
                                }
                                @media (max-width: 991px) {
                                    .nav-link-hover:hover {
                                        transform: scale(1.05);
                                    }
                                }
                                `}
                            </style>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Main Content */}
                <Col xs={12} lg={10} className={activeTab ? '' : 'd-none d-lg-block'}>
                    <div className="bg-white rounded-3 shadow-sm mx-auto" style={{ maxWidth: '100%' }}>
                        <Tab.Content>
                            {/* Bookings Tab */}
                            <Tab.Pane active={activeTab === 'bookings'}>
                                <div className="p-4 section-animation" style={{
                                    background: 'linear-gradient(135deg, #4a90e2, #9b59b6, #ffa07a)',
                                    borderRadius: '0.5rem',
                                    color: 'white'
                                }}>
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h4 className="mb-0 text-white">My Bookings</h4>
                                        <Button
                                            variant="outline-light"
                                            size="sm"
                                            onClick={fetchUserBookings}
                                        >
                                            Refresh
                                        </Button>
                                    </div>

                                    {isLoading ? (
                                        <div className="text-center py-5">
                                            <Spinner animation="border" variant="light" />
                                            <p className="mt-3 text-white">Loading your bookings...</p>
                                        </div>
                                    ) : error ? (
                                        <Alert variant="danger">{error}</Alert>
                                    ) : userBookings.length === 0 ? (
                                        <div className="text-center py-5">
                                            <FaCalendarAlt size={50} className="text-white mb-3" />
                                            <h5 className="text-white">No Bookings Found</h5>
                                            <p className="text-white">You haven't made any bookings yet.</p>
                                            <Button variant="light" href="/tours">Browse Tours</Button>
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <Table hover className="align-middle mb-0" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
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
                                <Card.Header className="bg-white p-4 border-0 section-animation">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h4 className="mb-0 fw-bold">Weather Forecast</h4>
                                        <Button 
                                            variant="outline-primary"
                                            onClick={() => setActiveTab('tools')}
                                            className="section-animation"
                                        >
                                            <FaListAlt className="me-2" /> Back to Tools
                                        </Button>
                                    </div>
                                </Card.Header>
                                <Card.Body className="p-4 section-animation">
                                    <Weather />
                                </Card.Body>
                            </Tab.Pane>

                            {/* Currency Converter Tab */}
                            <Tab.Pane active={activeTab === 'currency'}>
                                <Card.Header className="bg-white p-4 border-0 section-animation">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h4 className="mb-0 fw-bold">Currency Converter</h4>
                                        <Button 
                                            variant="outline-primary"
                                            onClick={() => setActiveTab('tools')}
                                            className="section-animation"
                                        >
                                            <FaListAlt className="me-2" /> Back to Tools
                                        </Button>
                                    </div>
                                </Card.Header>
                                <Card.Body className="p-4 section-animation">
                                    <CurrencyConverter />
                                </Card.Body>
                            </Tab.Pane>

                            {/* Profile Tab */}
                            <Tab.Pane active={activeTab === 'profile'}>
                                <Card.Header className="bg-white p-4 border-0 section-animation">
                                    <h4 className="mb-0 fw-bold">Profile Information</h4>
                                </Card.Header>
                                <Card.Body className="p-4 section-animation" style={{
                                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                                    borderRadius: '0.5rem'
                                }}>
                                    <Form onSubmit={handleProfileSubmit}>
                                        <Row className="g-3">
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

                                            <Col xs={12} className="mt-4">
                                                <Button
                                                    type="submit"
                                                    variant="primary"
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <Spinner as="span" animation="border" size="sm" className="me-2" />
                                                            {uploadingImage ? 'Updating...' : 'Saving...'}
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
                                <Card.Header className="bg-white p-4 border-0 section-animation">
                                    <h4 className="mb-0 fw-bold">Account Settings</h4>
                                </Card.Header>
                                <Card.Body className="p-4 section-animation" style={{
                                    background: 'linear-gradient(135deg, #4a90e2, #9b59b6, #ffa07a)',
                                    borderRadius: '0.5rem',
                                    color: 'white'
                                }}>
                                    <Row className="justify-content-center">
                                        <Col lg={8} xl={6}>
                                            <div className="bg-white p-4 rounded-3 shadow-sm mb-4" style={{ 
                                                background: 'rgba(255, 255, 255, 0.95)',
                                                color: '#333'
                                            }}>
                                                <h5 className="mb-3">Change Password</h5>
                                                {passwordError && <Alert variant="danger">{passwordError}</Alert>}
                                                {passwordSuccess && <Alert variant="success">{passwordSuccess}</Alert>}
                                                <Form onSubmit={handlePasswordChange}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Current Password</Form.Label>
                                                        <Form.Control
                                                            type="password"
                                                            name="currentPassword"
                                                            value={passwordForm.currentPassword}
                                                            onChange={handlePasswordInputChange}
                                                            required
                                                            className="form-control-lg"
                                                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                                                        />
                                                    </Form.Group>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>New Password</Form.Label>
                                                        <Form.Control
                                                            type="password"
                                                            name="newPassword"
                                                            value={passwordForm.newPassword}
                                                            onChange={handlePasswordInputChange}
                                                            required
                                                            minLength={6}
                                                            className="form-control-lg"
                                                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                                                        />
                                                    </Form.Group>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Confirm New Password</Form.Label>
                                                        <Form.Control
                                                            type="password"
                                                            name="confirmPassword"
                                                            value={passwordForm.confirmPassword}
                                                            onChange={handlePasswordInputChange}
                                                            required
                                                            minLength={6}
                                                            className="form-control-lg"
                                                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                                                        />
                                                    </Form.Group>
                                                    <Button
                                                        type="submit"
                                                        variant="primary"
                                                        disabled={isUpdatingPassword}
                                                        className="w-100"
                                                        size="lg"
                                                        style={{ 
                                                            background: 'linear-gradient(45deg, #2196F3, #00BCD4)',
                                                            border: 'none',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                        }}
                                                    >
                                                        {isUpdatingPassword ? (
                                                            <>
                                                                <Spinner as="span" animation="border" size="sm" className="me-2" />
                                                                Updating...
                                                            </>
                                                        ) : "Update Password"}
                                                    </Button>
                                                </Form>
                                            </div>
                                            <div className="bg-white p-4 rounded-3 shadow-sm" style={{ 
                                                background: 'rgba(255, 255, 255, 0.95)',
                                                color: '#333'
                                            }}>
                                                <h5 className="mb-3">Other Settings</h5>
                                                <Alert variant="info">
                                                    More settings options will be available soon.
                                                </Alert>
                                            </div>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Tab.Pane>

                            {/* Todo Tab */}
                            <Tab.Pane active={activeTab === 'todo'}>
                                <Card.Header className="bg-white p-4 border-0 section-animation">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h4 className="mb-0 fw-bold">My Todo List</h4>
                                        <Button 
                                            variant="outline-primary"
                                            onClick={() => setActiveTab('tools')}
                                            className="section-animation"
                                        >
                                            <FaListAlt className="me-2" /> Back to Tools
                                        </Button>
                                    </div>
                                </Card.Header>
                                <Card.Body className="p-4 section-animation" style={{
                                    background: 'linear-gradient(135deg, #4a90e2, #9b59b6, #ffa07a)',
                                    borderRadius: '0.5rem',
                                    color: 'white'
                                }}>
                                    <div className="mb-4 d-flex justify-content-center">
                                        <Button 
                                            onClick={() => setShowAddTodo(true)}
                                            className="section-animation"
                                            style={{ 
                                                background: 'linear-gradient(135deg, #4a90e2, #9b59b6, #ffa07a)',
                                                border: 'none',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                                fontWeight: 'bold',
                                                fontSize: '1.1rem',
                                                padding: '0.5rem 2rem'
                                            }}
                                        >
                                            Add Todo
                                        </Button>
                                    </div>
                                    <div className="section-animation" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '0.5rem', padding: '1rem' }}>
                                        <TodoList />
                                    </div>
                                    <AddTodo show={showAddTodo} onHide={() => setShowAddTodo(false)} />
                                </Card.Body>
                            </Tab.Pane>

                            {/* Translator Tab */}
                            <Tab.Pane active={activeTab === 'translator'}>
                                <Card.Header className="bg-white p-4 border-0 section-animation">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h4 className="mb-0 fw-bold">In-App Translator</h4>
                                        <Button 
                                            variant="outline-primary"
                                            onClick={() => setActiveTab('tools')}
                                            className="section-animation"
                                        >
                                            <FaListAlt className="me-2" /> Back to Tools
                                        </Button>
                                    </div>
                                </Card.Header>
                                <Card.Body className="p-4 section-animation">
                                    <TranslatorPage />
                                </Card.Body>
                            </Tab.Pane>

                            {/* Community Feed Tab */}
                            <Tab.Pane active={activeTab === 'community-feed'}>
                                <Card.Header className="bg-white p-4 border-0 section-animation">
                                    <h4 className="mb-0 fw-bold">Community Feed</h4>
                                </Card.Header>
                                <Row className="section-animation">
                                    <Col lg={8}>
                                        <div className="section-animation" style={{ position: 'relative', marginBottom: '2rem' }}>
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
                                        <div className="section-animation">
                                            <CommunityFeed />
                                        </div>
                                    </Col>
                                    <Col lg={4}>
                                        {/* Right column intentionally left empty or for future widgets */}
                                    </Col>
                                </Row>
                            </Tab.Pane>

                            {/* Travel Diaries Tab */}
                            <Tab.Pane active={activeTab === 'diaries'}>
                                <Card.Header className="bg-white p-4 border-0 section-animation">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h4 className="mb-0 fw-bold">My Travel Diaries</h4>
                                        <Button 
                                            variant="outline-primary"
                                            onClick={() => setActiveTab('tools')}
                                            className="section-animation"
                                        >
                                            <FaListAlt className="me-2" /> Back to Tools
                                        </Button>
                                    </div>
                                </Card.Header>
                                <Card.Body className="p-4 section-animation">
                                    <TravelDiariesPage />
                                </Card.Body>
                            </Tab.Pane>

                            {/* Planes Tab */}
                            <Tab.Pane active={activeTab === 'planes'}>
                                <Card.Header className="bg-white p-4 border-0 section-animation">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h4 className="mb-0 fw-bold">Live Planes Tracker</h4>
                                        <Button 
                                            variant="outline-primary"
                                            onClick={() => setActiveTab('tools')}
                                            className="section-animation"
                                        >
                                            <FaListAlt className="me-2" /> Back to Tools
                                        </Button>
                                    </div>
                                </Card.Header>
                                <Card.Body className="p-4 section-animation">
                                    <PlanesPage />
                                </Card.Body>
                            </Tab.Pane>

                            {/* Tools Tab */}
                            <Tab.Pane active={activeTab === 'tools'}>
                                <Card.Header className="bg-white p-4 border-0">
                                    <h4 className="mb-0 fw-bold">Tools</h4>
                                </Card.Header>
                                <Card.Body className="p-4 tools-grid" style={{
                                    background: 'linear-gradient(135deg, #4a90e2, #9b59b6, #ffa07a)',
                                    borderRadius: '0.5rem',
                                    color: 'white'
                                }}>
                                    <Row className="g-4">
                                        <Col md={6} lg={4}>
                                            <Card className="h-100 shadow-sm tool-card" onClick={() => setActiveTab('todo')}>
                                                <Card.Body className="text-center p-4">
                                                    <FaListAlt size={32} className="mb-3 text-primary" />
                                                    <h5>My Todos</h5>
                                                    <p className="text-muted mb-0">Manage your tasks and to-do lists</p>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col md={6} lg={4}>
                                            <Card className="h-100 shadow-sm tool-card" onClick={() => setActiveTab('diaries')}>
                                                <Card.Body className="text-center p-4">
                                                    <FaBookOpen size={32} className="mb-3 text-primary" />
                                                    <h5>My Diaries</h5>
                                                    <p className="text-muted mb-0">Write and manage your travel diaries</p>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col md={6} lg={4}>
                                            <Card className="h-100 shadow-sm tool-card" onClick={() => setActiveTab('currency')}>
                                                <Card.Body className="text-center p-4">
                                                    <FaExchangeAlt size={32} className="mb-3 text-primary" />
                                                    <h5>Currency Converter</h5>
                                                    <p className="text-muted mb-0">Convert between different currencies</p>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col md={6} lg={4}>
                                            <Card className="h-100 shadow-sm tool-card" onClick={() => setActiveTab('translator')}>
                                                <Card.Body className="text-center p-4">
                                                    <FaListAlt size={32} className="mb-3 text-primary" />
                                                    <h5>Translator</h5>
                                                    <p className="text-muted mb-0">Translate text between languages</p>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col md={6} lg={4}>
                                            <Card className="h-100 shadow-sm tool-card" onClick={() => setActiveTab('weather')}>
                                                <Card.Body className="text-center p-4">
                                                    <FaCloudSun size={32} className="mb-3 text-primary" />
                                                    <h5>Weather</h5>
                                                    <p className="text-muted mb-0">Check weather forecasts</p>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col md={6} lg={4}>
                                            <Card className="h-100 shadow-sm tool-card" onClick={() => setActiveTab('planes')}>
                                                <Card.Body className="text-center p-4">
                                                    <FaPlane size={32} className="mb-3 text-primary" />
                                                    <h5>Live Planes</h5>
                                                    <p className="text-muted mb-0">Track live flight information</p>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>
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

            <style>
                {`
                @media (max-width: 991px) {
                    .container-fluid {
                        max-width: 800px;
                        margin: 0 auto;
                    }
                }
                .z-3 {
                    z-index: 3;
                }

                /* Back Button Animation */
                .btn-outline-primary {
                    transition: all 0.3s ease;
                }

                .btn-outline-primary:hover {
                    transform: translateX(-5px);
                    background-color: var(--bs-primary);
                    color: white;
                }

                /* Section Animation */
                .section-animation {
                    opacity: 0;
                    transform: translateY(20px);
                    animation: sectionFadeIn 1.2s ease forwards;
                }

                @keyframes sectionFadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                /* Add staggered animation for sections */
                .section-animation:nth-child(1) { animation-delay: 0.2s; }
                .section-animation:nth-child(2) { animation-delay: 0.4s; }
                .section-animation:nth-child(3) { animation-delay: 0.6s; }
                .section-animation:nth-child(4) { animation-delay: 0.8s; }
                .section-animation:nth-child(5) { animation-delay: 1.0s; }
                .section-animation:nth-child(6) { animation-delay: 1.2s; }

                /* Tools Grid Animation */
                .tools-grid {
                    opacity: 0;
                    transform: translateY(20px);
                    animation: toolsFadeIn 1.2s ease forwards;
                }

                .tool-card {
                    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                    transform: scale(1);
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                    border: none;
                    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
                }

                .tool-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
                    opacity: 0;
                    transition: opacity 0.5s ease;
                }

                .tool-card:hover {
                    transform: scale(1.05) translateY(-5px);
                    box-shadow: 0 15px 30px rgba(0,0,0,0.15) !important;
                    background: linear-gradient(135deg, #4a90e2 0%, #9b59b6 100%);
                }

                .tool-card:hover::before {
                    opacity: 1;
                }

                .tool-card .card-body {
                    position: relative;
                    z-index: 1;
                    transition: all 0.5s ease;
                }

                .tool-card:hover .card-body {
                    background: transparent;
                }

                .tool-card .text-primary {
                    transition: all 0.5s ease;
                }

                .tool-card:hover .text-primary {
                    color: #ffffff !important;
                    transform: scale(1.2);
                }

                .tool-card h5 {
                    transition: all 0.5s ease;
                    color: #333;
                }

                .tool-card:hover h5 {
                    color: #ffffff;
                    transform: translateY(-3px);
                }

                .tool-card p {
                    transition: all 0.5s ease;
                    color: #6c757d;
                }

                .tool-card:hover p {
                    color: rgba(255, 255, 255, 0.9);
                    transform: translateY(3px);
                }

                @keyframes toolsFadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                /* Add staggered animation for cards */
                .tool-card:nth-child(1) { animation-delay: 0.3s; }
                .tool-card:nth-child(2) { animation-delay: 0.6s; }
                .tool-card:nth-child(3) { animation-delay: 0.9s; }
                .tool-card:nth-child(4) { animation-delay: 1.2s; }
                .tool-card:nth-child(5) { animation-delay: 1.5s; }
                .tool-card:nth-child(6) { animation-delay: 1.8s; }

                .tool-card {
                    opacity: 0;
                    transform: translateY(20px);
                    animation: cardFadeIn 1s ease forwards;
                }

                @keyframes cardFadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                /* Add hover effect to all cards and sections */
                .card {
                    transition: all 0.5s ease;
                }

                .card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
                }

                /* Add animation to form elements */
                .form-control, .form-select {
                    transition: all 0.5s ease;
                }

                .form-control:focus, .form-select:focus {
                    transform: scale(1.02);
                    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
                }
                `}
            </style>
        </Container>
    );
};

export default UserDashboard;