import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { FaBus, FaBowlFood, FaSun, FaShip, FaMountain } from 'react-icons/fa6';
import './CustomToursBanner.css';

const iconData = [
  { icon: <FaMountain size={80} color="#e63946" />, label: 'Memorable Adventure' },
  { icon: <FaBus size={80} color="#e63946" />, label: 'Great Transportation' },
  { icon: <FaBowlFood size={80} color="#e63946" />, label: 'Delicious Food' },
  { icon: <FaShip size={80} color="#e63946" />, label: 'Cruise Sail' },
  { icon: <FaSun size={80} color="#e63946" />, label: 'Amazing Scenery' },
  
];

const CustomToursBanner = () => (
  <div className="custom-tours-banner">
    <Container>
      <div className="custom-tours-header text-center">
        <div className="custom-tours-subtitle">Custom Star Holidays</div>
        <h1 className="custom-tours-title">Choose Your Favourite Tours</h1>
      </div>
      <Row className="justify-content-center mt-5">
        {iconData.map((item, idx) => (
          <Col key={idx} xs={6} md={2} className="text-center mb-4">
            <div>{item.icon}</div>
            <div className="custom-tours-label mt-3">{item.label}</div>
          </Col>
        ))}
      </Row>
    </Container>
  </div>
);

export default CustomToursBanner; 