import React, { useState } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';

const EnquiryForm = ({ show, onHide, tourName }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        contact: '',
        message: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Here you can add the logic to handle form submission
        console.log('Form submitted:', formData);
        // Reset form
        setFormData({
            name: '',
            email: '',
            contact: '',
            message: ''
        });
        onHide();
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Enquiry Form</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Full Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Enter your full name"
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="Enter your email"
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Contact Number <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            type="tel"
                            name="contact"
                            value={formData.contact}
                            onChange={handleChange}
                            required
                            placeholder="Enter your contact number"
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Message</Form.Label>
                        <Form.Control
                            as="textarea"
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Enter your message or special requirements"
                        />
                    </Form.Group>

                    <div className="d-grid">
                        <Button 
                            type="submit" 
                            style={{
                                background: '#ffed31',
                                color: '#222',
                                border: 'none',
                                fontWeight: 500
                            }}
                        >
                            Submit Enquiry
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default EnquiryForm; 