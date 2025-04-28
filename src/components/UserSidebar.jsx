import React from 'react';
import { Card, Nav } from 'react-bootstrap';
import { FaListAlt, FaCloudSun, FaUser, FaCog, FaEdit } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const UserSidebar = ({ profile, handleFileChange }) => (
  <Card className="shadow-sm border-0 mb-4">
    <Card.Body className="p-0">
      <div className="text-center p-4 bg-primary bg-opacity-10">
        <div className="avatar mb-3 d-flex justify-content-center">
          <div
            className="position-relative"
            style={{ width: '120px', height: '120px' }}
          >
            <img
              src={profile.tempAvatar || profile.avatar || "https://via.placeholder.com/120"}
              alt="Profile"
              className="rounded-circle border shadow-sm"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <label
              htmlFor="profile-upload"
              className="position-absolute bottom-0 end-0 bg-white rounded-circle p-1 shadow-sm cursor-pointer"
              style={{ cursor: 'pointer' }}
            >
              <FaEdit className="text-primary" size={16} />
            </label>
            <input
              type="file"
              id="profile-upload"
              className="d-none"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
        </div>
        <h5 className="fw-bold">{profile.displayName || 'User'}</h5>
        <p className="text-muted small mb-0">{profile.email}</p>
      </div>
      <div className="p-2">
        <Nav className="flex-column">
          <Nav.Item>
            <Link to="/my-bookings" className="nav-link d-flex align-items-center py-3">
              <FaListAlt className="me-3" /> My Bookings
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link to="/weather" className="nav-link d-flex align-items-center py-3">
              <FaCloudSun className="me-3" /> Weather
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link to="/profile" className="nav-link d-flex align-items-center py-3">
              <FaUser className="me-3" /> Profile
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link to="/travel-diaries" className="nav-link d-flex align-items-center py-3">
              <FaUser className="me-3" /> Travel Diaries
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link to="/community-feed" className="nav-link d-flex align-items-center py-3">
              <FaUser className="me-3" /> Community Feed
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link to="/settings" className="nav-link d-flex align-items-center py-3">
              <FaCog className="me-3" /> Settings
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link to="/my-todos" className="nav-link d-flex align-items-center py-3">
              <FaListAlt className="me-3" /> My Todos
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link to="/my-translator" className="nav-link d-flex align-items-center py-3">
              <FaListAlt className="me-3" /> My Translator
            </Link>
          </Nav.Item>
        </Nav>
      </div>
    </Card.Body>
  </Card>
);

export default UserSidebar; 