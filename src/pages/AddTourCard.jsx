import React, { useState } from 'react';
import { db, storage } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Modal, Button, Form } from 'react-bootstrap';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Import Firebase storage methods

const AddTourCard = ({ onClose }) => {
    const [newTour, setNewTour] = useState({
        name: '',
        description: '',
        price: '',
        images: [],
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [show, setShow] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0); // Error handling state
    const navigate = useNavigate(); // For navigation after creating the tour

    // Close Modal
    const handleClose = () => {
        console.log('Modal is closing...');
        setShow(false);
        if (onClose) onClose();
    };

    // Handle form submission to create a new tour card
    const handleCreateTour = async (e) => {
        e.preventDefault();
        if (!newTour.name || !newTour.description || !newTour.price) {
            setError('Please fill in all fields!');
            return;
        }

        try {
            setLoading(true);

            // Upload images to Firebase Storage and get their URLs
            const uploadedImageUrls = await uploadImages(newTour.images);

            // Add new tour card to Firestore with image URLs
            await addDoc(collection(db, 'tourCards'), {
                name: newTour.name,
                description: newTour.description,
                price: parseFloat(newTour.price), // Ensure price is a number
                fullyBooked: false,
                images: uploadedImageUrls, // Store URLs in Firestore
            });

            handleClose();
        } catch (err) {
            console.error('Error creating tour:', err);
            setError('Error creating the tour. Please try again.');
        } finally {
            setLoading(false); // Stop loading once the operation is complete
        }
    };

    // Handle image file change
    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        const imageUrls = files.map((file) => URL.createObjectURL(file)); // Create object URLs for preview
        setNewTour((prevState) => ({
            ...prevState,
            images: [...prevState.images, ...files], // Store the actual files for upload
        }));
    };

    // Function to upload images to Firebase Storage and return URLs
    const uploadImages = async (images) => {
        const imageUrls = [];

        // Loop through all images and upload them
        for (const image of images) {
            const imageRef = ref(storage, `tourImages/${image.name}`); // Reference to storage location
            try {
                // Upload image to Firebase Storage
                await uploadBytes(imageRef, image);

                // Get the download URL for the uploaded image
                const downloadURL = await getDownloadURL(imageRef);
                imageUrls.push(downloadURL);
            } catch (error) {
                console.error('Error uploading image:', error);
                setError('Error uploading images.');
                return [];
            }
        }

        return imageUrls; // Return the list of image URLs
    };

    // Handle left and right navigation of images
    const handlePrevImage = () => {
        if (currentImageIndex > 0) {
            setCurrentImageIndex(currentImageIndex - 1);
        }
    };

    const handleNextImage = () => {
        if (currentImageIndex < newTour.images.length - 1) {
            setCurrentImageIndex(currentImageIndex + 1);
        }
    };

    return (
        <div>
            <Modal show={show} onHide={handleClose} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Add Tour Card</Modal.Title>
                </Modal.Header>

                <Form onSubmit={handleCreateTour}>
                    <Modal.Body className="addTourCardBody">
                        {error && <div style={{ color: 'red' }}>{error}</div>}
                        <Form.Group className="mb-3" controlId="title">
                            <Form.Label>Tour Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={newTour.name}
                                onChange={(e) => setNewTour({ ...newTour, name: e.target.value })}
                                placeholder="Tour Name"
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="description">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Tour Description"
                                value={newTour.description}
                                onChange={(e) => setNewTour({ ...newTour, description: e.target.value })}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="price">
                            <Form.Label>Price</Form.Label>
                            <Form.Control
                                type="number"
                                placeholder="Tour Price"
                                value={newTour.price}
                                onChange={(e) => setNewTour({ ...newTour, price: e.target.value })}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="images">
                            <Form.Label>Images</Form.Label>
                            <Form.Control
                                type="file"
                                multiple
                                onChange={handleImageChange}
                            />
                            {newTour.images.length > 0 && (
                                <div className="image-navigation">
                                    <Button onClick={handlePrevImage} disabled={currentImageIndex === 0}>
                                        &lt; Prev
                                    </Button>
                                    <img
                                        src={URL.createObjectURL(newTour.images[currentImageIndex])}
                                        alt="Tour Preview"
                                        style={{ width: '100%', height: 'auto', margin: '10px 0' }}
                                    />
                                    <Button onClick={handleNextImage} disabled={currentImageIndex === newTour.images.length - 1}>
                                        Next &gt;
                                    </Button>
                                </div>
                            )}
                        </Form.Group>

                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? 'Submitting...' : 'Add Tour'}
                        </Button>
                    </Modal.Body>
                </Form>
            </Modal>
        </div>
    );
};

export default AddTourCard;
