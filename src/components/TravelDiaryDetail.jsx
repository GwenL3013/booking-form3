import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Button, Form, Modal } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaArrowLeft } from 'react-icons/fa';

const TravelDiaryDetail = () => {
  const { diaryId } = useParams();
  const [diary, setDiary] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (diaryId) {
      fetchDiary();
    }
  }, [diaryId]);

  const fetchDiary = async () => {
    try {
      const diaryRef = doc(db, 'travelDiaries', diaryId);
      const diaryDoc = await getDoc(diaryRef);
      if (diaryDoc.exists()) {
        setDiary({ id: diaryDoc.id, ...diaryDoc.data() });
        setEditedText(diaryDoc.data().text);
      } else {
        console.error('Diary not found');
        navigate('/travel-diaries');
      }
    } catch (error) {
      console.error('Error fetching diary:', error);
      navigate('/travel-diaries');
    }
  };

  const handleEdit = async () => {
    if (!editedText.trim()) return;

    setLoading(true);
    try {
      const diaryRef = doc(db, 'travelDiaries', diaryId);
      await updateDoc(diaryRef, {
        text: editedText,
        timestamp: new Date()
      });
      setIsEditing(false);
      fetchDiary();
    } catch (error) {
      console.error('Error updating diary:', error);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const diaryRef = doc(db, 'travelDiaries', diaryId);
      await deleteDoc(diaryRef);
      navigate('/travel-diaries');
    } catch (error) {
      console.error('Error deleting diary:', error);
    }
    setLoading(false);
  };

  if (!diary) return <div>Loading...</div>;

  const isCreator = user && diary.userId === user.uid;

  return (
    <div className="container mt-4">
      <Button
        variant="outline-secondary"
        onClick={() => navigate('/user-dashboard', { state: { tab: 'diaries' } })}
        className="mb-4"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <FaArrowLeft />
        Back to My Diaries
      </Button>

      <article className="diary-detail" style={{ 
        padding: '2rem',
        borderRadius: '12px'
      }}>
        <div className="media-thumbnails mb-4" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '15px',
          maxWidth: '100%'
        }}>
          {diary.imageUrls && diary.imageUrls.map((imageUrl, index) => (
            <div 
              key={index}
              className="media-thumbnail" 
              onClick={() => {
                setSelectedMedia({ type: 'image', url: imageUrl });
                setShowMediaModal(true);
              }}
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '8px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.4)',
                transition: 'transform 0.2s ease-in-out'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <img 
                src={imageUrl} 
                alt={`Diary image ${index + 1}`} 
                className="img-fluid thumbnail" 
                style={{ 
                  width: '100%', 
                  height: '250px', 
                  objectFit: 'cover',
                  cursor: 'pointer',
                  borderRadius: '8px'
                }} 
              />
            </div>
          ))}
          {diary.videoUrl && (
            <div 
              className="media-thumbnail" 
              onClick={() => {
                setSelectedMedia({ type: 'video', url: diary.videoUrl });
                setShowMediaModal(true);
              }}
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '8px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.4)',
                transition: 'transform 0.2s ease-in-out'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <video 
                className="thumbnail" 
                style={{ 
                  width: '100%', 
                  height: '250px', 
                  objectFit: 'cover',
                  cursor: 'pointer',
                  borderRadius: '8px'
                }}
              >
                <source src={diary.videoUrl} type="video/mp4" />
              </video>
              <div className="play-icon" style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'white',
                fontSize: '3rem',
                textShadow: '0 0 10px rgba(0,0,0,0.5)',
                pointerEvents: 'none'
              }}>
                ▶
              </div>
            </div>
          )}
        </div>
        
        {isEditing ? (
          <Form.Group className="mb-4">
            <Form.Control
              as="textarea"
              rows={8}
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="mb-3"
            />
            <div className="d-flex gap-2">
              <Button
                variant="primary"
                onClick={handleEdit}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </Form.Group>
        ) : (
          <>
            <div className="diary-content mb-4">
              <p className="lead">{diary.text}</p>
            </div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              {isCreator && (
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-primary"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline-danger"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    Delete
                  </Button>
                </div>
              )}
              <small>
                {new Date(diary.timestamp?.toDate()).toLocaleString()}
              </small>
            </div>
          </>
        )}

        {/* Delete Confirmation Modal */}
        {isCreator && (
          <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Delete Diary</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>Are you sure you want to delete this diary? This action cannot be undone.</p>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete} disabled={loading}>
                {loading ? 'Deleting...' : 'Delete'}
              </Button>
            </Modal.Footer>
          </Modal>
        )}

        {/* Media Modal */}
        <Modal 
          show={showMediaModal} 
          onHide={() => setShowMediaModal(false)}
          size="lg"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Media Preview</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedMedia?.type === 'image' ? (
              <img 
                src={selectedMedia.url} 
                alt="Full size" 
                className="img-fluid" 
                style={{ width: '100%' }} 
              />
            ) : (
              <video 
                controls 
                className="w-100"
                style={{ maxHeight: '80vh' }}
              >
                <source src={selectedMedia?.url} type="video/mp4" />
              </video>
            )}
          </Modal.Body>
        </Modal>
      </article>
    </div>
  );
};

export default TravelDiaryDetail; 