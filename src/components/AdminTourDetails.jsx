import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
    doc,
    getDocs,
    collection,
    updateDoc
} from 'firebase/firestore';
import { db, storage } from '../firebase/config';
import { Modal } from 'react-bootstrap';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Tabs, Tab, Form, Button, Alert, Spinner } from 'react-bootstrap';

const AdminTourDetails = () => {
    const { id } = useParams(); // short 8-character ID
    const location = useLocation();
    const navigate = useNavigate();
    const isAdminRoute = location.pathname.startsWith('/admin/tour/');
    const [tour, setTour] = useState(null);
    const [activeTab, setActiveTab] = useState('itinerary');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [form, setForm] = useState({
        details: '',
        itinerary: [],
        gallery: [],
        remarksEn: [],
        remarksCn: [],
        included: [],
        excluded: [],
    });
    const [previewImage, setPreviewImage] = useState(null); // For lightbox
    const [coverImageUrl, setCoverImageUrl] = useState('');

    const [coverImages, setCoverImages] = useState([]);

    const defaultForm = {
        details: '',
        itinerary: [],
        gallery: [],
        remarks: '',
        included: [],
        excluded: [],
    };

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
            setForm({
                details: docData.details || '',
                ...defaultForm,
                ...docData,
                itinerary: Array.isArray(docData.itinerary) ? docData.itinerary : [],
                gallery: docData.gallery || [],
                remarksEn: docData.remarksEn || [],
                remarksCn: docData.remarksCn || [],
                included: docData.included || [],
                excluded: docData.excluded || [],
            });

            // ✅ Load cover images if present
            setCoverImages(docData.coverImages || []);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!tour?.fullId) return;

        setError('');
        setSuccess('');

        // 🧹 Clean gallery before saving
        const cleanedGallery = form.gallery
            .map(item => (typeof item === 'string' ? item : item.url))
            .filter(Boolean); // Removes null/undefined

        try {
            await updateDoc(doc(db, 'tourCards', tour.fullId), {
                details: form.details,
                itinerary: form.itinerary,
                gallery: cleanedGallery,
                remarksEn: form.remarksEn,
                remarksCn: form.remarksCn,
                coverImages: coverImages,
                included: form.included,
                excluded: form.excluded,
            });

            setSuccess('Details updated successfully!');
        } catch (err) {
            console.error(err);
            setError('Failed to save tour details');
        }
    };

    const addNewDay = () => {
        setForm(prev => ({
            ...prev,
            itinerary: [...prev.itinerary, {
                routeEn: '',
                routeCn: '',
                detailsEn: [],
                detailsCn: []
            }]
        }));
    };

    const removeDay = (index) => {
        setForm(prev => ({
            ...prev,
            itinerary: prev.itinerary.filter((_, i) => i !== index)
        }));
    };

    const updateItineraryField = (dayIdx, field, value) => {
        const updated = [...form.itinerary];
        updated[dayIdx][field] = value;
        setForm({ ...form, itinerary: updated });
    };

    const updateDetail = (dayIdx, type, detailIdx, value) => {
        const updated = [...form.itinerary];
        updated[dayIdx][type][detailIdx] = value;
        setForm({ ...form, itinerary: updated });
    };

    const addDetail = (dayIdx, type) => {
        const updated = [...form.itinerary];
        updated[dayIdx][type].push('');
        setForm({ ...form, itinerary: updated });
    };

    const removeDetail = (dayIdx, type, detailIdx) => {
        const updated = [...form.itinerary];
        updated[dayIdx][type].splice(detailIdx, 1);
        setForm({ ...form, itinerary: updated });
    };

    const handleGalleryUpload = async (e) => {
        const files = Array.from(e.target.files);
        const previews = files.map(file => ({
            file,
            previewUrl: URL.createObjectURL(file),
            status: 'uploading',
            url: null,
        }));

        // Add previews to gallery immediately
        setForm(prev => ({
            ...prev,
            gallery: [...prev.gallery, ...previews],
        }));

        // Start uploads
        for (let i = 0; i < previews.length; i++) {
            const file = previews[i].file;
            try {
                const storageRef = ref(storage, `tours/${tour.fullId}/gallery/${file.name}`);
                const snapshot = await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(snapshot.ref);

                setForm(prev => ({
                    ...prev,
                    gallery: prev.gallery.map(g =>
                        g.previewUrl === previews[i].previewUrl
                            ? { ...g, status: 'done', url: downloadURL }
                            : g
                    ),
                }));
            } catch (err) {
                console.error('Upload failed for', file.name, err);
                setForm(prev => ({
                    ...prev,
                    gallery: prev.gallery.map(g =>
                        g.previewUrl === previews[i].previewUrl
                            ? { ...g, status: 'error' }
                            : g
                    ),
                }));
            }
        }
    };

    const removeGalleryImage = (indexToRemove) => {
        const updated = [...form.gallery];
        updated.splice(indexToRemove, 1);
        setForm(prev => ({
            ...prev,
            gallery: updated,
        }));
    };

    const onDragEnd = (result) => {
        if (!result.destination) return;

        const reordered = Array.from(form.gallery);
        const [moved] = reordered.splice(result.source.index, 1);
        reordered.splice(result.destination.index, 0, moved);

        setForm((prev) => ({
            ...prev,
            gallery: reordered,
        }));
    };

    if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;
    if (error) return <Alert variant="danger" className="mt-4 text-center">{error}</Alert>;

    const handleCoverUpload = async (e) => {
        const files = Array.from(e.target.files);
        const uploadedUrls = [];

        for (let file of files) {
            const storageRef = ref(storage, `tourCovers/${tour.fullId}/${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadUrl = await getDownloadURL(storageRef);
            uploadedUrls.push(downloadUrl);
        }

        setCoverImages(prev => [...prev, ...uploadedUrls]);
    };

    const removeCoverImage = (index) => {
        setCoverImages(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="container mt-4">
            <Button 
                variant="outline-secondary" 
                className="mb-3" 
                onClick={() => navigate('/admin-dashboard')}
            >
                ← Back to Dashboard
            </Button>
            <h3>{isAdminRoute ? `Editing Tour: ${tour?.name}` : tour?.name}</h3>

            {success && <Alert variant="success">{success}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}

            {isAdminRoute && (
                <Form.Group className="mb-4">
                    <Form.Label>Cover Images</Form.Label>
                    <div className="d-flex flex-wrap gap-2 mb-2">
                        {coverImages.map((url, idx) => (
                            <div key={idx} className="position-relative" style={{ width: 120, height: 80 }}>
                                <img
                                    src={url}
                                    alt={`Cover ${idx}`}
                                    className="img-thumbnail"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                <Button
                                    size="sm"
                                    variant="danger"
                                    className="position-absolute top-0 end-0"
                                    onClick={() => removeCoverImage(idx)}
                                >
                                    ×
                                </Button>
                            </div>
                        ))}
                    </div>
                    <Form.Control type="file" multiple onChange={handleCoverUpload} />
                </Form.Group>
            )}

            <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-3"
            >
                <Tab eventKey="description" title="Description">
                    <Form.Group>
                        <Form.Label>Description</Form.Label>
                        {isAdminRoute ? (
                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={form.details}
                                onChange={(e) => setForm({ ...form, details: e.target.value })}
                            />
                        ) : (
                            <div className="border rounded p-3">{tour?.details}</div>
                        )}
                    </Form.Group>
                    <div className="row mt-4">
                        <div className="col-md-6">
                            <h5>Included</h5>
                            {form.included?.map((item, idx) => (
                                <div key={idx} className="d-flex mb-2 align-items-center">
                                    <Form.Control
                                        type="text"
                                        value={item}
                                        onChange={e => {
                                            const updated = [...form.included];
                                            updated[idx] = e.target.value;
                                            setForm({ ...form, included: updated });
                                        }}
                                    />
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        className="ms-2"
                                        onClick={() => {
                                            const updated = [...form.included];
                                            updated.splice(idx, 1);
                                            setForm({ ...form, included: updated });
                                        }}
                                    >×</Button>
                                </div>
                            ))}
                            <Button size="sm" onClick={() => setForm({ ...form, included: [...(form.included || []), ''] })}>
                                + Add Included
                            </Button>
                            <div style={{ height: 16 }}></div>
                        </div>
                        <div className="col-md-6">
                            <h5>Excluded</h5>
                            {form.excluded?.map((item, idx) => (
                                <div key={idx} className="d-flex mb-2 align-items-center">
                                    <Form.Control
                                        type="text"
                                        value={item}
                                        onChange={e => {
                                            const updated = [...form.excluded];
                                            updated[idx] = e.target.value;
                                            setForm({ ...form, excluded: updated });
                                        }}
                                    />
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        className="ms-2"
                                        onClick={() => {
                                            const updated = [...form.excluded];
                                            updated.splice(idx, 1);
                                            setForm({ ...form, excluded: updated });
                                        }}
                                    >×</Button>
                                </div>
                            ))}
                            <Button size="sm" onClick={() => setForm({ ...form, excluded: [...(form.excluded || []), ''] })}>
                                + Add Excluded
                            </Button>
                        </div>
                    </div>
                </Tab>
                <Tab eventKey="itinerary" title="Itinerary">
                    <DragDropContext
                        onDragEnd={(result) => {
                            const { source, destination } = result;
                            if (!destination) return;

                            const updated = Array.from(form.itinerary);
                            const [movedItem] = updated.splice(source.index, 1);
                            updated.splice(destination.index, 0, movedItem);
                            setForm(prev => ({ ...prev, itinerary: updated }));
                        }}
                    >
                        <Droppable droppableId="itinerary-days">
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef}>
                                    {form.itinerary.map((day, idx) => (
                                        <Draggable key={idx} draggableId={`day-${idx}`} index={idx}>
                                            {(provided) => (
                                                <div
                                                    className="mb-4 p-3 border rounded bg-light"
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                >
                                                    <h5>Day {idx + 1}</h5>

                                                    <Form.Group className="mb-2">
                                                        <Form.Label>Route </Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            value={day.routeEn}
                                                            onChange={(e) => updateItineraryField(idx, 'routeEn', e.target.value)}
                                                        />
                                                    </Form.Group>
                                                    <Form.Group className="mb-2">
                                                        <Form.Label></Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            value={day.routeCn}
                                                            onChange={(e) => updateItineraryField(idx, 'routeCn', e.target.value)}
                                                        />
                                                    </Form.Group>

                                                    <Form.Label></Form.Label>
                                                    <div className="d-flex gap-4">
                                                        <div className="flex-fill">
                                                            <strong></strong>
                                                            {day.detailsEn.map((text, i) => (
                                                                <div key={i} className="d-flex mb-1">
                                                                    <Form.Control
                                                                        type="text"
                                                                        value={text}
                                                                        onChange={(e) => updateDetail(idx, 'detailsEn', i, e.target.value)}
                                                                    />
                                                                    <Button
                                                                        variant="danger"
                                                                        size="sm"
                                                                        onClick={() => removeDetail(idx, 'detailsEn', i)}
                                                                    >
                                                                        ×
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                            <Button size="sm" onClick={() => addDetail(idx, 'detailsEn')}>+ Add EN Point</Button>
                                                        </div>

                                                        <div className="flex-fill">
                                                            <strong></strong>
                                                            {day.detailsCn.map((text, i) => (
                                                                <div key={i} className="d-flex mb-1">
                                                                    <Form.Control
                                                                        type="text"
                                                                        value={text}
                                                                        onChange={(e) => updateDetail(idx, 'detailsCn', i, e.target.value)}
                                                                    />
                                                                    <Button
                                                                        variant="danger"
                                                                        size="sm"
                                                                        onClick={() => removeDetail(idx, 'detailsCn', i)}
                                                                    >
                                                                        ×
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                            <Button size="sm" onClick={() => addDetail(idx, 'detailsCn')}>+ Add CN Point</Button>
                                                        </div>
                                                    </div>

                                                    <div className="text-end">
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => removeDay(idx)}
                                                            className="mt-2"
                                                        >
                                                            Remove Day
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>

                    <Button variant="secondary" onClick={addNewDay}>+ Add New Day</Button>

                </Tab>

                <Tab eventKey="gallery" title="Gallery">
                    <Form.Group className="mb-3">
                        <Form.Label>Gallery</Form.Label>

                        {/* Gallery Grid Display */}
                        <div className="row row-cols-3 row-cols-md-4 g-2 mb-3">
                            {form.gallery.map((img, index) => {
                                const isObject = typeof img === 'object';
                                const imageUrl = isObject ? img.previewUrl || img.url : img;
                                const status = isObject ? img.status : 'done';

                                return (
                                    <div className="col" key={index}>
                                        <div className="position-relative h-100">
                                            <img
                                                src={imageUrl}
                                                alt={`Gallery ${index}`}
                                                className="img-thumbnail w-100 h-100"
                                                style={{
                                                    objectFit: 'cover',
                                                    cursor: 'pointer',
                                                    opacity: status === 'uploading' ? 0.6 : 1
                                                }}
                                                onClick={() => setPreviewImage(imageUrl)}
                                            />

                                            {status === 'uploading' && (
                                                <div className="position-absolute top-50 start-50 translate-middle">
                                                    <Spinner size="sm" animation="border" />
                                                </div>
                                            )}

                                            <Button
                                                size="sm"
                                                variant="danger"
                                                className="position-absolute top-0 end-0 m-1"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeGalleryImage(index);
                                                }}
                                            >
                                                ×
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Reordering functionality can be added with react-beautiful-dnd */}
                        <Form.Control type="file" multiple onChange={handleGalleryUpload} />
                    </Form.Group>

                    {/* Image Preview Modal */}
                    {previewImage && (
                        <Modal show onHide={() => setPreviewImage(null)} centered size="lg">
                            <Modal.Body className="text-center p-0">
                                <img src={previewImage} alt="Preview" style={{ width: '100%' }} />
                            </Modal.Body>
                        </Modal>
                    )}
                </Tab>

                <Tab eventKey="remarks" title="Remarks">
                    <div className="d-flex gap-4">
                        {/* English Remarks */}
                        <div className="flex-fill">
                            <strong>EN</strong>
                            {form.remarksEn?.map((text, i) => (
                                <div key={i} className="d-flex mb-1">
                                    <Form.Control
                                        type="text"
                                        value={text}
                                        onChange={(e) => {
                                            const updated = [...form.remarksEn];
                                            updated[i] = e.target.value;
                                            setForm({ ...form, remarksEn: updated });
                                        }}
                                    />
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => {
                                            const updated = [...form.remarksEn];
                                            updated.splice(i, 1);
                                            setForm({ ...form, remarksEn: updated });
                                        }}
                                        className="ms-2"
                                    >
                                        ×
                                    </Button>
                                </div>
                            ))}
                            <Button size="sm" onClick={() => setForm({ ...form, remarksEn: [...(form.remarksEn || []), ''] })}>
                                + Add EN Remark
                            </Button>
                            <div style={{ height: 16 }}></div>
                        </div>

                        {/* Chinese Remarks */}
                        <div className="flex-fill">
                            <strong>CN</strong>
                            {form.remarksCn?.map((text, i) => (
                                <div key={i} className="d-flex mb-1">
                                    <Form.Control
                                        type="text"
                                        value={text}
                                        onChange={(e) => {
                                            const updated = [...form.remarksCn];
                                            updated[i] = e.target.value;
                                            setForm({ ...form, remarksCn: updated });
                                        }}
                                    />
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => {
                                            const updated = [...form.remarksCn];
                                            updated.splice(i, 1);
                                            setForm({ ...form, remarksCn: updated });
                                        }}
                                        className="ms-2"
                                    >
                                        ×
                                    </Button>
                                </div>
                            ))}
                            <Button size="sm" onClick={() => setForm({ ...form, remarksCn: [...(form.remarksCn || []), ''] })}>
                                + Add CN Remark
                            </Button>
                        </div>
                    </div>
                </Tab>

            </Tabs>

            {isAdminRoute && (
                <Button variant="primary" onClick={handleSave}>Save Changes</Button>
            )}

            <Modal show={!!previewImage} onHide={() => setPreviewImage(null)} centered size="lg">
                <Modal.Body className="p-0">
                    <img
                        src={previewImage}
                        alt="Preview"
                        className="w-100"
                        style={{ objectFit: 'contain', maxHeight: '80vh' }}
                    />
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default AdminTourDetails; 