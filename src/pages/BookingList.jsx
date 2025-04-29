import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config'; // Import your Firestore database
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Table, Form, Button, Modal, InputGroup, Badge } from 'react-bootstrap';
import { FaChevronDown, FaChevronUp, FaSort, FaSortUp, FaSortDown, FaCheck } from 'react-icons/fa';

const BookingList = () => {
    const [bookings, setBookings] = useState([]);
    const [expandedRows, setExpandedRows] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [totalPax, setTotalPax] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [bookingData, setBookingData] = useState({
        name: '',
        email: '',
        contact: '',
        date: '',
        totalPax: 1,
        specialRequest: '',
        additionalPax: [],
        paymentImage: null,
    });
    const [currentBookingId, setCurrentBookingId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    // Add pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Sorting state
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'asc'
    });

    const [headerFilters, setHeaderFilters] = useState({
        confirmationCode: '',
        tourName: '',
        tourId: '',
        name: '',
        email: '',
        contact: '',
        date: '',
        bookingDate: '',
    });

    // Add new state for tracking active status filter
    const [activeStatusFilter, setActiveStatusFilter] = useState(null);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                console.log('Starting to fetch bookings...');

                // Verify Firestore connection
                if (!db) {
                    throw new Error('Firestore database not initialized');
                }

                console.log('Firestore connection verified');
                const bookingsCollection = collection(db, 'bookings');
                console.log('Collection reference created');

                const querySnapshot = await getDocs(bookingsCollection);
                console.log('Query snapshot received');

                if (querySnapshot.empty) {
                    console.log('No bookings found in the database');
                    setBookings([]);
                    setFilteredBookings([]);
                    return;
                }

                const bookingsList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                console.log('Successfully fetched bookings:', bookingsList);

                // Sort bookings by booking date (newest first)
                const sortedBookings = bookingsList.sort((a, b) =>
                    new Date(b.bookingDate) - new Date(a.bookingDate)
                );

                console.log('Sorted bookings:', sortedBookings);
                setBookings(sortedBookings);

                // Apply the current active filter to the new data
                let filteredData = sortedBookings;
                if (activeStatusFilter === 'completed') {
                    filteredData = sortedBookings.filter(booking => isTourCompleted(booking.date));
                } else if (activeStatusFilter === 'upcoming') {
                    filteredData = sortedBookings.filter(booking => !isTourCompleted(booking.date));
                }

                setFilteredBookings(filteredData);
                calculateTotalPax(filteredData);
            } catch (error) {
                console.error('Detailed error fetching bookings:', error);
                console.error('Error stack:', error.stack);
            }
        };

        // Initial fetch
        fetchBookings();

        // Set up a refresh interval (every 30 seconds)
        const refreshInterval = setInterval(fetchBookings, 30000);

        // Cleanup interval on component unmount
        return () => clearInterval(refreshInterval);
    }, [activeStatusFilter]);

    // Function to check if a tour date has passed
    const isTourCompleted = (tourDate) => {
        if (!tourDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day for fair comparison

        // Parse the tour date - assuming format is YYYY-MM-DD
        const tourDateObj = new Date(tourDate);
        tourDateObj.setHours(0, 0, 0, 0);

        return tourDateObj < today;
    };

    const toggleExpand = (id) => {
        setExpandedRows((prev) =>
            prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
        );
    };

    const handleHeaderFilterChange = (e) => {
        const { name, value } = e.target;
        setHeaderFilters((prev) => ({ ...prev, [name]: value }));
        applyHeaderFilters({ ...headerFilters, [name]: value });
    };

    const handleSearchTermChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Sort function for table columns
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });

        // Apply sorting
        const sortedBookings = [...filteredBookings].sort((a, b) => {
            if (a[key] === undefined) return 1;
            if (b[key] === undefined) return -1;

            if (key === 'date' || key === 'bookingDate') {
                return direction === 'asc'
                    ? new Date(a[key]) - new Date(b[key])
                    : new Date(b[key]) - new Date(a[key]);
            }

            if (key === 'totalPax') {
                return direction === 'asc'
                    ? parseInt(a[key]) - parseInt(b[key])
                    : parseInt(b[key]) - parseInt(a[key]);
            }

            if (direction === 'asc') {
                return a[key].toString().localeCompare(b[key].toString());
            } else {
                return b[key].toString().localeCompare(a[key].toString());
            }
        });

        setFilteredBookings(sortedBookings);
    };

    // Helper function to get sort icon
    const getSortIcon = (columnKey) => {
        if (sortConfig.key !== columnKey) {
            return <FaSort className="ms-1" />;
        }
        return sortConfig.direction === 'asc' ? <FaSortUp className="ms-1" /> : <FaSortDown className="ms-1" />;
    };

    const applySearch = () => {
        if (!searchTerm.trim()) {
            // If search term is empty, reapply only the header filters
            applyHeaderFilters(headerFilters);
            return;
        }

        const searchLower = searchTerm.toLowerCase();
        const filtered = bookings.filter((booking) => {
            // Search in all text fields
            return (
                (booking.confirmationCode && booking.confirmationCode.toLowerCase().includes(searchLower)) ||
                (booking.tourName && booking.tourName.toLowerCase().includes(searchLower)) ||
                (booking.tourId && booking.tourId.toLowerCase().includes(searchLower)) ||
                (booking.name && booking.name.toLowerCase().includes(searchLower)) ||
                (booking.email && booking.email.toLowerCase().includes(searchLower)) ||
                (booking.contact && booking.contact.toLowerCase().includes(searchLower)) ||
                (booking.date && booking.date.toLowerCase().includes(searchLower))
            );
        });

        setFilteredBookings(filtered);
        calculateTotalPax(filtered);
    };

    const applyHeaderFilters = (currentFilters = headerFilters) => {
        let filtered = [...bookings];

        // Apply each header filter if it has a value
        Object.entries(currentFilters).forEach(([key, value]) => {
            if (value) {
                const valueLower = value.toLowerCase();
                filtered = filtered.filter((booking) => {
                    return booking[key] && booking[key].toString().toLowerCase().includes(valueLower);
                });
            }
        });

        // Apply the search term if it exists
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter((booking) => {
                return (
                    (booking.confirmationCode && booking.confirmationCode.toLowerCase().includes(searchLower)) ||
                    (booking.tourName && booking.tourName.toLowerCase().includes(searchLower)) ||
                    (booking.tourId && booking.tourId.toLowerCase().includes(searchLower)) ||
                    (booking.name && booking.name.toLowerCase().includes(searchLower)) ||
                    (booking.email && booking.email.toLowerCase().includes(searchLower)) ||
                    (booking.contact && booking.contact.toLowerCase().includes(searchLower)) ||
                    (booking.date && booking.date.toLowerCase().includes(searchLower))
                );
            });
        }

        setFilteredBookings(filtered);
        calculateTotalPax(filtered);
    };

    // Modify the filterByStatus function
    const filterByStatus = (status) => {
        let filtered = [...bookings];

        // If clicking the same filter again, clear it
        if (activeStatusFilter === status) {
            setActiveStatusFilter(null);
            setFilteredBookings(bookings);
            calculateTotalPax(bookings);
            return;
        }

        // Set the new active filter
        setActiveStatusFilter(status);

        if (status === 'completed') {
            filtered = filtered.filter(booking => isTourCompleted(booking.date));
        } else if (status === 'upcoming') {
            filtered = filtered.filter(booking => !isTourCompleted(booking.date));
        }

        setFilteredBookings(filtered);
        calculateTotalPax(filtered);
    };

    // Modify the clearAllFilters function to also clear the status filter
    const clearAllFilters = () => {
        setHeaderFilters({
            confirmationCode: '',
            tourName: '',
            tourId: '',
            name: '',
            email: '',
            contact: '',
            date: '',
            bookingDate: '',
        });
        setSearchTerm('');
        setActiveStatusFilter(null);
        setFilteredBookings(bookings);
        calculateTotalPax(bookings);
        // Reset sort when clearing filters
        setSortConfig({ key: null, direction: 'asc' });
    };

    const calculateTotalPax = (filteredBookings) => {
        const total = filteredBookings.reduce((sum, booking) => sum + (Number(booking.totalPax) || 0), 0);
        setTotalPax(total);
    };

    const handleShowModal = (bookingId) => {
        const booking = bookings.find((b) => b.id === bookingId);
        setBookingData({
            name: booking.name,
            email: booking.email,
            contact: booking.contact,
            date: booking.date,
            totalPax: booking.totalPax,
            specialRequest: booking.specialRequest || '',
            additionalPax: booking.additionalPax || [],
            paymentImage: null,
        });
        setCurrentBookingId(bookingId);
        setShowModal(true);
    };

    const handleClose = () => setShowModal(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setBookingData((prevData) => ({ ...prevData, [name]: value }));
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        const bookingRef = doc(db, 'bookings', currentBookingId);

        try {
            // Update the booking in Firestore
            await updateDoc(bookingRef, {
                name: bookingData.name,
                email: bookingData.email,
                contact: bookingData.contact,
                date: bookingData.date,
                totalPax: bookingData.totalPax,
                specialRequest: bookingData.specialRequest,
                additionalPax: bookingData.additionalPax,
                paymentImage: bookingData.paymentImage, // Assuming you handle image upload elsewhere
            });

            // Update the state for bookings
            const updatedBookings = bookings.map((b) =>
                b.id === currentBookingId ? { ...b, ...bookingData } : b
            );
            setBookings(updatedBookings);

            // Re-apply current filters
            applyHeaderFilters();

            setShowModal(false); // Close the modal after update
        } catch (error) {
            console.error('Error updating booking:', error);
        }
    };

    const handleDeleteBooking = async (bookingId) => {
        const confirmDelete = window.confirm('Are you sure you want to delete this booking?');
        if (confirmDelete) {
            try {
                const bookingRef = doc(db, 'bookings', bookingId);
                await deleteDoc(bookingRef);

                // Remove the deleted booking from the state
                const updatedBookings = bookings.filter((booking) => booking.id !== bookingId);
                setBookings(updatedBookings);

                // Re-apply current filters
                applyHeaderFilters();
            } catch (error) {
                console.error('Error deleting booking:', error);
            }
        }
    };

    // Dynamically add additional pax if totalPax is increased
    useEffect(() => {
        if (bookingData.totalPax > bookingData.additionalPax.length) {
            // Add empty entries for additional pax
            const newAdditionalPax = [...bookingData.additionalPax];
            for (let i = newAdditionalPax.length; i < bookingData.totalPax - 1; i++) {
                newAdditionalPax.push({ name: '', contact: '' });
            }
            setBookingData((prevData) => ({ ...prevData, additionalPax: newAdditionalPax }));
        } else {
            // Remove extra pax if totalPax is reduced
            const newAdditionalPax = bookingData.additionalPax.slice(0, bookingData.totalPax - 1);
            setBookingData((prevData) => ({ ...prevData, additionalPax: newAdditionalPax }));
        }
    }, [bookingData.totalPax]);

    // Add pagination functions
    const handleRowsPerPageChange = (e) => {
        setRowsPerPage(Number(e.target.value));
        setCurrentPage(1); // Reset to first page when changing rows per page
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // Calculate pagination values
    const totalPages = Math.ceil(filteredBookings.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const currentBookings = filteredBookings.slice(startIndex, endIndex);

    // Generate page numbers
    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return pageNumbers;
    };

    return (
        <div className="container-fluid px-3 px-md-5 py-4" style={{ 
            backgroundColor: '#f5f7fa',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)'
        }}>

            <h1 className="text-center mb-4" style={{ color: '#37474f', fontWeight: '600' }}>Admin - Booking Lists</h1>

            <Form className="bg-white p-4 rounded shadow-sm mb-4" style={{ 
                border: '1px solid #e0e0e0',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                position: 'relative',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: '4px',
                    padding: '2px',
                    background: 'linear-gradient(135deg, #355C7D, #C06C84)',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                }
            }}>
                <div className="row g-3 align-items-end">
                    <div className="col-md-8">
                        <Form.Group>
                            <Form.Label style={{ color: '#455a64', fontWeight: '500' }}>Search</Form.Label>
                            <InputGroup>
                                <Form.Control
                                    type="text"
                                    name="search"
                                    value={searchTerm}
                                    onChange={handleSearchTermChange}
                                    placeholder="Enter search value"
                                    style={{ 
                                        borderColor: '#cfd8dc',
                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                                    }}
                                />
                                <Button variant="primary" onClick={applySearch} style={{ 
                                    backgroundColor: '#355C7D', 
                                    borderColor: '#355C7D',
                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                                }}>
                                    Search
                                </Button>
                            </InputGroup>
                        </Form.Group>
                    </div>

                    <div className="col-md-4 d-flex align-items-end">
                        <Button variant="secondary" onClick={clearAllFilters} className="w-100" style={{ 
                            backgroundColor: '#C06C84', 
                            borderColor: '#C06C84',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                        }}>
                            Clear All Filters
                        </Button>
                    </div>
                </div>

                {/* Status filter buttons */}
                <div className="mt-4">
                    <Button
                        variant={activeStatusFilter === 'upcoming' ? "success" : "outline-success"}
                        className="me-2"
                        onClick={() => filterByStatus('upcoming')}
                        style={{ 
                            backgroundColor: activeStatusFilter === 'upcoming' ? '#355C7D' : 'transparent',
                            color: activeStatusFilter === 'upcoming' ? 'white' : '#355C7D',
                            borderColor: '#355C7D',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                        }}
                    >
                        Show Upcoming Tours
                    </Button>
                    <Button
                        variant={activeStatusFilter === 'completed' ? "secondary" : "outline-secondary"}
                        onClick={() => filterByStatus('completed')}
                        style={{ 
                            backgroundColor: activeStatusFilter === 'completed' ? '#C06C84' : 'transparent',
                            color: activeStatusFilter === 'completed' ? 'white' : '#C06C84',
                            borderColor: '#C06C84',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                        }}
                    >
                        Show Completed Tours
                    </Button>
                </div>
            </Form>

            {/* Display Total Pax */}
            <div style={{ 
                marginTop: '20px', 
                fontSize: '1.5rem', 
                display: 'flex', 
                justifyContent: 'flex-end',
                color: '#37474f',
                fontWeight: '500',
                padding: '10px 20px',
                backgroundColor: 'white',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e0e0e0'
            }}>
                <strong>👥Total Pax:&nbsp;</strong>
                <span style={{ color: '#355C7D', fontWeight: 'bold' }}>{totalPax}</span>
            </div>

            {/* Bookings Table with header filters */}
            <div className="d-none d-md-block">
                <div className="table-responsive">
                    <Table striped bordered hover responsive className="mt-3" style={{ 
                        backgroundColor: 'white',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px'
                    }}>
                        <thead>
                            <tr style={{ backgroundColor: '#37474f', color: 'white' }}>
                                <th
                                    onClick={() => handleSort('confirmationCode')}
                                    style={{ cursor: 'pointer', fontWeight: '500' }}
                                >
                                    Confirmation Code {getSortIcon('confirmationCode')}
                                </th>
                                <th
                                    onClick={() => handleSort('tourName')}
                                    style={{ cursor: 'pointer', fontWeight: '500' }}
                                >
                                    Tour Name {getSortIcon('tourName')}
                                </th>
                                <th
                                    onClick={() => handleSort('tourId')}
                                    style={{ cursor: 'pointer', fontWeight: '500' }}
                                >
                                    Tour ID {getSortIcon('tourId')}
                                </th>
                                <th
                                    onClick={() => handleSort('name')}
                                    style={{ cursor: 'pointer', fontWeight: '500' }}
                                >
                                    Name {getSortIcon('name')}
                                </th>
                                <th
                                    onClick={() => handleSort('email')}
                                    style={{ cursor: 'pointer', fontWeight: '500' }}
                                >
                                    Email {getSortIcon('email')}
                                </th>
                                <th
                                    onClick={() => handleSort('contact')}
                                    style={{ cursor: 'pointer', fontWeight: '500' }}
                                >
                                    Contact {getSortIcon('contact')}
                                </th>
                                <th
                                    onClick={() => handleSort('date')}
                                    style={{ cursor: 'pointer', fontWeight: '500' }}
                                >
                                    Tour Date {getSortIcon('date')}
                                </th>
                                <th
                                    onClick={() => handleSort('bookingDate')}
                                    style={{ cursor: 'pointer', fontWeight: '500' }}
                                >
                                    Booking Date {getSortIcon('bookingDate')}
                                </th>
                                <th
                                    onClick={() => handleSort('totalPax')}
                                    style={{ cursor: 'pointer', fontWeight: '500' }}
                                >
                                    No Of Pax {getSortIcon('totalPax')}
                                </th>
                                <th style={{ fontWeight: '500' }}>Status/Actions</th>
                            </tr>
                            <tr style={{ backgroundColor: '#f5f7fa' }}>
                                <th>
                                    <Form.Control
                                        size="sm"
                                        type="text"
                                        name="confirmationCode"
                                        placeholder="Filter code..."
                                        value={headerFilters.confirmationCode}
                                        onChange={handleHeaderFilterChange}
                                        style={{ borderColor: '#cfd8dc' }}
                                    />
                                </th>
                                <th>
                                    <Form.Control
                                        size="sm"
                                        type="text"
                                        name="tourName"
                                        placeholder="Filter tour name..."
                                        value={headerFilters.tourName}
                                        onChange={handleHeaderFilterChange}
                                        style={{ borderColor: '#cfd8dc' }}
                                    />
                                </th>
                                <th>
                                    <Form.Control
                                        size="sm"
                                        type="text"
                                        name="tourId"
                                        placeholder="Filter tour ID..."
                                        value={headerFilters.tourId}
                                        onChange={handleHeaderFilterChange}
                                        style={{ borderColor: '#cfd8dc' }}
                                    />
                                </th>
                                <th>
                                    <Form.Control
                                        size="sm"
                                        type="text"
                                        name="name"
                                        placeholder="Filter name..."
                                        value={headerFilters.name}
                                        onChange={handleHeaderFilterChange}
                                        style={{ borderColor: '#cfd8dc' }}
                                    />
                                </th>
                                <th>
                                    <Form.Control
                                        size="sm"
                                        type="text"
                                        name="email"
                                        placeholder="Filter email..."
                                        value={headerFilters.email}
                                        onChange={handleHeaderFilterChange}
                                        style={{ borderColor: '#cfd8dc' }}
                                    />
                                </th>
                                <th>
                                    <Form.Control
                                        size="sm"
                                        type="text"
                                        name="contact"
                                        placeholder="Filter contact..."
                                        value={headerFilters.contact}
                                        onChange={handleHeaderFilterChange}
                                        style={{ borderColor: '#cfd8dc' }}
                                    />
                                </th>
                                <th>
                                    <Form.Control
                                        size="sm"
                                        type="date"
                                        name="date"
                                        value={headerFilters.date}
                                        onChange={handleHeaderFilterChange}
                                        style={{ borderColor: '#cfd8dc' }}
                                    />
                                </th>
                                <th>
                                    <Form.Control
                                        size="sm"
                                        type="date"
                                        name="bookingDate"
                                        value={headerFilters.bookingDate}
                                        onChange={handleHeaderFilterChange}
                                        style={{ borderColor: '#cfd8dc' }}
                                    />
                                </th>
                                <th>
                                    <Form.Select
                                        size="sm"
                                        name="paxCount"
                                        value={headerFilters.paxCount || ''}
                                        onChange={handleHeaderFilterChange}
                                        style={{ borderColor: '#cfd8dc' }}
                                    >
                                        <option value="">All</option>
                                        <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                        <option value="4">4</option>
                                        <option value="5+">5+</option>
                                    </Form.Select>
                                </th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentBookings.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="text-center" style={{ color: '#546e7a' }}>
                                        No bookings found.
                                    </td>
                                </tr>
                            ) : (
                                currentBookings.flatMap((booking) => {
                                    const isExpanded = expandedRows.includes(booking.id);
                                    const hasAdditional = booking.additionalPax?.length > 0;
                                    const isCompleted = isTourCompleted(booking.date);
                                    const rows = [];

                                    rows.push(
                                        <tr key={booking.id}>
                                            <td
                                                onClick={() => hasAdditional && toggleExpand(booking.id)}
                                                style={{
                                                    cursor: hasAdditional ? "pointer" : "default",
                                                    color: hasAdditional ? "#C06C84" : "inherit",
                                                    fontWeight: hasAdditional ? "500" : "normal",
                                                }}
                                            >
                                                {booking.confirmationCode}{" "}
                                                {hasAdditional &&
                                                    (isExpanded ? <FaChevronUp /> : <FaChevronDown />)}
                                            </td>
                                            <td>{booking.tourName}</td>
                                            <td>{booking.tourId?.slice(0, 8)}</td>
                                            <td>{booking.name}</td>
                                            <td>{booking.email}</td>
                                            <td>{booking.contact}</td>
                                            <td>
                                                {booking.date}
                                                {isCompleted && (
                                                    <Badge bg="secondary" className="ms-2" style={{ backgroundColor: '#546e7a' }}>Past</Badge>
                                                )}
                                            </td>
                                            <td>
                                                {booking.bookingDate
                                                    ? new Date(booking.bookingDate).toLocaleDateString()
                                                    : "N/A"}
                                            </td>
                                            <td>{booking.totalPax}</td>
                                            <td>
                                                {isCompleted ? (
                                                    <span className="d-flex align-items-center p-2" style={{
                                                        backgroundColor: '#355C7D',
                                                        color: '#ffffff',


                                                        display: 'inline-flex'
                                                    }}>
                                                        <FaCheck className="me-1" /> Completed
                                                    </span>
                                                ) : (
                                                    <>
                                                        <Button
                                                            onClick={() => handleShowModal(booking.id)}
                                                            style={{
                                                                marginRight: "5px",
                                                                backgroundColor: '#FBB195',
                                                                borderColor: '#FBB195',
                                                                color: '#ffffff'
                                                            }}
                                                            size="sm"
                                                        >
                                                            Update
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleDeleteBooking(booking.id)}
                                                            size="sm"
                                                            style={{
                                                                marginLeft: "5px",
                                                                backgroundColor: '#C06C84',
                                                                borderColor: '#C06C84',
                                                                color: '#ffffff'
                                                            }}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    );

                                    if (isExpanded && hasAdditional) {
                                        booking.additionalPax.forEach((pax, index) => {
                                            rows.push(
                                                <tr key={`${booking.id}-additional-${index}`} style={{ backgroundColor: '#f5f7fa' }}>
                                                    <td></td>
                                                    <td></td>
                                                    <td></td>
                                                    <td>{pax.name}</td>
                                                    <td></td>
                                                    <td>{pax.contact}</td>
                                                    <td></td>
                                                    <td></td>
                                                    <td></td>
                                                    <td></td>
                                                </tr>
                                            );
                                        });
                                    }

                                    return rows;
                                })
                            )}
                        </tbody>
                    </Table>
                </div>

                {/* Pagination Controls */}
                <div className="d-flex justify-content-between align-items-center mt-3">
                    <div className="d-flex align-items-center">
                        <span className="me-2" style={{ color: '#455a64' }}>Rows per page:</span>
                        <Form.Select
                            value={rowsPerPage}
                            onChange={handleRowsPerPageChange}
                            style={{ width: 'auto', borderColor: '#cfd8dc' }}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </Form.Select>
                        <span className="ms-3" style={{ color: '#455a64' }}>
                            Showing {startIndex + 1} to {Math.min(endIndex, filteredBookings.length)} of {filteredBookings.length} entries
                        </span>
                    </div>

                    <div className="d-flex">
                        <Button
                            variant="outline-secondary"
                            onClick={() => handlePageChange(1)}
                            disabled={currentPage === 1}
                            className="me-2"
                            style={{ borderColor: '#cfd8dc', color: '#455a64' }}
                        >
                            First
                        </Button>
                        <Button
                            variant="outline-secondary"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="me-2"
                            style={{ borderColor: '#cfd8dc', color: '#455a64' }}
                        >
                            Previous
                        </Button>

                        {getPageNumbers().map((pageNumber) => (
                            <Button
                                key={pageNumber}
                                variant={currentPage === pageNumber ? "primary" : "outline-secondary"}
                                onClick={() => handlePageChange(pageNumber)}
                                className="me-2"
                                style={{
                                    backgroundColor: currentPage === pageNumber ? '#37474f' : 'transparent',
                                    borderColor: currentPage === pageNumber ? '#37474f' : '#cfd8dc',
                                    color: currentPage === pageNumber ? 'white' : '#455a64'
                                }}
                            >
                                {pageNumber}
                            </Button>
                        ))}

                        <Button
                            variant="outline-secondary"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="me-2"
                            style={{ borderColor: '#cfd8dc', color: '#455a64' }}
                        >
                            Next
                        </Button>
                        <Button
                            variant="outline-secondary"
                            onClick={() => handlePageChange(totalPages)}
                            disabled={currentPage === totalPages}
                            style={{ borderColor: '#cfd8dc', color: '#455a64' }}
                        >
                            Last
                        </Button>
                    </div>
                </div>
            </div>
            {/* Card layout - visible on small screens */}
            <div className="d-block d-md-none">
                {currentBookings.map((booking, idx) => {
                    const isCompleted = isTourCompleted(booking.date);
                    return (
                        <div key={booking.id} className="card mb-3">
                            <div className="card-body">
                                <h5 className="card-title">Booking #{idx + 1}
                                    {isCompleted && (
                                        <Badge bg="success" className="ms-2">Completed</Badge>
                                    )}
                                </h5>
                                <p className="mb-1"><strong>Confirmation:</strong> {booking.confirmationCode}</p>
                                <p className="mb-1"><strong>Tour:</strong> {booking.tourName}</p>
                                <p className="mb-1"><strong>Name:</strong> {booking.name}</p>
                                <p className="mb-1"><strong>Date:</strong> {booking.date}</p>
                                <p className="mb-1"><strong>Total Pax:</strong> {booking.totalPax}</p>

                                {!isCompleted && (
                                    <div className="mt-2">
                                        <Button
                                            variant="warning"
                                            onClick={() => handleShowModal(booking.id)}
                                            size="sm"
                                            className="me-2"
                                        >
                                            Update
                                        </Button>
                                        <Button
                                            variant="danger"
                                            onClick={() => handleDeleteBooking(booking.id)}
                                            size="sm"
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Mobile Pagination Controls */}
                <div className="d-flex justify-content-between align-items-center mt-3">
                    <div className="d-flex align-items-center">
                        <span className="me-2">Rows:</span>
                        <Form.Select
                            value={rowsPerPage}
                            onChange={handleRowsPerPageChange}
                            size="sm"
                            style={{ width: 'auto' }}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                        </Form.Select>
                    </div>

                    <div className="d-flex">
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="me-2"
                        >
                            Prev
                        </Button>
                        <span className="mx-2">
                            {currentPage} / {totalPages}
                        </span>
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>

            {/* Modal for updating booking */}
            <Modal show={showModal} onHide={handleClose} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Booking Form</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        {/* Personal Details */}
                        <Form.Group className="mb-3" controlId="formBasicName">
                            <Form.Label>Full Name as per ID</Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                placeholder="Enter your full name"
                                value={bookingData.name}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formBasicEmail">
                            <Form.Label>Email Address</Form.Label>
                            <Form.Control
                                type="email"
                                name="email"
                                placeholder="Enter your email"
                                value={bookingData.email}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        {/* Contact Number */}
                        <Form.Group className="mb-3" controlId="formBasicContact">
                            <Form.Label>Contact Number</Form.Label>
                            <Form.Control
                                type="text"
                                name="contact"
                                placeholder="Enter your phone number"
                                value={bookingData.contact}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        {/* Date of Tour */}
                        <Form.Group className="mb-3" controlId="formBasicDate">
                            <Form.Label>Date of Tour</Form.Label>
                            <Form.Control
                                type="date"
                                name="date"
                                value={bookingData.date}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        {/* Number of People */}
                        <Form.Group className="mb-3" controlId="formBasicPeople">
                            <Form.Label>Number of Pax</Form.Label>
                            <Form.Control
                                type="number"
                                name="totalPax"
                                value={bookingData.totalPax}
                                onChange={handleChange}
                                required
                                min={1}
                            />
                        </Form.Group>

                        {/* Additional Pax */}
                        {bookingData.totalPax > 1 && bookingData.additionalPax.map((_, index) => (
                            <div key={index} className="mb-3 p-3 border rounded">
                                <h5>Additional Pax {index + 2}</h5>
                                <Form.Group className="mb-3" controlId={`formAdditionalName${index}`}>
                                    <Form.Label>Full Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        placeholder={`Enter name for additional pax ${index + 2}`}
                                        value={bookingData.additionalPax[index]?.name || ''}
                                        onChange={(e) => handleAdditionalPaxChange(index, e)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId={`formAdditionalContact${index}`}>
                                    <Form.Label>Contact Number</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="contact"
                                        placeholder={`Enter contact number for pax ${index + 2}`}
                                        value={bookingData.additionalPax[index]?.contact || ''}
                                        onChange={(e) => handleAdditionalPaxChange(index, e)}
                                        required
                                    />
                                </Form.Group>
                            </div>
                        ))}

                        {/* Special Requests */}
                        <Form.Group className="mb-3" controlId="formBasicSpecialRequest">
                            <Form.Label>Special Requests</Form.Label>
                            <Form.Control
                                as="textarea"
                                name="specialRequest"
                                rows={3}
                                value={bookingData.specialRequest || ''}
                                onChange={handleChange}
                            />
                        </Form.Group>

                        {/* Submit Button */}
                        <Button type="submit" variant="primary">
                            Update Booking
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default BookingList;