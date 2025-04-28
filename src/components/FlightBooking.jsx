import React, { useState } from 'react';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';

const FlightBooking = () => {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    adults: 1,
  });

  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const searchFlights = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Note: You'll need to replace 'YOUR_AMADEUS_API_KEY' with your actual API key
      const response = await axios.get('https://test.api.amadeus.com/v2/shopping/flight-offers', {
        params: {
          originLocationCode: formData.origin,
          destinationLocationCode: formData.destination,
          departureDate: formData.departureDate,
          returnDate: formData.returnDate,
          adults: formData.adults,
          max: 5
        },
        headers: {
          'Authorization': `Bearer YOUR_AMADEUS_API_KEY`
        }
      });
      
      setFlights(response.data.data);
      toast.success('Flights found successfully!');
    } catch (error) {
      console.error('Error fetching flights:', error);
      toast.error('Failed to fetch flights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Flight Search</h2>
      <Form onSubmit={searchFlights}>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Origin Airport Code</Form.Label>
              <Form.Control
                type="text"
                name="origin"
                value={formData.origin}
                onChange={handleChange}
                placeholder="e.g., JFK"
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Destination Airport Code</Form.Label>
              <Form.Control
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                placeholder="e.g., LAX"
                required
              />
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Departure Date</Form.Label>
              <Form.Control
                type="date"
                name="departureDate"
                value={formData.departureDate}
                onChange={handleChange}
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Return Date</Form.Label>
              <Form.Control
                type="date"
                name="returnDate"
                value={formData.returnDate}
                onChange={handleChange}
                required
              />
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Number of Adults</Form.Label>
              <Form.Control
                type="number"
                name="adults"
                value={formData.adults}
                onChange={handleChange}
                min="1"
                max="9"
                required
              />
            </Form.Group>
          </Col>
        </Row>
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search Flights'}
        </Button>
      </Form>

      {flights.length > 0 && (
        <div className="mt-4">
          <h3>Available Flights</h3>
          {flights.map((flight, index) => (
            <div key={index} className="card mb-3">
              <div className="card-body">
                <h5 className="card-title">
                  {flight.itineraries[0].segments[0].departure.iataCode} → 
                  {flight.itineraries[0].segments[flight.itineraries[0].segments.length - 1].arrival.iataCode}
                </h5>
                <p className="card-text">
                  Price: {flight.price.total} {flight.price.currency}
                </p>
                <p className="card-text">
                  Duration: {flight.itineraries[0].duration}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
};

export default FlightBooking; 