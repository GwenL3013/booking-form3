import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Button, Modal, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns'; // Importing date-fns for formatting date
import { useAuth } from '../context/AuthContext';
import './TravelDiariesList.css'; // Importing custom styles

const TravelDiariesList = () => {
  const [diaries, setDiaries] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedDiary, setSelectedDiary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [diaryToDelete, setDiaryToDelete] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchDiaries();
  }, []);

  const fetchDiaries = async () => {
    try {
      const diariesQuery = query(collection(db, 'travelDiaries'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(diariesQuery);
      const diariesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDiaries(diariesData);
    } catch (error) {
      console.error('Error fetching diaries:', error);
    }
  };

  const handleShareToCommunity = async (diary) => {
    setSelectedDiary(diary);
    setShowShareModal(true);
  };

  const handleShareSubmit = async () => {
    if (!selectedDiary) return;

    setLoading(true);
    try {
      // Add to community feed
      await addDoc(collection(db, 'communityFeed'), {
        ...selectedDiary,
        sharedFrom: 'travelDiary',
        likes: [],
        comments: [],
        timestamp: new Date()
      });

      // Update the original diary to mark it as shared
      await updateDoc(doc(db, 'travelDiaries', selectedDiary.id), {
        sharedToCommunity: true
      });

      setShowShareModal(false);
      setSelectedDiary(null);
      fetchDiaries(); // Refresh the list
    } catch (error) {
      console.error('Error sharing to community:', error);
    }
    setLoading(false);
  };

  const handleDiaryClick = (diaryId) => {
    navigate(`/travel-diaries/${diaryId}`, { replace: true });
  };

  const handleDeleteClick = (diary) => {
    setDiaryToDelete(diary);
    setShowDeleteModal(true);
  };

  const handleDeleteSubmit = async () => {
    if (!diaryToDelete) return;

    setLoading(true);
    try {
      // Delete the diary from Firestore
      await deleteDoc(doc(db, 'travelDiaries', diaryToDelete.id));

      setShowDeleteModal(false);
      setDiaryToDelete(null);
      fetchDiaries(); // Refresh the list after deletion
    } catch (error) {
      console.error('Error deleting diary:', error);
    }
    setLoading(false);
  };

  return (
    <Container fluid className="mt-4 px-0 px-sm-3">
      <h2 className="text-center mb-4">My Travel Diaries</h2>

      {/* Blog-like Diary List */}
      <div className="diary-list">
        {diaries.map((diary) => (
          <div
            key={diary.id}
            className="diary-row mb-3"
            style={{
              cursor: 'pointer',
              padding: '12px',
              borderBottom: '1px solid #ddd',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              width: '100%',
              maxWidth: '100%',
              margin: '0 auto'
            }}
            onClick={() => handleDiaryClick(diary.id)}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              width: '100%'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                width: '100%'
              }}>
                <h4 style={{
                  fontSize: '16px',
                  margin: 0,
                  fontWeight: 'bold',
                  wordBreak: 'break-word'
                }}>
                  {diary.title || 'Untitled Diary'}
                </h4>

                <div
                  className="diary-actions"
                  style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}
                >
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShareToCommunity(diary);
                    }}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Share
                  </Button>

                  {user && diary.userId === user.uid && (
                    <>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/travel-diaries/${diary.id}/edit`);
                        }}
                        style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Edit
                      </Button>

                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(diary);
                        }}
                        style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '12px',
                color: '#888'
              }}>
                <span>
                  {format(new Date(diary.timestamp.seconds * 1000), 'MMM dd, yyyy')}
                </span>
                <span style={{
                  wordBreak: 'break-word',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {diary.text}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Share Modal */}
      <Modal show={showShareModal} onHide={() => setShowShareModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Share to Community</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to share this diary to the community feed?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowShareModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleShareSubmit} disabled={loading}>
            {loading ? 'Sharing...' : 'Share'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Diary</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this diary?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteSubmit} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TravelDiariesList;
