// src/components/MediaUploader.jsx
import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import { CameraVideo, Image as ImageIcon, X } from 'react-bootstrap-icons';

const MediaUploader = ({ onUpload }) => {
    const [file, setFile] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            onUpload(selectedFile);
        }
    };

    const clearFile = () => {
        setFile(null);
        onUpload(null);
    };

    return (
        <div className="d-flex align-items-center mb-2">
            <Form.Label className="me-2 mb-0" style={{ cursor: 'pointer' }}>
                <ImageIcon size={20} />
                <Form.Control 
                    type="file" 
                    accept="image/*,video/*" 
                    onChange={handleFileChange} 
                    style={{ display: 'none' }} 
                />
            </Form.Label>
            {file && (
                <div className="d-flex align-items-center">
                    <span className="me-2">{file.name}</span>
                    <X size={20} style={{ cursor: 'pointer' }} onClick={clearFile} />
                </div>
            )}
        </div>
    );
};

export default MediaUploader;
