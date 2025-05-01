import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Image, Modal } from 'react-bootstrap';
import { Heart, ChatDots, Send } from 'react-bootstrap-icons';
import defaultAvatar from '../assets/default-avatar.png';
import './CommunityFeed.css';
import { FaHome, FaSearch, FaVideo, FaUser, FaEdit, FaTrash } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, addDoc, getDocs, doc, updateDoc, arrayUnion, deleteDoc, increment, query, where, getDoc, setDoc, arrayRemove } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-toastify';

const CommunityFeed = () => {
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState('');
    const [commentInputs, setCommentInputs] = useState({});
    const [loading, setLoading] = useState(true);
    const [postMedia, setPostMedia] = useState([]);
    const [postMediaPreviews, setPostMediaPreviews] = useState([]);
    const [showPostModal, setShowPostModal] = useState(false);
    const [activeTab, setActiveTab] = useState('home'); // 'home', 'video', 'profile'
    const [activeMediaIndex, setActiveMediaIndex] = useState({});
    const [showPostDetailModal, setShowPostDetailModal] = useState(false);
    const [activePostDetail, setActivePostDetail] = useState(null);
    const [editingUsername, setEditingUsername] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [userProfile, setUserProfile] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchModal, setShowSearchModal] = useState(false);
    const { user } = useAuth();
    const currentUserName = user?.displayName || user?.email || 'User';
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editPost, setEditPost] = useState(null);
    const [editText, setEditText] = useState('');
    const [editMedia, setEditMedia] = useState([]);
    const [editMediaPreviews, setEditMediaPreviews] = useState([]);
    const [editMediaTypes, setEditMediaTypes] = useState([]);
    const [editMediaToDelete, setEditMediaToDelete] = useState([]);
    const [editingComment, setEditingComment] = useState(null);
    const [editCommentText, setEditCommentText] = useState('');
    const [openCommentPostId, setOpenCommentPostId] = useState(null);
    const [replyInputs, setReplyInputs] = useState({});
    const [openReplyCommentId, setOpenReplyCommentId] = useState(null);
    const [showCommentsModal, setShowCommentsModal] = useState(false);
    const [activeCommentPost, setActiveCommentPost] = useState(null);
    const storage = getStorage();
    const [userProfiles, setUserProfiles] = useState({});
    const [replyToComment, setReplyToComment] = useState(null);
    const [replyText, setReplyText] = useState('');

    // Add gradient colors array
    const gradientColors = [
        'linear-gradient(45deg, #ff9a9e, #fad0c4)',
        'linear-gradient(45deg, #a1c4fd, #c2e9fb)',
        'linear-gradient(45deg, #84fab0, #8fd3f4)',
        'linear-gradient(45deg, #fccb90, #d57eeb)',
        'linear-gradient(45deg, #e0c3fc, #8ec5fc)',
        'linear-gradient(45deg, #f093fb, #f5576c)',
        'linear-gradient(45deg, #43e97b, #38f9d7)',
        'linear-gradient(45deg, #fa709a, #fee140)',
        'linear-gradient(45deg, #667eea, #764ba2)',
        'linear-gradient(45deg, #f6d365, #fda085)'
    ];

    // Function to get random gradient
    const getRandomGradient = (postId) => {
        // Use postId to generate a consistent gradient for the same post
        const index = postId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradientColors.length;
        return gradientColors[index];
    };

    useEffect(() => {
        const initializeUser = async () => {
            if (!user) return;

            try {
                const userRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userRef);

                if (!userDoc.exists()) {
                    // Create user document if it doesn't exist
                    await setDoc(userRef, {
                        displayName: user?.displayName || 'User',
                        email: user.email,
                        createdAt: new Date().toISOString()
                    });
                }
            } catch (error) {
                console.error('Error initializing user:', error);
            }
        };

        initializeUser();
    }, [user]);

    useEffect(() => {
        const fetchUserProfiles = async (postsList) => {
            const uniqueUserIds = Array.from(new Set(postsList.map(post => post.userId)));
            const profiles = {};
            for (const uid of uniqueUserIds) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', uid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        profiles[uid] = {
                            displayName: data.displayName || 'User',
                            photoURL: data.photoURL || null
                        };
                    } else {
                        profiles[uid] = {
                            displayName: 'User',
                            photoURL: null
                        };
                    }
                } catch {
                    profiles[uid] = {
                        displayName: 'User',
                        photoURL: null
                    };
                }
            }
            setUserProfiles(profiles);
        };

        const fetchPosts = async () => {
            if (!user) {
                console.log('No authenticated user found in CommunityFeed');
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const postsRef = collection(db, 'communityFeed');
                const querySnapshot = await getDocs(postsRef);
                
                const uniquePostIds = new Set();
                
                const postsList = querySnapshot.docs
                    .map(doc => {
                        const data = doc.data();
                        if (uniquePostIds.has(doc.id)) {
                            return null;
                        }
                        uniquePostIds.add(doc.id);
                        
                        return {
                            id: doc.id,
                            ...data,
                            media: Array.isArray(data.media) ? data.media : [],
                            mediaTypes: Array.isArray(data.mediaTypes) ? data.mediaTypes : [],
                            likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
                            likedByUser: Array.isArray(data.likedBy) ? data.likedBy.includes(user.uid) : false,
                            likes: Array.isArray(data.likedBy) ? data.likedBy.length : 0
                        };
                    })
                    .filter(post => post !== null);
                
                const sortedPosts = postsList.sort((a, b) => 
                    new Date(b.timestamp) - new Date(a.timestamp)
                );
                
                setPosts(sortedPosts);
                fetchUserProfiles(sortedPosts);
            } catch (error) {
                console.error('Error fetching posts:', error);
            } finally {
                setLoading(false);
            }
        };

        // Clear existing posts before fetching new ones
        setPosts([]);
        fetchPosts();
    }, [user]);

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!user) return;

            try {
                const userRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userRef);

                if (userDoc.exists()) {
                    setUserProfile(userDoc.data());
                }
            } catch (error) {
                console.error('Error fetching user profile:', error);
            }
        };

        fetchUserProfile();
    }, [user]);

    const handlePostMediaUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const newMedia = [...postMedia];
            const newPreviews = [...postMediaPreviews];
            
            for (const file of files) {
                const previewUrl = URL.createObjectURL(file);
                newMedia.push(file);
                newPreviews.push({
                    url: previewUrl,
                    type: file.type
                });
            }
            
            setPostMedia(newMedia);
            setPostMediaPreviews(newPreviews);
        }
    };

    const handlePost = async (e) => {
        e.preventDefault();
        if (!newPost.trim() && postMedia.length === 0) return;

        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const displayName = userDoc.data()?.displayName || user?.displayName || 'User';

            const mediaUrls = [];
            const mediaTypes = [];

            for (const file of postMedia) {
                const storageRef = ref(storage, `community-feed/${user.uid}/${Date.now()}-${file.name}`);
                const snapshot = await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(snapshot.ref);
                mediaUrls.push(downloadURL);
                mediaTypes.push(file.type);
            }

            const newPostObject = {
                userId: user?.uid,
                user: displayName,
                avatar: user?.photoURL || defaultAvatar,
                content: newPost,
                media: mediaUrls,
                mediaTypes: mediaTypes,
                timestamp: new Date().toISOString(),
                likedBy: [],
                comments: [],
                commentCount: 0
            };

            const docRef = await addDoc(collection(db, 'communityFeed'), newPostObject);
            setPosts([{ id: docRef.id, ...newPostObject, likes: 0, likedByUser: false }, ...posts]);
            
            setNewPost('');
            setPostMedia([]);
            setPostMediaPreviews([]);
            setShowPostModal(false);
        } catch (err) {
            console.error('Error saving feed to Firestore:', err);
        }
    };

    const handleLike = async (id) => {
        if (!user) return;

        try {
            const postRef = doc(db, 'communityFeed', id);
            const post = posts.find(p => p.id === id);
            
            // Update Firestore
            await updateDoc(postRef, {
                likedBy: post.likedByUser 
                    ? arrayRemove(user.uid)  // Remove user's ID if already liked
                    : arrayUnion(user.uid)   // Add user's ID if not liked
            });

            // Update local state
            setPosts(posts.map(post => {
                if (post.id === id) {
                    const newLikedByUser = !post.likedByUser;
                    const newLikes = newLikedByUser ? post.likes + 1 : post.likes - 1;
                    return {
                        ...post,
                        likedByUser: newLikedByUser,
                        likes: newLikes,
                        likedBy: newLikedByUser 
                            ? [...(post.likedBy || []), user.uid]
                            : (post.likedBy || []).filter(uid => uid !== user.uid)
                    };
                }
                return post;
            }));
        } catch (error) {
            console.error('Error updating likes:', error);
            toast.error('Failed to update like status');
        }
    };

    const handleCommentChange = (id, value) => {
        setCommentInputs({ ...commentInputs, [id]: value });
    };

    const handleComment = async (postId) => {
        const comment = commentInputs[postId];
        if (!comment || !comment.trim()) return;

        try {
            // Get user's username from Firestore
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const username = userDoc.data()?.displayName || user?.displayName || 'User';

            const newComment = {
                id: Date.now(),
                userId: user?.uid,
                user: username,
                avatar: user?.photoURL || defaultAvatar,
                text: comment,
                timestamp: new Date().toISOString()
            };

            // Update the post in Firestore to add the new comment
            const postRef = doc(db, 'communityFeed', postId);
            await updateDoc(postRef, {
                comments: arrayUnion(newComment),
                commentCount: increment(1)
            });

            // Update local state
            setPosts(posts.map(post => {
                if (post.id === postId) {
                    return {
                        ...post,
                        comments: [...(post.comments || []), newComment],
                        commentCount: (post.commentCount || 0) + 1
                    };
                }
                return post;
            }));

            // Update active comment post if it's the same post
            if (activeCommentPost && activeCommentPost.id === postId) {
                setActiveCommentPost(prev => ({
                    ...prev,
                    comments: [...(prev.comments || []), newComment],
                    commentCount: (prev.commentCount || 0) + 1
                }));
            }

            setCommentInputs({ ...commentInputs, [postId]: '' });
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    // Filter posts based on activeTab and search query
    let filteredPosts = posts;
    if (activeTab === 'video') {
        filteredPosts = posts.filter(post => post.mediaType && post.mediaType.startsWith('video'));
    } else if (activeTab === 'profile') {
        filteredPosts = posts.filter(post => post.user === currentUserName);
    }

    // Apply search filter if there's a search query
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredPosts = filteredPosts.filter(post => 
            post.user.toLowerCase().includes(query) || 
            post.content.toLowerCase().includes(query)
        );
    }

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    // Edit handlers
    const openEditModal = (post) => {
        setEditPost(post);
        setEditText(post.content);
        setEditMedia([]);
        setEditMediaPreviews(post.media.map((url, index) => ({
            url,
            type: post.mediaTypes[index]
        })));
        setEditMediaTypes(post.mediaTypes);
        setEditMediaToDelete([]);
        setEditModalOpen(true);
    };

    const handleEditMediaUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const newMedia = [...editMedia];
            const newPreviews = [...editMediaPreviews];
            const newTypes = [...editMediaTypes];
            
            for (const file of files) {
                const previewUrl = URL.createObjectURL(file);
                newMedia.push(file);
                newPreviews.push({
                    url: previewUrl,
                    type: file.type
                });
                newTypes.push(file.type);
            }
            
            setEditMedia(newMedia);
            setEditMediaPreviews(newPreviews);
            setEditMediaTypes(newTypes);
        }
    };

    const handleDeleteEditMedia = (index) => {
        const preview = editMediaPreviews[index];
        if (preview.url.startsWith('blob:')) {
            // If it's a new upload, remove it from the arrays
            setEditMedia(prev => prev.filter((_, i) => i !== index));
            setEditMediaPreviews(prev => prev.filter((_, i) => i !== index));
            setEditMediaTypes(prev => prev.filter((_, i) => i !== index));
        } else {
            // If it's an existing media, mark it for deletion
            setEditMediaToDelete(prev => [...prev, preview.url]);
            setEditMediaPreviews(prev => prev.filter((_, i) => i !== index));
            setEditMediaTypes(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleEditSave = async (e) => {
        e.preventDefault();
        if (!editPost) return;

        try {
            // Upload new media files
            const newMediaUrls = [];
            const newMediaTypes = [];

            for (const file of editMedia) {
                const storageRef = ref(storage, `community-feed/${user.uid}/${Date.now()}-${file.name}`);
                const snapshot = await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(snapshot.ref);
                newMediaUrls.push(downloadURL);
                newMediaTypes.push(file.type);
            }

            // Combine existing media (excluding deleted ones) with new media
            const existingMedia = editPost.media.filter(url => !editMediaToDelete.includes(url));
            const existingTypes = editPost.mediaTypes.filter((_, index) => !editMediaToDelete.includes(editPost.media[index]));

            const updatedMedia = [...existingMedia, ...newMediaUrls];
            const updatedMediaTypes = [...existingTypes, ...newMediaTypes];

            // Update the post in Firestore
            const postRef = doc(db, 'communityFeed', editPost.id);
            await updateDoc(postRef, {
                content: editText,
                media: updatedMedia,
                mediaTypes: updatedMediaTypes
            });

            // Update local state
            setPosts(posts.map(post => 
                post.id === editPost.id
                    ? {
                        ...post,
                        content: editText,
                        media: updatedMedia,
                        mediaTypes: updatedMediaTypes
                    }
                    : post
            ));

            setEditModalOpen(false);
            setEditPost(null);
            setEditText('');
            setEditMedia([]);
            setEditMediaPreviews([]);
            setEditMediaTypes([]);
            setEditMediaToDelete([]);
        } catch (error) {
            console.error('Error updating post:', error);
        }
    };

    const handleDelete = async (postId) => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            try {
                // Delete from Firestore
                await deleteDoc(doc(db, 'communityFeed', postId));
                
                // Update local state
                setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
            } catch (error) {
                console.error('Error deleting post:', error);
            }
        }
    };

    // Add reply handler
    const handleReply = async (postId, commentId) => {
        if (!replyText.trim()) return;

        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const username = userDoc.data()?.displayName || user?.displayName || 'User';

            const newReply = {
                id: Date.now(),
                userId: user?.uid,
                user: username,
                avatar: user?.photoURL || defaultAvatar,
                text: replyText,
                timestamp: new Date().toISOString()
            };

            const postRef = doc(db, 'communityFeed', postId);
            const post = posts.find(p => p.id === postId);
            
            if (!post) return;

            const updatedComments = post.comments.map(comment => 
                        comment.id === commentId
                            ? {
                                ...comment,
                        replies: [...(comment.replies || []), newReply]
                            }
                            : comment
            );

            await updateDoc(postRef, {
                comments: updatedComments
            });

            // Update local state
            setPosts(posts.map(post => 
                post.id === postId
                    ? { ...post, comments: updatedComments }
                    : post
            ));

            // Update active post detail if it's the same post
            if (activePostDetail && activePostDetail.id === postId) {
                setActivePostDetail(prev => ({
                    ...prev,
                    comments: updatedComments
                }));
            }

            setReplyText('');
            setReplyToComment(null);
        } catch (error) {
            console.error('Error adding reply:', error);
        }
    };

    const handleMediaNavigation = (postId, direction) => {
        const post = posts.find(p => p.id === postId);
        if (!post || !post.media || post.media.length <= 1) return;

        const currentIndex = activeMediaIndex[postId] || 0;
        let newIndex;

        if (direction === 'next') {
            newIndex = (currentIndex + 1) % post.media.length;
        } else {
            newIndex = (currentIndex - 1 + post.media.length) % post.media.length;
        }

        setActiveMediaIndex(prev => ({
            ...prev,
            [postId]: newIndex
        }));
    };

    const handlePostDetailClick = (post) => {
        setActivePostDetail(post);
        setShowPostDetailModal(true);
    };

    const handleClosePostDetail = () => {
        setShowPostDetailModal(false);
        setActivePostDetail(null);
    };

    const handleEditComment = async (postId, commentId, newText) => {
        try {
            const postRef = doc(db, 'communityFeed', postId);
            const post = posts.find(p => p.id === postId);
            
            if (!post) return;

            const updatedComments = post.comments.map(comment => 
                comment.id === commentId
                    ? { ...comment, text: newText }
                    : comment
            );

            await updateDoc(postRef, {
                comments: updatedComments
            });

            // Update local state
            setPosts(posts.map(post => 
                post.id === postId
                    ? { ...post, comments: updatedComments }
                    : post
            ));

            // Update active post detail if it's the same post
            if (activePostDetail && activePostDetail.id === postId) {
                setActivePostDetail(prev => ({
                    ...prev,
                    comments: updatedComments
                }));
            }

            setEditingComment(null);
            setEditCommentText('');
        } catch (error) {
            console.error('Error updating comment:', error);
        }
    };

    const handleDeleteComment = async (postId, commentId) => {
        if (window.confirm('Are you sure you want to delete this comment?')) {
            try {
                const postRef = doc(db, 'communityFeed', postId);
                const post = posts.find(p => p.id === postId);
                
                if (!post) return;

                const updatedComments = post.comments.filter(comment => comment.id !== commentId);

                await updateDoc(postRef, {
                    comments: updatedComments,
                    commentCount: increment(-1)
                });

                // Update local state
                setPosts(posts.map(post => 
                    post.id === postId
                        ? { 
                            ...post, 
                            comments: updatedComments,
                            commentCount: post.commentCount - 1
                        }
                        : post
                ));

                // Update active post detail if it's the same post
                if (activePostDetail && activePostDetail.id === postId) {
                    setActivePostDetail(prev => ({
                        ...prev,
                        comments: updatedComments,
                        commentCount: prev.commentCount - 1
                    }));
                }
            } catch (error) {
                console.error('Error deleting comment:', error);
            }
        }
    };

    const handleUpdateUsername = async () => {
        if (!newUsername.trim()) return;
        
        try {
            // Update user profile in Firestore
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                displayName: newUsername.trim()
            });

            // Update all posts by this user
            const postsRef = collection(db, 'communityFeed');
            const postsQuery = query(postsRef, where('userId', '==', user.uid));
            const postsSnapshot = await getDocs(postsQuery);
            
            const updatePromises = postsSnapshot.docs.map(doc => 
                updateDoc(doc.ref, { user: newUsername.trim() })
            );
            await Promise.all(updatePromises);

            // Update local state
            setPosts(posts.map(post => 
                post.userId === user.uid
                    ? { ...post, user: newUsername.trim() }
                    : post
            ));

            setEditingUsername(false);
        } catch (error) {
            console.error('Error updating username:', error);
        }
    };

    const handleHomeClick = () => {
        setActiveTab('home');
        setSearchQuery(''); // Clear search query when clicking home
    };

    const handleSearchResultClick = (post) => {
        setActivePostDetail(post);
        setShowPostDetailModal(true);
        setShowSearchModal(false);
    };

    return (
        <Container fluid className="p-0">
            <Container className="my-3">
                {/* Cover image placeholder (add your cover image here if needed) */}
                {/* <img src={CommunityFeedImg} alt="Community Feed Cover" style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '18px' }} /> */}

                {/* Responsive Navbar */}
                <nav className="community-navbar">
                    <button 
                        className={`nav-btn${activeTab === 'home' ? ' active' : ''}`} 
                        onClick={handleHomeClick}
                    >
                        <FaHome size={22} />
                    </button>
                    <button className="nav-btn" onClick={() => setShowSearchModal(true)}><FaSearch size={22} /></button>
                    <button className={`nav-btn${activeTab === 'video' ? ' active' : ''}`} onClick={() => setActiveTab('video')}><FaVideo size={22} /></button>
                    <button className={`nav-btn${activeTab === 'profile' ? ' active' : ''}`} onClick={() => setActiveTab('profile')}><FaUser size={22} /></button>
                </nav>

                {/* Search Modal */}
                <Modal
                    show={showSearchModal}
                    onHide={() => {
                        setShowSearchModal(false);
                    }}
                    centered
                    className="search-modal"
                >
                    <Modal.Body className="p-4">
                        <div className="search-container">
                            <input
                                type="text"
                                placeholder="Search users, trips, or content..."
                                value={searchQuery}
                                onChange={handleSearch}
                                className="search-input"
                                autoFocus
                            />
                            <FaSearch className="search-icon" />
                        </div>
                        {searchQuery.trim() && (
                            <div className="search-results mt-3">
                                {filteredPosts.length > 0 ? (
                                    filteredPosts.map(post => (
                                        <div 
                                            key={post.id} 
                                            className="search-result-item"
                                            onClick={() => handleSearchResultClick(post)}
                                        >
                                            <div className="d-flex align-items-center">
                                                <img 
                                                    src={userProfiles[post.userId]?.photoURL || post.avatar} 
                                                    alt="" 
                                                    className="search-result-avatar" 
                                                />
                                                <div className="ms-2">
                                                    <div className="search-result-username">
                                                        {userProfiles[post.userId]?.displayName || post.user || 'User'}
                                                    </div>
                                                    <div className="search-result-content">
                                                        {post.content.length > 50 ? post.content.substring(0, 50) + '...' : post.content}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-muted py-3">
                                        No results found
                                    </div>
                                )}
                            </div>
                        )}
                    </Modal.Body>
                </Modal>

                <Row>
                    <Col>
                        {/* Add Feed Button */}
                        <div className="d-flex justify-content-end mb-3">
                            <Button variant="primary" onClick={() => setShowPostModal(true)}>
                                + Add Feed
                            </Button>
                        </div>

                        {/* Loading state */}
                        {loading && (
                            <div className="text-center my-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="mt-2">Loading posts...</p>
                            </div>
                        )}

                        {/* Xiaohongshu-style grid */}
                        {!loading && (
                            <div className="xiaohongshu-grid">
                                {filteredPosts.map(post => (
                                    <div 
                                        className="xiaohongshu-card" 
                                        key={post.id} 
                                        style={{ position: 'relative', cursor: 'pointer' }}
                                        onClick={(e) => {
                                            // Don't trigger if clicking on edit/delete buttons or media navigation
                                            if (!e.target.closest('.edit-delete-buttons') && 
                                                !e.target.closest('.xiaohongshu-media-slide') &&
                                                !e.target.closest('.xiaohongshu-card-stats')) {
                                                handlePostDetailClick(post);
                                            }
                                        }}
                                    >
                                        {/* Edit/Delete icons for own posts */}
                                        {post.userId === user?.uid && activeTab === 'profile' && (
                                            <div className="edit-delete-buttons" style={{ position: 'absolute', top: 8, right: 8, zIndex: 2, display: 'flex', gap: 8 }}>
                                                <FaEdit
                                                    style={{ cursor: 'pointer', color: '#1976d2', background: '#fff', borderRadius: '50%', padding: 4 }}
                                                    size={20}
                                                    title="Edit"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEditModal(post);
                                                    }}
                                                />
                                                <FaTrash
                                                    style={{ cursor: 'pointer', color: '#d32f2f', background: '#fff', borderRadius: '50%', padding: 4 }}
                                                    size={20}
                                                    title="Delete"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(post.id);
                                                    }}
                                                />
                                            </div>
                                        )}
                                        <div className="xiaohongshu-card-media">
                                            {post.media && post.media.length > 0 ? (
                                                <div 
                                                    className="xiaohongshu-media-slide"
                                                    onClick={(e) => {
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        const x = e.clientX - rect.left;
                                                        const width = rect.width;
                                                        if (x < width * 0.3) {
                                                            handleMediaNavigation(post.id, 'prev');
                                                        } else if (x > width * 0.7) {
                                                            handleMediaNavigation(post.id, 'next');
                                                        }
                                                    }}
                                                >
                                                    {post.media.map((mediaUrl, index) => (
                                                        <div 
                                                            key={index} 
                                                            className={`xiaohongshu-media-item ${index === (activeMediaIndex[post.id] || 0) ? 'active' : ''}`}
                                                            style={{ display: index === (activeMediaIndex[post.id] || 0) ? 'block' : 'none' }}
                                                        >
                                                            {post.mediaTypes[index]?.startsWith('video') ? (
                                                                <video src={mediaUrl} className="xiaohongshu-media" />
                                                            ) : (
                                                                <img src={mediaUrl} alt="" className="xiaohongshu-media" />
                                                            )}
                                                        </div>
                                                    ))}
                                                    {post.media.length > 1 && (
                                                        <div className="xiaohongshu-media-indicators">
                                                            {post.media.map((_, index) => (
                                                                <span 
                                                                    key={index} 
                                                                    className={`xiaohongshu-media-indicator ${index === (activeMediaIndex[post.id] || 0) ? 'active' : ''}`}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setActiveMediaIndex(prev => ({
                                                                            ...prev,
                                                                            [post.id]: index
                                                                        }));
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div 
                                                    className="xiaohongshu-placeholder-media"
                                                    style={{ background: getRandomGradient(post.id) }}
                                                >
                                                    <div className="placeholder-text">
                                                        {post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="xiaohongshu-card-content">
                                            <p className="xiaohongshu-card-text">{post.content}</p>
                                            <div className="xiaohongshu-card-user">
                                                <img src={userProfiles[post.userId]?.photoURL || post.avatar} alt="" className="xiaohongshu-avatar" />
                                                <span className="xiaohongshu-username">{userProfiles[post.userId]?.displayName || post.user || 'User'}</span>
                                            </div>
                                            <div className="xiaohongshu-card-stats">
                                                <span className="xiaohongshu-stat">
                                                    <Heart 
                                                        size={16} 
                                                        className={post.likedByUser ? "text-danger" : ""} 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleLike(post.id);
                                                        }}
                                                    /> 
                                                    {post.likes}
                                                </span>
                                                <span
                                                    className="xiaohongshu-stat"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveCommentPost(post);
                                                        setShowCommentsModal(true);
                                                    }}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <ChatDots size={16} /> {post.comments.length}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Col>
                </Row>
            </Container>
            {/* Edit Post Modal */}
            <Modal show={editModalOpen} onHide={() => setEditModalOpen(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Post</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleEditSave}>
                        <Form.Group className="mb-3">
                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={editText}
                                onChange={e => setEditText(e.target.value)}
                                autoFocus
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Media</Form.Label>
                            <div className="d-flex flex-wrap gap-2 mb-2">
                                {editMediaPreviews.map((preview, index) => (
                                    <div key={index} className="position-relative" style={{ width: '100px', height: '100px' }}>
                                        {preview.type.startsWith('video') ? (
                                            <video 
                                                src={preview.url} 
                                                className="w-100 h-100 object-fit-cover rounded"
                                                style={{ borderRadius: '10px' }}
                                            />
                                        ) : (
                                            <img 
                                                src={preview.url} 
                                                alt={`Preview ${index + 1}`}
                                                className="w-100 h-100 object-fit-cover rounded"
                                                style={{ borderRadius: '10px' }}
                                            />
                                        )}
                                        <button
                                            type="button"
                                            className="btn btn-danger btn-sm position-absolute top-0 end-0 m-1"
                                            onClick={() => handleDeleteEditMedia(index)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <Form.Control
                                type="file"
                                accept="image/*,video/*"
                                onChange={handleEditMediaUpload}
                                multiple
                            />
                            <small className="text-muted">You can select multiple files</small>
                        </Form.Group>
                        <div className="d-flex justify-content-end">
                            <Button variant="secondary" onClick={() => setEditModalOpen(false)} className="me-2">
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit" disabled={!editText.trim() && editMediaPreviews.length === 0}>
                                Save
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
            <Modal
                show={showCommentsModal}
                onHide={() => setShowCommentsModal(false)}
                dialogClassName="bottom-sheet-modal"
                contentClassName="bottom-sheet-content"
                backdropClassName="bottom-sheet-backdrop"
            >
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="text-center w-100">Comments</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0">
                    {activeCommentPost && (
                        <>
                            {/* List comments */}
                            <div className="comments-list" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '16px' }}>
                                {(!activeCommentPost.comments || activeCommentPost.comments.length === 0) && (
                                    <div className="text-center text-muted py-4">No comments yet.</div>
                                )}
                                {activeCommentPost.comments && activeCommentPost.comments.map(comment => (
                                    <div key={comment.id} className="wechat-comment">
                                        <img 
                                            src={comment.avatar || defaultAvatar} 
                                            alt="avatar" 
                                            className="wechat-avatar"
                                        />
                                        <div className="wechat-comment-content">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="wechat-comment-user">{comment.user}</div>
                                                {comment.userId === user?.uid && (
                                                    <div className="d-flex gap-2">
                                                        <button
                                                            className="btn btn-sm btn-link p-0"
                                                            onClick={() => {
                                                                setEditingComment(comment.id);
                                                                setEditCommentText(comment.text);
                                                            }}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                                <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                                                            </svg>
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-link p-0 text-danger"
                                                            onClick={() => handleDeleteComment(activeCommentPost.id, comment.id)}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                                                <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            {editingComment === comment.id ? (
                                                <div className="mt-2">
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={2}
                                                        value={editCommentText}
                                                        onChange={e => setEditCommentText(e.target.value)}
                                                        className="mb-2"
                                                    />
                                                    <div className="d-flex gap-2">
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            onClick={() => handleEditComment(activeCommentPost.id, comment.id, editCommentText)}
                                                        >
                                                            Save
                                                        </Button>
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => {
                                                                setEditingComment(null);
                                                                setEditCommentText('');
                                                            }}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="comment-content">
                                                        <div className="comment-text">{comment.text}</div>
                                                        {/* Replies section */}
                                                        {comment.replies && comment.replies.length > 0 && (
                                                            <div className="reply-section">
                                                                {comment.replies.map(reply => (
                                                                    <div key={reply.id} className="reply-item">
                                                                        <div className="d-flex align-items-center mb-1">
                                                                            <img 
                                                                                src={reply.avatar} 
                                                                                alt="" 
                                                                                className="rounded-circle me-2" 
                                                                                style={{ width: '20px', height: '20px' }}
                                                                            />
                                                                            <div className="reply-user">{reply.user}</div>
                                                                        </div>
                                                                        <div className="reply-text">{reply.text}</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {/* Reply input */}
                                                        {replyToComment === comment.id && (
                                                            <div className="reply-input-container">
                                                                <div className="d-flex gap-2">
                                                                    <Form.Control
                                                                        type="text"
                                                                        placeholder="Write a reply..."
                                                                        value={replyText}
                                                                        onChange={(e) => setReplyText(e.target.value)}
                                                                        size="sm"
                                                                        className="comment-input"
                                                                    />
                                                                    <Button
                                                                        variant="primary"
                                                                        size="sm"
                                                                        onClick={() => handleReply(activePostDetail.id, comment.id)}
                                                                        disabled={!replyText.trim()}
                                                                    >
                                                                        Reply
                                                                    </Button>
                                                                    <Button
                                                                        variant="secondary"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            setReplyToComment(null);
                                                                            setReplyText('');
                                                                        }}
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Add comment input */}
                            <div className="comment-input-container">
                                <Form
                                    onSubmit={e => {
                                        e.preventDefault();
                                        handleComment(activeCommentPost.id);
                                    }}
                                    className="d-flex align-items-center p-3"
                                >
                                    <img
                                        src={user?.photoURL || defaultAvatar}
                                        alt="avatar"
                                        className="wechat-avatar me-2"
                                    />
                                    <Form.Control
                                        type="text"
                                        placeholder="Write a comment..."
                                        value={commentInputs[activeCommentPost?.id] || ''}
                                        onChange={e => handleCommentChange(activeCommentPost.id, e.target.value)}
                                        className="comment-input"
                                    />
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="sm"
                                        disabled={!(commentInputs[activeCommentPost?.id] && commentInputs[activeCommentPost?.id].trim())}
                                        className="ms-2"
                                    >
                                        Post
                                    </Button>
                                </Form>
                            </div>
                        </>
                    )}
                </Modal.Body>
            </Modal>
            {/* Add Feed Modal */}
            <Modal
                show={showPostModal}
                onHide={() => setShowPostModal(false)}
                centered
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Create New Post</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handlePost}>
                        <Form.Group className="mb-3">
                            <Form.Control
                                as="textarea"
                                rows={4}
                                placeholder="What's on your mind?"
                                value={newPost}
                                onChange={(e) => setNewPost(e.target.value)}
                                autoFocus
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Add Media (Optional)</Form.Label>
                            <Form.Control
                                type="file"
                                accept="image/*,video/*"
                                onChange={handlePostMediaUpload}
                                multiple
                            />
                            <small className="text-muted">You can select multiple files</small>
                            {postMediaPreviews.length > 0 && (
                                <div className="mt-3">
                                    <div className="d-flex flex-wrap gap-2">
                                        {postMediaPreviews.map((preview, index) => (
                                            <div key={index} className="position-relative" style={{ width: '150px', height: '150px' }}>
                                                {preview.type.startsWith('video') ? (
                                                    <video 
                                                        src={preview.url} 
                                                        className="w-100 h-100 object-fit-cover rounded"
                                                        style={{ borderRadius: '10px' }}
                                                    />
                                                ) : (
                                                    <img 
                                                        src={preview.url} 
                                                        alt={`Preview ${index + 1}`}
                                                        className="w-100 h-100 object-fit-cover rounded"
                                                        style={{ borderRadius: '10px' }}
                                                    />
                                                )}
                                                <button
                                                    type="button"
                                                    className="btn btn-danger btn-sm position-absolute top-0 end-0 m-1"
                                                    onClick={() => {
                                                        const newPreviews = [...postMediaPreviews];
                                                        const newMedia = [...postMedia];
                                                        newPreviews.splice(index, 1);
                                                        newMedia.splice(index, 1);
                                                        setPostMediaPreviews(newPreviews);
                                                        setPostMedia(newMedia);
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Form.Group>
                        <div className="d-flex justify-content-end">
                            <Button variant="secondary" onClick={() => setShowPostModal(false)} className="me-2">
                                Cancel
                            </Button>
                            <Button 
                                variant="primary" 
                                type="submit" 
                                disabled={!newPost.trim() && postMedia.length === 0}
                            >
                                Post
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
            {/* Post Detail Modal */}
            <Modal
                show={showPostDetailModal}
                onHide={handleClosePostDetail}
                size="xl"
                centered
                className="post-detail-modal"
            >
                <Modal.Body className="p-0">
                    {activePostDetail && (
                        <>
                            <button 
                                className="modal-close-btn d-lg-none" 
                                onClick={handleClosePostDetail}
                                aria-label="Close modal"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                                </svg>
                            </button>
                            <div className="d-flex flex-column flex-lg-row" style={{ height: '80vh' }}>
                                {/* Media Section */}
                                <div className="post-detail-media" style={{ 
                                    width: '100%',
                                    height: '50vh',
                                    flex: '0 0 60%',
                                    backgroundColor: '#000', 
                                    position: 'relative',
                                    '@media (min-width: 992px)': {
                                        height: '100%'
                                    }
                                }}>
                                    {activePostDetail.media && activePostDetail.media.length > 0 ? (
                                        <div className="h-100 position-relative">
                                            {/* Media Items */}
                                            <div className="h-100 d-flex align-items-center justify-content-center position-relative">
                                                {activePostDetail.media.map((mediaUrl, index) => (
                                                    <div 
                                                        key={index}
                                                        className={`position-absolute w-100 h-100 ${index === (activeMediaIndex[activePostDetail.id] || 0) ? 'd-block' : 'd-none'}`}
                                                        style={{ transition: 'opacity 0.3s' }}
                                                    >
                                                        {activePostDetail.mediaTypes[index]?.startsWith('video') ? (
                                                            <video 
                                                                src={mediaUrl} 
                                                                className="h-100 w-100 object-fit-contain"
                                                                controls
                                                            />
                                                        ) : (
                                                            <img 
                                                                src={mediaUrl} 
                                                                alt="" 
                                                                className="h-100 w-100 object-fit-contain"
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            {/* Navigation Arrows */}
                                            {activePostDetail.media.length > 1 && (
                                                <>
                                                    <button
                                                        className="position-absolute top-50 start-0 translate-middle-y btn btn-light rounded-circle p-2"
                                                        style={{ marginLeft: '10px', zIndex: 1 }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleMediaNavigation(activePostDetail.id, 'prev');
                                                        }}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                                                            <path d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
                                                        </svg>
                                                    </button>
                                                    <button
                                                        className="position-absolute top-50 end-0 translate-middle-y btn btn-light rounded-circle p-2"
                                                        style={{ marginRight: '10px', zIndex: 1 }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleMediaNavigation(activePostDetail.id, 'next');
                                                        }}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                                                            <path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                                                        </svg>
                                                    </button>
                                                </>
                                            )}

                                            {/* Media Indicators */}
                                            {activePostDetail.media.length > 1 && (
                                                <div className="position-absolute bottom-0 start-50 translate-middle-x mb-3 d-flex gap-2">
                                                    {activePostDetail.media.map((_, index) => (
                                                        <button
                                                            key={index}
                                                            className={`btn btn-sm rounded-circle p-0 ${index === (activeMediaIndex[activePostDetail.id] || 0) ? 'btn-light' : 'btn-secondary'}`}
                                                            style={{ width: '8px', height: '8px' }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveMediaIndex(prev => ({
                                                                    ...prev,
                                                                    [activePostDetail.id]: index
                                                                }));
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div 
                                            className="h-100 d-flex align-items-center justify-content-center text-white"
                                            style={{ background: getRandomGradient(activePostDetail.id) }}
                                        >
                                            <div className="placeholder-text" style={{ maxWidth: '80%' }}>
                                                {activePostDetail.content}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {/* Comments Section */}
                                <div className="post-detail-comments" style={{ 
                                    width: '100%',
                                    height: '50vh',
                                    flex: '0 0 40%',
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    '@media (min-width: 992px)': {
                                        height: '100%'
                                    }
                                }}>
                                    <div className="p-3 border-bottom">
                                        <div className="d-flex align-items-center">
                                            <img 
                                                src={userProfiles[activePostDetail.userId]?.photoURL || activePostDetail.avatar} 
                                                alt="" 
                                                className="rounded-circle me-2" 
                                                style={{ width: '40px', height: '40px' }}
                                            />
                                            <div>
                                                <div className="fw-bold">{userProfiles[activePostDetail.userId]?.displayName || activePostDetail.user}</div>
                                                <div className="post-detail-content">{activePostDetail.content}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
                                        <h5 className="mb-0 comments-title">
                                            <span className="me-2">Comments</span>
                                            <span className="comments-count">({activePostDetail.comments?.length || 0})</span>
                                        </h5>
                                        <div className="d-flex align-items-center">
                                            <Heart 
                                                size={20} 
                                                className={`me-3 ${activePostDetail.likedByUser ? "text-danger" : ""}`}
                                                style={{ cursor: 'pointer' }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleLike(activePostDetail.id);
                                                }}
                                            />
                                            <span className="text-muted">{activePostDetail.likes || 0}</span>
                                        </div>
                                    </div>
                                    <div className="flex-grow-1 overflow-auto p-3 comments-scroll-area">
                                        {activePostDetail.comments && activePostDetail.comments.length > 0 ? (
                                            activePostDetail.comments.map(comment => (
                                                <div key={comment.id} className="mb-3">
                                                    <div className="d-flex">
                                                        <img 
                                                            src={comment.avatar} 
                                                            alt="" 
                                                            className="rounded-circle me-2" 
                                                            style={{ width: '32px', height: '32px' }}
                                                        />
                                                        <div className="flex-grow-1">
                                                            <div className="bg-light rounded p-2">
                                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                                    <div className="fw-bold">{comment.user}</div>
                                                                        <div className="d-flex gap-2">
                                                                        <button
                                                                            className="btn btn-sm btn-link p-0 text-muted"
                                                                            onClick={() => setReplyToComment(comment.id)}
                                                                        >
                                                                            Reply
                                                                        </button>
                                                                        {comment.userId === user?.uid && (
                                                                            <>
                                                                            <button
                                                                                className="btn btn-sm btn-link p-0"
                                                                                onClick={() => {
                                                                                    setEditingComment(comment.id);
                                                                                    setEditCommentText(comment.text);
                                                                                }}
                                                                            >
                                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                                                    <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                                                                                </svg>
                                                                            </button>
                                                                            <button
                                                                                className="btn btn-sm btn-link p-0 text-danger"
                                                                                onClick={() => handleDeleteComment(activePostDetail.id, comment.id)}
                                                                            >
                                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                                                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                                                                    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                                                                                </svg>
                                                                            </button>
                                                                            </>
                                                                    )}
                                                                    </div>
                                                                </div>
                                                                {editingComment === comment.id ? (
                                                                    <div className="mt-2">
                                                                        <Form.Control
                                                                            as="textarea"
                                                                            rows={2}
                                                                            value={editCommentText}
                                                                            onChange={e => setEditCommentText(e.target.value)}
                                                                            className="mb-2"
                                                                        />
                                                                        <div className="d-flex gap-2">
                                                                            <Button
                                                                                variant="primary"
                                                                                size="sm"
                                                                                onClick={() => handleEditComment(activePostDetail.id, comment.id, editCommentText)}
                                                                            >
                                                                                Save
                                                                            </Button>
                                                                            <Button
                                                                                variant="secondary"
                                                                                size="sm"
                                                                                onClick={() => {
                                                                                    setEditingComment(null);
                                                                                    setEditCommentText('');
                                                                                }}
                                                                            >
                                                                                Cancel
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="comment-content">
                                                                        <div className="comment-text">{comment.text}</div>
                                                                        {/* Replies section */}
                                                                        {comment.replies && comment.replies.length > 0 && (
                                                                            <div className="reply-section">
                                                                                {comment.replies.map(reply => (
                                                                                    <div key={reply.id} className="reply-item">
                                                                                        <div className="d-flex align-items-center mb-1">
                                                                                            <img 
                                                                                                src={reply.avatar} 
                                                                                                alt="" 
                                                                                                className="rounded-circle me-2" 
                                                                                                style={{ width: '20px', height: '20px' }}
                                                                                            />
                                                                                            <div className="reply-user">{reply.user}</div>
                                                                                        </div>
                                                                                        <div className="reply-text">{reply.text}</div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                        {/* Reply input */}
                                                                        {replyToComment === comment.id && (
                                                                            <div className="reply-input-container">
                                                                                <div className="d-flex gap-2">
                                                                                    <Form.Control
                                                                                        type="text"
                                                                                        placeholder="Write a reply..."
                                                                                        value={replyText}
                                                                                        onChange={(e) => setReplyText(e.target.value)}
                                                                                        size="sm"
                                                                                        className="comment-input"
                                                                                    />
                                                                                    <Button
                                                                                        variant="primary"
                                                                                        size="sm"
                                                                                        onClick={() => handleReply(activePostDetail.id, comment.id)}
                                                                                        disabled={!replyText.trim()}
                                                                                    >
                                                                                        Reply
                                                                                    </Button>
                                                                                    <Button
                                                                                        variant="secondary"
                                                                                        size="sm"
                                                                                        onClick={() => {
                                                                                            setReplyToComment(null);
                                                                                            setReplyText('');
                                                                                        }}
                                                                                    >
                                                                                        Cancel
                                                                                    </Button>
                                                            </div>
                                                        </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center text-muted py-4">No comments yet</div>
                                        )}
                                    </div>
                                    <div className="p-3 border-top">
                                        <Form
                                            onSubmit={e => {
                                                e.preventDefault();
                                                handleComment(activePostDetail.id);
                                            }}
                                            className="d-flex"
                                        >
                                            <Form.Control
                                                type="text"
                                                placeholder="Write a comment..."
                                                value={commentInputs[activePostDetail.id] || ''}
                                                onChange={e => handleCommentChange(activePostDetail.id, e.target.value)}
                                                className="me-2"
                                            />
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                disabled={!(commentInputs[activePostDetail.id] && commentInputs[activePostDetail.id].trim())}
                                            >
                                                Post
                                            </Button>
                                        </Form>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </Modal.Body>
            </Modal>
            {/* Profile Tab Content */}
            {activeTab === 'profile' && (
                <div className="profile-section">
                    <div className="profile-header text-center mb-4">
                        <img 
                            src={user?.photoURL || defaultAvatar} 
                            alt="Profile" 
                            className="rounded-circle mb-3"
                            style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                        />
                        <div className="d-flex justify-content-center align-items-center gap-2">
                            {editingUsername ? (
                                <>
                                    <Form.Control
                                        type="text"
                                        value={newUsername}
                                        onChange={e => setNewUsername(e.target.value)}
                                        placeholder="Enter display name"
                                        className="w-auto"
                                    />
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={handleUpdateUsername}
                                        disabled={!newUsername.trim()}
                                    >
                                        Save
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                            setEditingUsername(false);
                                            setNewUsername('');
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <h4 className="mb-0">{userProfile?.displayName || user?.displayName || 'User'}</h4>
                                    <Button
                                        variant="link"
                                        className="p-0"
                                        onClick={() => {
                                            setNewUsername(userProfile?.displayName || user?.displayName || 'User');
                                            setEditingUsername(true);
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                                        </svg>
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Container>
    );
};

export default CommunityFeed;