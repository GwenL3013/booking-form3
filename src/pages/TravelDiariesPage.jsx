import React, { useState } from 'react';
import { db, storage } from '../firebase'; // Firebase import paths
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button, Form, Col, Row, Container, Alert } from 'react-bootstrap'; // Importing Container, Alert for error messages
import { getAuth } from 'firebase/auth'; // Importing Firebase Auth
import TravelDiariesList from '../components/TravelDiariesList';

const TravelDiariesPage = () => {
  const [title, setTitle] = useState(''); // State for title input
  const [text, setText] = useState(''); // State for text input
  const [images, setImages] = useState([]); // State to hold multiple images
  const [video, setVideo] = useState(null); // State for video
  const [isLoading, setIsLoading] = useState(false); // Loading state for the post submission
  const [errorMessage, setErrorMessage] = useState(''); // State for error messages

  const handleTextChange = (e) => setText(e.target.value);
  const handleTitleChange = (e) => setTitle(e.target.value); // Handle title change
  const handleImageChange = (e) => setImages(e.target.files); // Handle image file selection
  const handleVideoChange = (e) => setVideo(e.target.files[0]); // Handle video file selection

  // Function to upload media (image or video)
  const uploadMedia = async (file, type) => {
    const fileRef = ref(storage, `posts/${file.name}`);
    try {
      await uploadBytes(fileRef, file);
      const mediaUrl = await getDownloadURL(fileRef);
      return mediaUrl;  // Return media URL for Firestore
    } catch (error) {
      console.error("Error uploading media: ", error);
      setErrorMessage('Failed to upload media, please try again.');
      return null;
    }
  };

  // Get the current authenticated user
  const auth = getAuth();
  const currentUser = auth.currentUser;

  // Handle post submission
  const handlePostSubmit = async () => {
    if (!title.trim() && !text.trim() && images.length === 0 && !video) {
      setErrorMessage('Please provide a title, text, or upload an image/video.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(''); // Reset error message
    try {
      let imageUrls = [];
      let videoUrl = '';

      // Upload images if available
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const imageUrl = await uploadMedia(images[i], 'image');
          if (imageUrl) {
            imageUrls.push(imageUrl);
          }
        }
      }

      // Upload video if available
      if (video) {
        videoUrl = await uploadMedia(video, 'video');
      }

      // Create a new post document in Firestore
      const newPost = {
        userId: currentUser ? currentUser.uid : 'guest', // Use the authenticated user's ID
        title,
        text,
        imageUrls, // Array of image URLs
        videoUrl,
        timestamp: serverTimestamp(),
        likes: [],
        comments: []
      };

      // Save the post in the "travelDiaries" collection
      await addDoc(collection(db, 'travelDiaries'), newPost);
      setTitle('');
      setText('');
      setImages([]);
      setVideo(null);
      setIsLoading(false);
      alert("Your post has been successfully created!");
    } catch (error) {
      console.error("Error adding post: ", error);
      setErrorMessage('An error occurred while posting, please try again later.');
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '2rem 0'
    }}>
      <Container fluid="md" className="mt-4" style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '2.5rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <div className="text-center">
          <h1 className="mb-4" style={{ 
            color: '#2c3e50',
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
          }}>Share Your Travel Experience</h1>

          {errorMessage && (
            <Alert variant="danger" onClose={() => setErrorMessage('')} dismissible>
              {errorMessage}
            </Alert>
          )}

          <Form className="mb-4" onSubmit={(e) => e.preventDefault()} style={{
            background: 'rgba(255, 255, 255, 0.8)',
            padding: '2rem',
            borderRadius: '15px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <Form.Group controlId="postTitle" className="mb-4">
              <Form.Label style={{ 
                color: '#2c3e50',
                fontWeight: '500',
                fontSize: '1.1rem'
              }}>Title</Form.Label>
              <Form.Control
                type="text"
                value={title}
                onChange={handleTitleChange}
                placeholder="Add a title"
                style={{
                  border: '2px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '0.8rem'
                }}
              />
            </Form.Group>

            <Form.Group controlId="postText" className="mb-4">
              <Form.Label style={{ 
                color: '#2c3e50',
                fontWeight: '500',
                fontSize: '1.1rem'
              }}>Your Travel Diary</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={text}
                onChange={handleTextChange}
                placeholder="Write about your experience..."
                style={{
                  border: '2px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '0.8rem'
                }}
              />
            </Form.Group>

            <Row className="mt-4">
              <Col>
                <Form.Group controlId="imageUpload">
                  <Form.Label style={{ 
                    color: '#2c3e50',
                    fontWeight: '500',
                    fontSize: '1.1rem'
                  }}>Upload Images</Form.Label>
                  <Form.Control
                    type="file"
                    multiple
                    onChange={handleImageChange}
                    accept="image/*"
                    style={{
                      border: '2px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '0.8rem'
                    }}
                  />
                </Form.Group>
              </Col>

              <Col>
                <Form.Group controlId="videoUpload">
                  <Form.Label style={{ 
                    color: '#2c3e50',
                    fontWeight: '500',
                    fontSize: '1.1rem'
                  }}>Upload Video</Form.Label>
                  <Form.Control
                    type="file"
                    onChange={handleVideoChange}
                    accept="video/*"
                    style={{
                      border: '2px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '0.8rem'
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Button 
              variant="primary" 
              onClick={handlePostSubmit} 
              disabled={isLoading}
              className="mt-4"
              style={{ 
                width: '100%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                padding: '0.8rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                borderRadius: '10px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {isLoading ? "Posting..." : "Post Diary"}
            </Button>
          </Form>

          <div style={{
            background: 'rgba(255, 255, 255, 0.8)',
            padding: '2rem',
            borderRadius: '15px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            marginTop: '2rem'
          }}>
            <h2 className="mt-4" style={{
              color: '#2c3e50',
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
            }}>Recent Travel Diaries</h2>
            <TravelDiariesList />
          </div>
        </div>
      </Container>
    </div>
  );
};

export default TravelDiariesPage;
