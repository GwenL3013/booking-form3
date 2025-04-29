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
import { motion } from 'framer-motion';
import "./GroupToursStyles.css";

export default function GroupTours() {
    const dispatch = useDispatch();
    const allTours = useSelector((state) => state.tours.tours);
    const [filteredTours, setFilteredTours] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const toursPerPage = 6;

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'tourCards'), (snapshot) => {
            const toursData = snapshot.docs.map((doc) => ({
                id: doc.id.substring(0, 8),
                ...doc.data()
            }));
            dispatch(setTours(toursData));
            setFilteredTours(toursData);
        });
        return () => unsubscribe();
    }, [dispatch]);

    const indexOfLastTour = currentPage * toursPerPage;
    const indexOfFirstTour = indexOfLastTour - toursPerPage;
    const currentTours = filteredTours.slice(indexOfFirstTour, indexOfLastTour);
    const totalPages = Math.ceil(filteredTours.length / toursPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleFilter = (filterParams) => {
        if (!filterParams) {
            setFilteredTours(allTours);
            setCurrentPage(1);
            return;
        }

        const { destinations, categories, priceRange } = filterParams;

        const filtered = allTours.filter(tour => {
            if (!tour) return false;

            const passesDestination = destinations.length === 0 ||
                destinations.some(dest => {
                    return (
                        (tour.destination && tour.destination.toUpperCase().includes(dest)) ||
                        (tour.location && tour.location.toUpperCase().includes(dest)) ||
                        (tour.name && tour.name.toUpperCase().includes(dest))
                    );
                });

            const passesCategory = categories.length === 0 ||
                categories.some(cat => {
                    return (
                        (tour.category && tour.category.includes(cat)) ||
                        (tour.type && tour.type.includes(cat))
                    );
                });

            let price = null;
            if (tour.price) {
                if (typeof tour.price === 'string') {
                    price = parseFloat(tour.price.replace(/[^0-9.]/g, ''));
                } else if (typeof tour.price === 'number') {
                    price = tour.price;
                }
            }

            const passesMinPrice = !priceRange.min || !price || price >= parseFloat(priceRange.min);
            const passesMaxPrice = !priceRange.max || !price || price <= parseFloat(priceRange.max);

            return passesDestination && passesCategory && passesMinPrice && passesMaxPrice;
        });

        setFilteredTours(filtered);
        setCurrentPage(1);
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

            {/* Banner Animation (from bottom to top) */}
            <motion.div
                initial={{ y: 80, opacity: 0 }}  // More pronounced movement from bottom
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }} // Slower with smooth transition
            >
                <CustomToursBanner />
            </motion.div>

            <Container className="tour-container">
                <Row>
                    {/* Filter Sidebar Animation (from left with bigger movement) */}
                    <Col lg={3} md={4} className="mb-4">
                        <motion.div
                            initial={{ x: -120, opacity: 0 }}  // Increased left movement for more dramatic effect
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}  // Slower and smoother
                        >
                            <FilterSidebar onFilter={handleFilter} />
                        </motion.div>
                    </Col>

                    <Col lg={9} md={8}>
                        <h1 className="mb-4">Explore Our Tours</h1>
                        <div className="tour-cards">
                            {currentTours && currentTours.length > 0 ? (
                                currentTours.map((tour, index) => (
                                    <motion.div
                                        key={tour.id || index}
                                        initial={{ opacity: 0, y: 80 }}  // Start from lower position for more dramatic effect
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{
                                            duration: 2,  // Slower transition
                                            delay: index * 0.3,  // Increased delay to make the stagger more noticeable
                                            ease: "easeInOut"
                                        }}
                                        viewport={{ once: true }}
                                    >
                                        <TourCard tour={tour} />
                                    </motion.div>
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
