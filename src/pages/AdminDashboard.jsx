import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../firebase/config';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import AddTourCard from '../pages/AddTourCard';

import {
    collection,
    getDocs,
    deleteDoc,
    doc,
    updateDoc,
} from 'firebase/firestore';
import {
    Card,
    Button,
    Carousel,
    Container,
    Row,
    Col,
    Form,
    Badge,
    Tooltip,
    OverlayTrigger,
    Spinner,
    Pagination,
} from 'react-bootstrap';

import './AdminDashboard.css';

const ITEMS_PER_PAGE = 6; // Number of items to show per page

const AdminDashboard = () => {
    const [tourCards, setTourCards] = useState([]);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [editTourId, setEditTourId] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editData, setEditData] = useState({
        name: '',
        description: '',
        price: '',
        images: [],
    });
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        fetchTourCards();
    }, [currentPage]);

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const fetchTourCards = async () => {
        try {
            setIsLoading(true);
            const querySnapshot = await getDocs(collection(db, 'tourCards'));
            const cards = querySnapshot.docs.map((doc) => ({
                ...doc.data(),
                fullId: doc.id,             // Store the full ID for operations
                id: doc.id.substring(0, 8)  // Store truncated ID like in user dashboard
            }));
            setTourCards(cards);
            setTotalPages(Math.ceil(cards.length / ITEMS_PER_PAGE));
            setError(null);
        } catch (err) {
            console.error('Error fetching tours:', err);
            setError('Failed to load tours');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTour = async (id, fullId) => {
        if (window.confirm('Are you sure you want to delete this tour?')) {
            try {
                await deleteDoc(doc(db, 'tourCards', fullId));
                setTourCards((prev) => prev.filter((tour) => tour.id !== id));
                setSuccessMessage('Tour deleted successfully!');
            } catch (err) {
                console.error('Error deleting tour:', err);
                setError('Failed to delete tour');
            }
        }
    };

    const startEditing = (tour) => {
        setEditTourId(tour.id);
        setEditData({
            name: tour.name,
            description: tour.description,
            price: tour.price,
            images: tour.images || [],
        });
    };

    const handleImageChange = async (index, event) => {
        const file = event.target.files[0];
        if (!file) return;

        const storageRef = ref(storage, `tourImages/${Date.now()}-${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            'state_changed',
            null,
            (error) => {
                console.error('Upload error:', error);
                setError('Failed to upload image');
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                const updatedImages = [...editData.images];
                updatedImages[index] = downloadURL;
                setEditData({ ...editData, images: updatedImages });
            }
        );
    };

    const addImage = () => {
        setEditData({ ...editData, images: [...editData.images, null] });
    };

    const removeImage = (index) => {
        const updatedImages = editData.images.filter((_, i) => i !== index);
        setEditData({ ...editData, images: updatedImages });
    };

    const handleUpdateTour = async () => {
        if (!editData.name || !editData.description || !editData.price) {
            setError('Please fill all fields before saving.');
            return;
        }

        const hasEmptyImage = editData.images.some((img) => !img);
        if (hasEmptyImage) {
            setError('Please wait for all image uploads to complete.');
            return;
        }
        setError('');
        setIsLoading(true);

        try {
            // Find the tour with the matching truncated ID to get its full ID
            const tourToUpdate = tourCards.find(tour => tour.id === editTourId);

            if (!tourToUpdate) {
                throw new Error('Tour not found');
            }

            await updateDoc(doc(db, 'tourCards', tourToUpdate.fullId), {
                name: editData.name,
                description: editData.description,
                price: parseFloat(editData.price),
                images: editData.images,
            });

            await fetchTourCards();
            setSuccessMessage('Tour updated successfully!');
            setEditTourId(null);
            setEditData({ name: '', description: '', price: '', images: [] });
        } catch (err) {
            console.error('Error updating tour:', err);
            setError('Failed to update tour');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCardClick = (tour) => {
        // Changed from /tour/:id to /admin/tour/:id to match your route
        navigate(`/admin/tour/${tour.id}`);
    };

    const getCurrentPageItems = () => {
        let filteredCards = tourCards;

        // Apply search filter if there's a search query
        if (searchQuery) {
            filteredCards = tourCards.filter(tour =>
                tour.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredCards.slice(startIndex, endIndex);
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset to first page when searching
    };

    return (
        <Container className="mt-4">
            <h2 className="text-center mb-4">Admin Dashboard - Manage Tours</h2>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <Form.Control
                    type="text"
                    placeholder="Search destinations..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    style={{ maxWidth: '300px' }}
                />
                <Button
                    variant="success"
                    onClick={() => setShowAddModal(true)}
                >
                    + Add New Tour
                </Button>
            </div>

            {showAddModal && <AddTourCard onClose={() => setShowAddModal(false)} />}

            {successMessage && (
                <div className="alert alert-success text-center">{successMessage}</div>
            )}
            {error && (
                <div className="alert alert-danger text-center">{error}</div>
            )}

            {isLoading ? (
                <div className="text-center">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                </div>
            ) : (
                <>
                    {getCurrentPageItems().length === 0 ? (
                        <div className="text-center mt-4">
                            <p>No tours found matching your search.</p>
                        </div>
                    ) : (
                        <>
                            <Row>
                                {getCurrentPageItems().map((tour) => (
                                    <Col md={4} className="mb-4" key={tour.id}>
                                        <Card>
                                            <div
                                                className="card-clickable-area"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => handleCardClick(tour)}
                                            >
                                                {tour.images?.length > 0 ? (
                                                    <Carousel interval={null} onClick={(e) => e.stopPropagation()}>
                                                        {tour.images.map((url, index) => (
                                                            <Carousel.Item key={index}>
                                                                <img
                                                                    className="d-block w-100"
                                                                    src={url}
                                                                    alt={`Tour Image ${index + 1}`}
                                                                    style={{ height: '200px', objectFit: 'cover' }}
                                                                />
                                                            </Carousel.Item>
                                                        ))}
                                                    </Carousel>
                                                ) : (
                                                    <Card.Img
                                                        variant="top"
                                                        src="https://via.placeholder.com/300x200"
                                                    />
                                                )}

                                                {editTourId !== tour.id && (
                                                    <Card.Body>
                                                        <Card.Title>{tour.name}</Card.Title>
                                                        <Card.Text>{tour.description}</Card.Text>
                                                        <Card.Subtitle className="mb-2 text-muted">
                                                            Price: RM {tour.price}
                                                        </Card.Subtitle>
                                                    </Card.Body>
                                                )}
                                            </div>

                                            <Card.Body>
                                                {editTourId === tour.id ? (
                                                    <>
                                                        <Form.Group className="mb-2">
                                                            <Form.Label>Name</Form.Label>
                                                            <Form.Control
                                                                value={editData.name}
                                                                onChange={(e) =>
                                                                    setEditData({ ...editData, name: e.target.value })
                                                                }
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        </Form.Group>
                                                        <Form.Group className="mb-2">
                                                            <Form.Label>Description</Form.Label>
                                                            <Form.Control
                                                                value={editData.description}
                                                                onChange={(e) =>
                                                                    setEditData({ ...editData, description: e.target.value })
                                                                }
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        </Form.Group>
                                                        <Form.Group className="mb-2">
                                                            <Form.Label>Price</Form.Label>
                                                            <Form.Control
                                                                type="number"
                                                                value={editData.price}
                                                                onChange={(e) =>
                                                                    setEditData({ ...editData, price: e.target.value })
                                                                }
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        </Form.Group>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label>Images</Form.Label>
                                                            {editData.images.map((image, index) => (
                                                                <div key={index} className="d-flex mb-2 align-items-center">
                                                                    {!image ? (
                                                                        <Form.Control
                                                                            type="file"
                                                                            onChange={(e) => handleImageChange(index, e)}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        />
                                                                    ) : (
                                                                        <>
                                                                            <img
                                                                                src={image}
                                                                                alt={`Preview ${index}`}
                                                                                style={{
                                                                                    width: '50px',
                                                                                    height: '50px',
                                                                                    objectFit: 'cover',
                                                                                    marginRight: '10px',
                                                                                }}
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            />
                                                                            <Button
                                                                                variant="danger"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    removeImage(index);
                                                                                }}
                                                                                className="ms-2"
                                                                            >
                                                                                Remove
                                                                            </Button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            ))}
                                                            <Button
                                                                variant="primary"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    addImage();
                                                                }}
                                                            >
                                                                + Add Image
                                                            </Button>
                                                        </Form.Group>

                                                        <Button
                                                            variant="success"
                                                            className="me-2"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleUpdateTour();
                                                            }}
                                                            disabled={isLoading}
                                                        >
                                                            {isLoading ? <Spinner animation="border" size="sm" /> : 'Save'}
                                                        </Button>
                                                        <Button
                                                            variant="secondary"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditTourId(null);
                                                            }}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                                            <div>
                                                                <strong>Status:</strong>{' '}
                                                                <Badge
                                                                    bg={
                                                                        tour.status === 'available'
                                                                            ? 'success'
                                                                            : tour.status === 'sold-out'
                                                                                ? 'danger'
                                                                                : 'warning'
                                                                    }
                                                                >
                                                                    {tour.status?.replace('-', ' ').toUpperCase()}
                                                                </Badge>
                                                            </div>

                                                            <Form.Select
                                                                size="sm"
                                                                style={{ maxWidth: '150px' }}
                                                                value={tour.status}
                                                                onClick={(e) => e.stopPropagation()}
                                                                onChange={async (e) => {
                                                                    const newStatus = e.target.value;
                                                                    try {
                                                                        await updateDoc(
                                                                            doc(db, 'tourCards', tour.fullId),  // Fixed to use fullId
                                                                            { status: newStatus }
                                                                        );
                                                                        setSuccessMessage('Status updated successfully!');
                                                                        fetchTourCards();
                                                                    } catch (err) {
                                                                        console.error('Error updating status:', err);
                                                                        setError('Failed to update status');
                                                                    }
                                                                }}
                                                            >
                                                                <option value="available">Available</option>
                                                                <option value="sold-out">Sold Out</option>
                                                                <option value="coming-soon">Coming Soon</option>
                                                            </Form.Select>
                                                        </div>

                                                        <OverlayTrigger overlay={<Tooltip>Edit this tour</Tooltip>}>
                                                            <Button
                                                                variant="primary"
                                                                className="me-2"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    startEditing(tour);
                                                                }}
                                                            >
                                                                Edit
                                                            </Button>
                                                        </OverlayTrigger>

                                                        <OverlayTrigger overlay={<Tooltip>Delete this tour</Tooltip>}>
                                                            <Button
                                                                variant="danger"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteTour(tour.id, tour.fullId);
                                                                }}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </OverlayTrigger>
                                                    </>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>

                            {tourCards.length > 0 && (
                                <div className="d-flex justify-content-center mt-4 mb-4">
                                    <Pagination className="pagination-lg">
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
                                                style={{
                                                    margin: '0 2px',
                                                    minWidth: '40px',
                                                    textAlign: 'center'
                                                }}
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
                        </>
                    )}
                </>
            )}
        </Container>
    );
};

export default AdminDashboard;