import { Container, Row, Col, Pagination } from "react-bootstrap";
import Super from "../components/Super";
import GroupToursImg from "../assets/4.jpg";
import Footer from "../components/Footer";
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setTours } from '../tourSlice';
import { db } from '../firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';
import TourCard from '../components/TourCard';
import ErrorBoundary from "../components/ErrorBoundary.jsx";
import FilterSidebar from "../components/FilterSidebar";
import CurrencyConverter from "../components/CurrencyConverter";
import CustomToursBanner from "../components/CustomToursBanner";
import "./GroupToursStyles.css";

export default function GroupTours() {
    const dispatch = useDispatch();
    const allTours = useSelector((state) => state.tours.tours);
    const [filteredTours, setFilteredTours] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const toursPerPage = 6; // Changed from 9 to 3 tours per page

    // Fetch tours from Firebase
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'tourCards'), (snapshot) => {
            const toursData = snapshot.docs.map((doc) => ({ id: doc.id.substring(0, 8), ...doc.data() }));
            dispatch(setTours(toursData));
            setFilteredTours(toursData); // Initialize filtered tours with all tours
        });

        // Cleanup on unmount
        return () => unsubscribe();
    }, [dispatch]);

    // Calculate pagination
    const indexOfLastTour = currentPage * toursPerPage;
    const indexOfFirstTour = indexOfLastTour - toursPerPage;
    const currentTours = filteredTours.slice(indexOfFirstTour, indexOfLastTour);
    const totalPages = Math.ceil(filteredTours.length / toursPerPage);

    // Handle page change
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Handle filtering
    const handleFilter = (filterParams) => {
        if (!filterParams) {
            // If no filters are applied, show all tours
            setFilteredTours(allTours);
            setCurrentPage(1); // Reset to first page when filters change
            return;
        }

        const { destinations, categories, priceRange } = filterParams;

        const filtered = allTours.filter(tour => {
            // Check if the tour object and its properties exist
            if (!tour) return false;

            // Filter by destination if any are selected
            const passesDestination = destinations.length === 0 ||
                destinations.some(dest => {
                    // Check different possible destination fields
                    return (tour.destination && tour.destination.toUpperCase().includes(dest)) ||
                        (tour.location && tour.location.toUpperCase().includes(dest)) ||
                        (tour.name && tour.name.toUpperCase().includes(dest));
                });

            // Filter by category if any are selected
            const passesCategory = categories.length === 0 ||
                categories.some(cat => {
                    // Check different possible category fields
                    return (tour.category && tour.category.includes(cat)) ||
                        (tour.type && tour.type.includes(cat));
                });

            // Filter by price range
            let price = null;
            if (tour.price) {
                // Handle different price formats
                if (typeof tour.price === 'string') {
                    // Remove currency symbols and commas
                    price = parseFloat(tour.price.replace(/[^0-9.]/g, ''));
                } else if (typeof tour.price === 'number') {
                    price = tour.price;
                }
            }

            const passesMinPrice = !priceRange.min || !price || price >= parseFloat(priceRange.min);
            const passesMaxPrice = !priceRange.max || !price || price <= parseFloat(priceRange.max);

            return passesDestination && passesCategory && passesMinPrice && passesMaxPrice;
        });

        console.log("Filtered tours:", filtered);
        setFilteredTours(filtered);
        setCurrentPage(1); // Reset to first page when filters change
    };

    return (
        <ErrorBoundary>
            <Container fluid className="p-0">
                <Super
                    className="super-mid"
                    superImg={GroupToursImg}
                    title="Group Tours"
                    btnClass="hide"
                />
            </Container>


            <CustomToursBanner />

            <Container className="tour-container">
                <Row>
                    <Col lg={3} md={4} className="mb-4">
                        <FilterSidebar onFilter={handleFilter} />
                    </Col>

                    <Col lg={9} md={8}>
                        <h1 className="mb-4">Explore Our Tours</h1>
                        <div className="tour-cards">
                            {currentTours && currentTours.length > 0 ? (
                                currentTours.map((tour) => (
                                    <TourCard key={tour.id || Math.random().toString()} tour={tour} />
                                ))
                            ) : (
                                <p>No tours match your filter criteria.</p>
                            )}
                        </div>

                        {/* Pagination Controls */}
                        {filteredTours.length > toursPerPage && (
                            <div className="pagination-container">
                                <Pagination>
                                    <Pagination.First
                                        onClick={() => handlePageChange(1)}
                                        disabled={currentPage === 1}
                                    />
                                    <Pagination.Prev
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    />

                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <Pagination.Item
                                            key={page}
                                            active={page === currentPage}
                                            onClick={() => handlePageChange(page)}
                                        >
                                            {page}
                                        </Pagination.Item>
                                    ))}

                                    <Pagination.Next
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    />
                                    <Pagination.Last
                                        onClick={() => handlePageChange(totalPages)}
                                        disabled={currentPage === totalPages}
                                    />
                                </Pagination>
                            </div>
                        )}
                    </Col>
                </Row>
            </Container>

            <Footer />
        </ErrorBoundary>
    );
}