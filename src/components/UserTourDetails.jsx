import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase/config';
import Footer from "../components/Footer";
import EnquiryForm from './EnquiryForm';
import { Modal, Tabs, Tab, Spinner, Alert, Container, Row, Col, Carousel, Button, OverlayTrigger, Popover } from 'react-bootstrap';

const UserTourDetails = () => {
    const { id } = useParams(); // short 8-character ID
    const [tour, setTour] = useState(null);
    const [activeTab, setActiveTab] = useState('description');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [previewImage, setPreviewImage] = useState(null); // For lightbox
    const [showEnquiryForm, setShowEnquiryForm] = useState(false);

    useEffect(() => {
        fetchTour();
    }, [id]);

    const fetchTour = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'tourCards'));
            const docData = querySnapshot.docs
                .map(doc => ({ fullId: doc.id, ...doc.data() }))
                .find(t => t.fullId.substring(0, 8) === id);

            if (!docData) {
                throw new Error('Tour not found');
            }
            setTour(docData);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const shareUrl = window.location.href;
    const shareText = `Check out this tour: ${tour?.name}`;

    const handleShare = (platform) => {
        const encodedUrl = encodeURIComponent(shareUrl);
        const encodedText = encodeURIComponent(shareText);
        switch (platform) {
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
                break;
            case 'whatsapp':
                window.open(`https://wa.me/?text=${encodedText}%20${encodedUrl}`, '_blank');
                break;
            case 'email':
                window.location.href = `mailto:?subject=${encodeURIComponent('Tour Recommendation')}&body=${encodedText}%20${encodedUrl}`;
                break;
            case 'instagram':
                navigator.clipboard.writeText(shareUrl);
                alert('Tour link copied! You can now share it on Instagram or anywhere else.');
                break;
            default:
                break;
        }
    };

    if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;
    if (error) return <Alert variant="danger" className="mt-4 text-center">{error}</Alert>;
    if (!tour) return <Alert variant="warning" className="mt-4 text-center">Tour information not available</Alert>;

    return (
        <>
            <div className="mt-4 mb-5 px-3">
                <Container>
                    <h2>{tour.name}</h2>
                </Container>

                {/* Cover images carousel - Full width */}
                <div className="w-100 mb-4 px-0">
                    {tour.coverImages && tour.coverImages.length > 0 ? (
                        <Carousel className="w-100 px-0">
                            {tour.coverImages.map((image, idx) => (
                                <Carousel.Item key={idx}>
                                    <div style={{ height: '50vh', overflow: 'hidden', width: '100%' }}>
                                        <img
                                            className="d-block w-100"
                                            src={image}
                                            alt={`Tour ${idx + 1}`}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    </div>
                                </Carousel.Item>
                            ))}
                        </Carousel>
                    ) : tour.coverImage ?
                        <div className="w-100" style={{ height: '50vh', overflow: 'hidden' }}>
                            <img
                                src={tour.coverImage}
                                alt={tour.name}
                                className="w-100"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />
                        </div>
                        : null}
                </div>

                <Container fluid className="px-0">
                    <Container>
                        <Tabs
                            activeKey={activeTab}
                            onSelect={(k) => setActiveTab(k)}
                            className="mb-4"
                        >
                            <Tab eventKey="description" title="Description">
                                <div className="mb-4">
                                    {tour.details ? (
                                        <p>{tour.details}</p>
                                    ) : (
                                        <p className="text-muted">No description available.</p>
                                    )}
                                </div>
                                {(tour.included?.length > 0 || tour.excluded?.length > 0) && (
                                    <div className="row mb-4" style={{ fontSize: '1.08rem' }}>
                                        <div className="col-md-6 mb-3 mb-md-0">
                                            <h5 className="fw-bold mb-3" style={{ letterSpacing: 0.5 }}>Included</h5>
                                            <ul className="list-unstyled">
                                                {tour.included?.map((item, idx) => (
                                                    <li key={idx} className="d-flex align-items-start mb-2">
                                                        <span className="me-2" style={{ color: '#28a745', fontSize: '1.2em' }}>
                                                            <i className="bi bi-check-circle-fill"></i>
                                                        </span>
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="col-md-6">
                                            <h5 className="fw-bold mb-3" style={{ letterSpacing: 0.5 }}>Excluded</h5>
                                            <ul className="list-unstyled">
                                                {tour.excluded?.map((item, idx) => (
                                                    <li key={idx} className="d-flex align-items-start mb-2">
                                                        <span className="me-2" style={{ color: '#dc3545', fontSize: '1.2em' }}>
                                                            <i className="bi bi-x-circle-fill"></i>
                                                        </span>
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </Tab>

                            <Tab eventKey="itinerary" title="Itinerary">
                                <div className="itinerary-section">
                                    {tour.itinerary && tour.itinerary.length > 0 ? (
                                        tour.itinerary.map((day, idx) => (
                                            <div key={idx} className="border rounded mb-4 p-4">
                                                <h3 className="mb-3">Day {idx + 1}</h3>

                                                {day.routeEn && (
                                                    <div className="mb-2">
                                                        <strong>Route EN: </strong>{day.routeEn}
                                                    </div>
                                                )}

                                                {day.routeCn && (
                                                    <div className="mb-3">
                                                        <strong>Route CN: </strong>{day.routeCn}
                                                    </div>
                                                )}

                                                <div className="row mt-3">
                                                    <div className="col-md-6">
                                                        <h5>Details (EN)</h5>
                                                        {day.detailsEn && day.detailsEn.length > 0 ? (
                                                            <ul>
                                                                {day.detailsEn.map((detail, i) => (
                                                                    <li key={i}>{detail}</li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p className="text-muted">No English details available.</p>
                                                        )}
                                                    </div>

                                                    <div className="col-md-6">
                                                        <h5>Details (CN)</h5>
                                                        {day.detailsCn && day.detailsCn.length > 0 ? (
                                                            <ul>
                                                                {day.detailsCn.map((detail, i) => (
                                                                    <li key={i}>{detail}</li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p className="text-muted">No Chinese details available.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-muted">No itinerary information available.</p>
                                    )}
                                </div>
                            </Tab>

                            <Tab eventKey="gallery" title="Gallery">
                                <div className="gallery-section">
                                    {tour.gallery && tour.gallery.length > 0 ? (
                                        <div className="row g-2 mb-3">
                                            {tour.gallery.map((img, index) => (
                                                <div className="col-6 col-sm-4 col-md-3 mb-2" key={index}>
                                                    <div
                                                        className="position-relative border rounded overflow-hidden"
                                                        style={{
                                                            cursor: 'pointer',
                                                            paddingBottom: '75%', // 4:3 aspect ratio
                                                            position: 'relative'
                                                        }}
                                                        onClick={() => setPreviewImage(img)}
                                                    >
                                                        <img
                                                            src={img}
                                                            alt={`Gallery ${index}`}
                                                            style={{
                                                                position: 'absolute',
                                                                top: 0,
                                                                left: 0,
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'cover',
                                                                transition: 'transform 0.3s ease'
                                                            }}
                                                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted">No gallery images available.</p>
                                    )}
                                </div>
                            </Tab>

                            <Tab eventKey="remarks" title="Remarks">
                                <div className="remarks-section p-3">
                                    {(tour.remarksEn?.length > 0 || tour.remarksCn?.length > 0) ? (
                                        <div className="d-flex gap-4">
                                            {/* English Remarks */}
                                            {tour.remarksEn?.length > 0 && (
                                                <div className="flex-fill">
                                                    <strong></strong>
                                                    <ul className="ps-3">
                                                        {tour.remarksEn.map((remark, index) => (
                                                            <li key={index}>{remark}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Chinese Remarks */}
                                            {tour.remarksCn?.length > 0 && (
                                                <div className="flex-fill">
                                                    <strong></strong>
                                                    <ul className="ps-3">
                                                        {tour.remarksCn.map((remark, index) => (
                                                            <li key={index}>{remark}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-muted">No remarks available for this tour.</p>
                                    )}
                                </div>
                            </Tab>
                        </Tabs>
                    </Container>
                </Container>

                {/* Lightbox Modal */}
                <Modal
                    show={!!previewImage}
                    onHide={() => setPreviewImage(null)}
                    centered
                    size="lg"
                    className="gallery-modal"
                >
                    <Modal.Body className="p-0 position-relative">
                        <img
                            src={previewImage && typeof previewImage === 'object' ? previewImage.url : previewImage || ''}

                            alt="Preview"
                            className="w-100"
                            style={{ objectFit: 'contain', maxHeight: '80vh' }}
                        />

                        {/* Navigation controls */}
                        {tour.gallery && tour.gallery.length > 1 && typeof previewImage === 'object' && (
                            <>
                                <button
                                    className="position-absolute top-50 start-0 translate-middle-y bg-dark bg-opacity-50 text-white border-0 p-2"
                                    style={{
                                        fontSize: '1.5rem',
                                        cursor: 'pointer',
                                        borderRadius: '0 4px 4px 0'
                                    }}
                                    onClick={() => {
                                        const currentIndex = previewImage.index;
                                        const prevIndex = currentIndex === 0 ? tour.gallery.length - 1 : currentIndex - 1;
                                        setPreviewImage({ url: tour.gallery[prevIndex], index: prevIndex });
                                    }}
                                >
                                    &lsaquo;
                                </button>

                                <button
                                    className="position-absolute top-50 end-0 translate-middle-y bg-dark bg-opacity-50 text-white border-0 p-2"
                                    style={{
                                        fontSize: '1.5rem',
                                        cursor: 'pointer',
                                        borderRadius: '4px 0 0 4px'
                                    }}
                                    onClick={() => {
                                        const currentIndex = previewImage.index;
                                        const nextIndex = currentIndex === tour.gallery.length - 1 ? 0 : currentIndex + 1;
                                        setPreviewImage({ url: tour.gallery[nextIndex], index: nextIndex });
                                    }}
                                >
                                    &rsaquo;
                                </button>

                                <div
                                    className="position-absolute bottom-0 start-50 translate-middle-x bg-dark bg-opacity-50 text-white px-3 py-1 mb-2"
                                    style={{ borderRadius: '4px' }}
                                >
                                    {(previewImage?.index ?? 0) + 1} / {tour.gallery.length}
                                </div>

                            </>
                        )}

                        <button
                            className="position-absolute top-0 end-0 bg-dark bg-opacity-50 text-white border-0 p-2"
                            style={{
                                fontSize: '1.5rem',
                                cursor: 'pointer',
                                borderRadius: '0 0 0 4px'
                            }}
                            onClick={() => setPreviewImage(null)}
                        >
                            &times;
                        </button>
                    </Modal.Body>
                </Modal>

                {/* Share and Enquiry buttons */}
                <div className="d-flex justify-content-end gap-3 mb-4">
                    <Button 
                        onClick={() => setShowEnquiryForm(true)}
                        style={{ 
                            background: '#ffed31', 
                            color: '#222', 
                            border: 'none', 
                            fontWeight: 500, 
                            borderRadius: 8, 
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)' 
                        }}
                    >
                        <span style={{ marginRight: 8 }}>
                            <i className="bi bi-envelope-fill"></i>
                        </span>
                        Enquire Now
                    </Button>

                    <OverlayTrigger
                        trigger="click"
                        placement="left"
                        rootClose
                        overlay={
                            <Popover id="share-popover">
                                <Popover.Body>
                                    <Button variant="link" className="d-flex align-items-center w-100 mb-2" onClick={() => handleShare('facebook')}>
                                        <i className="bi bi-facebook me-2" style={{fontSize: '1.2rem', color: '#1877f3'}}></i> Facebook
                                    </Button>
                                    <Button variant="link" className="d-flex align-items-center w-100 mb-2" onClick={() => handleShare('whatsapp')}>
                                        <i className="bi bi-whatsapp me-2" style={{fontSize: '1.2rem', color: '#25d366'}}></i> WhatsApp
                                    </Button>
                                    <Button variant="link" className="d-flex align-items-center w-100 mb-2" onClick={() => handleShare('email')}>
                                        <i className="bi bi-envelope-fill me-2" style={{fontSize: '1.2rem', color: '#ea4335'}}></i> Email
                                    </Button>
                                    <Button variant="link" className="d-flex align-items-center w-100" onClick={() => handleShare('instagram')}>
                                        <i className="bi bi-instagram me-2" style={{fontSize: '1.2rem', color: '#e4405f'}}></i> Instagram (Copy Link)
                                    </Button>
                                </Popover.Body>
                            </Popover>
                        }
                    >
                        <Button style={{ background: '#ffed31', color: '#222', border: 'none', fontWeight: 500, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                            <span style={{ marginRight: 8 }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="#222" strokeWidth="2"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="#222" strokeWidth="2"/></svg>
                            </span>
                            Share this tour
                        </Button>
                    </OverlayTrigger>
                </div>
            </div>
            <Footer />

            {/* Enquiry Form Modal */}
            <EnquiryForm 
                show={showEnquiryForm}
                onHide={() => setShowEnquiryForm(false)}
                tourName={tour?.name}
            />
        </>
    );
};

export default UserTourDetails;