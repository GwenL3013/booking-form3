import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card, InputGroup } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaPlane, FaUser, FaChild, FaBaby } from 'react-icons/fa';

const FlightBookingBanner = () => {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    adults: 1,
    children: 0,
    infants: 0,
  });

  const [loading, setLoading] = useState(false);
  const [showPassengerSelector, setShowPassengerSelector] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    setFadeIn(true);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePassengerChange = (type, value) => {
    const newValue = parseInt(value);
    if (newValue >= 0) {
      setFormData(prev => ({
        ...prev,
        [type]: newValue
      }));
    }
  };

  const getTotalPassengers = () => {
    return formData.adults + formData.children + formData.infants;
  };

  const searchFlights = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, get the IATA codes for the airports
      const airportsResponse = await axios.get('http://api.aviationstack.com/v1/airports', {
        params: {
          access_key: 'b61a005146f961ce5d05616725798f65',
          search: `${formData.origin},${formData.destination}`
        }
      });

      if (!airportsResponse.data.data || airportsResponse.data.data.length < 2) {
        throw new Error('Invalid airport codes');
      }

      const originAirport = airportsResponse.data.data.find(airport => 
        airport.iata_code === formData.origin.toUpperCase()
      );
      const destAirport = airportsResponse.data.data.find(airport => 
        airport.iata_code === formData.destination.toUpperCase()
      );

      if (!originAirport || !destAirport) {
        throw new Error('Airport not found');
      }

      // Then search for flights
      const flightsResponse = await axios.get('http://api.aviationstack.com/v1/flights', {
        params: {
          access_key: 'b61a005146f961ce5d05616725798f65',
          dep_iata: originAirport.iata_code,
          arr_iata: destAirport.iata_code,
          flight_date: formData.departureDate
        }
      });

      if (flightsResponse.data.data && flightsResponse.data.data.length > 0) {
        toast.success('Flights found! Check the Flights page for results.');
        window.location.href = `/flights?origin=${formData.origin}&destination=${formData.destination}&departure=${formData.departureDate}&return=${formData.returnDate}`;
      } else {
        throw new Error('No flights found for the selected date');
      }

    } catch (error) {
      console.error('Error fetching flights:', error);
      if (error.response?.status === 429) {
        toast.error('API rate limit exceeded. Please try again later.');
      } else if (error.response?.status === 401) {
        toast.error('Invalid API key. Please check your access key.');
      } else if (error.message === 'Invalid airport codes' || error.message === 'Airport not found') {
        toast.error('Please enter valid airport codes (e.g., JFK, LAX)');
      } else if (error.message === 'No flights found for the selected date') {
        toast.error('No flights available for the selected date. Please try a different date.');
      } else {
        toast.error('Failed to fetch flights. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="d-flex justify-content-center">
      <Card className={`mb-4 shadow-sm flight-booking-banner ${fadeIn ? 'fade-in' : ''}`}>
        <Card.Body className="p-4 p-md-5">
          <h3 className="mb-4 flight-banner-title">
            <FaPlane className="me-2" />
            Book Your Flight
          </h3>
          <Form onSubmit={searchFlights}>
            <Row className="g-3 align-items-end">
              <Col xs={12} sm={6} md={3}>
                <Form.Group>
                  <Form.Label className="flight-label">From</Form.Label>
                  <InputGroup size="lg">
                    <InputGroup.Text><FaPlane className="rotate-45" /></InputGroup.Text>
                    <Form.Control
                      type="text"
                      name="origin"
                      value={formData.origin}
                      onChange={handleChange}
                      placeholder="e.g., JFK"
                      required
                      size="lg"
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={3}>
                <Form.Group>
                  <Form.Label className="flight-label">To</Form.Label>
                  <InputGroup size="lg">
                    <InputGroup.Text><FaPlane /></InputGroup.Text>
                    <Form.Control
                      type="text"
                      name="destination"
                      value={formData.destination}
                      onChange={handleChange}
                      placeholder="e.g., LAX"
                      required
                      size="lg"
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col xs={6} md={2}>
                <Form.Group>
                  <Form.Label className="flight-label">Departure</Form.Label>
                  <Form.Control
                    type="date"
                    name="departureDate"
                    value={formData.departureDate}
                    onChange={handleChange}
                    required
                    size="lg"
                  />
                </Form.Group>
              </Col>
              <Col xs={6} md={2}>
                <Form.Group>
                  <Form.Label className="flight-label">Return</Form.Label>
                  <Form.Control
                    type="date"
                    name="returnDate"
                    value={formData.returnDate}
                    onChange={handleChange}
                    required
                    size="lg"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={2}>
                <Form.Group>
                  <Form.Label className="flight-label">Passengers</Form.Label>
                  <div className="position-relative">
                    <InputGroup size="lg" onClick={() => setShowPassengerSelector(!showPassengerSelector)}>
                      <InputGroup.Text><FaUser /></InputGroup.Text>
                      <Form.Control
                        type="text"
                        value={`${getTotalPassengers()} Passenger${getTotalPassengers() !== 1 ? 's' : ''}`}
                        readOnly
                        style={{ cursor: 'pointer', background: '#fff' }}
                        size="lg"
                      />
                    </InputGroup>
                    {showPassengerSelector && (
                      <div className="passenger-selector">
                        <div className="passenger-type">
                          <FaUser className="me-2" />
                          <span>Adults (12+)</span>
                          <Form.Control
                            type="number"
                            min="1"
                            max="9"
                            value={formData.adults}
                            onChange={(e) => handlePassengerChange('adults', e.target.value)}
                            className="ms-2"
                            size="lg"
                          />
                        </div>
                        <div className="passenger-type">
                          <FaChild className="me-2" />
                          <span>Children (2-11)</span>
                          <Form.Control
                            type="number"
                            min="0"
                            max="9"
                            value={formData.children}
                            onChange={(e) => handlePassengerChange('children', e.target.value)}
                            className="ms-2"
                            size="lg"
                          />
                        </div>
                        <div className="passenger-type">
                          <FaBaby className="me-2" />
                          <span>Infants (0-2)</span>
                          <Form.Control
                            type="number"
                            min="0"
                            max="9"
                            value={formData.infants}
                            onChange={(e) => handlePassengerChange('infants', e.target.value)}
                            className="ms-2"
                            size="lg"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Form.Group>
              </Col>
              <Col xs={12} className="d-grid mt-3">
                <Button 
                  variant="primary" 
                  type="submit" 
                  disabled={loading}
                  className="search-button"
                  size="lg"
                >
                  {loading ? 'Searching...' : 'Search Flights'}
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      <style jsx>{`
        .flight-booking-banner {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 1rem;
          max-width: 1200px;
          width: 100%;
          margin: 2rem auto;
          padding: 2rem;
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .fade-in {
          opacity: 1;
          transform: translateY(0);
        }
        .flight-banner-title {
          font-size: 2.1rem;
          font-weight: 700;
        }
        .flight-label {
          font-size: 1.1rem;
          font-weight: 500;
        }
        .rotate-45 {
          transform: rotate(45deg);
        }
        .passenger-selector {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          padding: 1.2rem;
          border-radius: 0.5rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.13);
          z-index: 1000;
        }
        .passenger-type {
          display: flex;
          align-items: center;
          margin-bottom: 0.7rem;
          font-size: 1.05rem;
        }
        .passenger-type:last-child {
          margin-bottom: 0;
        }
        .search-button {
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
          border: none;
          padding: 0.7rem 2.5rem;
          font-weight: 600;
          font-size: 1.2rem;
        }
        .search-button:hover {
          background: linear-gradient(135deg, #0056b3 0%, #003d80 100%);
        }
      `}</style>
    </Container>
  );
};

export default FlightBookingBanner;