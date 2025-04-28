import React, { useState, useEffect, useRef } from 'react';
import { Container, Card, Form, Button, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const OfflineNavigation = () => {
    const [position, setPosition] = useState(null);
    const [destination, setDestination] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [route, setRoute] = useState(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [searchResults, setSearchResults] = useState([]);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [trafficUpdates, setTrafficUpdates] = useState([]);
    const [sharedLocations, setSharedLocations] = useState([]);
    const mapRef = useRef();
    const routingControlRef = useRef();

    useEffect(() => {
        // Handle online/offline status
        const handleOnlineStatus = () => {
            setIsOnline(navigator.onLine);
        };

        window.addEventListener('online', handleOnlineStatus);
        window.addEventListener('offline', handleOnlineStatus);

        // Initialize offline map
        const initOfflineMap = async () => {
            try {
                if (!isOnline) {
                    console.log('Loading offline map tiles...');
                }
            } catch (err) {
                setError('Failed to initialize map');
                console.error(err);
            }
        };

        initOfflineMap();

        return () => {
            window.removeEventListener('online', handleOnlineStatus);
            window.removeEventListener('offline', handleOnlineStatus);
        };
    }, [isOnline]);

    const getCurrentLocation = () => {
        setLoading(true);
        setError(null);

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setPosition({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setLoading(false);
                },
                (error) => {
                    setError('Unable to retrieve your location');
                    setLoading(false);
                    console.error(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        } else {
            setError('Geolocation is not supported by your browser');
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isOnline) {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}`);
                const results = await response.json();
                setSearchResults(results);
            } else {
                setSearchResults([
                    {
                        display_name: destination,
                        lat: position.lat + 0.01,
                        lon: position.lng + 0.01
                    }
                ]);
            }
        } catch (err) {
            setError('Failed to search for location');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePlaceSelect = async (place) => {
        setSelectedPlace(place);
        setDestination(place.display_name);
        setSearchResults([]);

        if (position) {
            await calculateRoute(place);
        }
    };

    const calculateRoute = async (destination) => {
        try {
            if (routingControlRef.current) {
                mapRef.current.removeControl(routingControlRef.current);
            }

            // Dynamically import leaflet-routing-machine
            const L_Routing = await import('leaflet-routing-machine');
            
            const routingControl = L_Routing.control({
                waypoints: [
                    L.latLng(position.lat, position.lng),
                    L.latLng(destination.lat, destination.lon)
                ],
                routeWhileDragging: true,
                show: true,
                addWaypoints: false,
                draggableWaypoints: false,
                fitSelectedRoutes: true,
                showAlternatives: false,
                createMarker: function(i, waypoint, n) {
                    return L.marker(waypoint.latLng, {
                        draggable: false
                    });
                }
            }).addTo(mapRef.current);

            routingControlRef.current = routingControl;

            routingControl.on('routesfound', (e) => {
                const routes = e.routes;
                const summary = routes[0].summary;
                setRoute({
                    distance: summary.totalDistance,
                    time: summary.totalTime,
                    instructions: routes[0].instructions
                });
            });
        } catch (err) {
            setError('Failed to calculate route');
            console.error(err);
        }
    };

    const shareLocation = () => {
        if (position) {
            const location = {
                lat: position.lat,
                lng: position.lng,
                timestamp: new Date().toISOString()
            };
            setSharedLocations(prev => [...prev, location]);
        }
    };

    return (
        <Container className="py-4">
            <h2 className="mb-4">Navigation System</h2>
            <Alert variant={isOnline ? 'success' : 'warning'}>
                {isOnline ? 'Online Mode' : 'Offline Mode'}
            </Alert>

            <Row>
                <Col md={4}>
                    <Card className="mb-4">
                        <Card.Body>
                            <Form onSubmit={handleSearch}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Destination</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={destination}
                                        onChange={(e) => setDestination(e.target.value)}
                                        placeholder="Enter your destination"
                                        required
                                    />
                                </Form.Group>

                                <div className="d-flex gap-2 mb-3">
                                    <Button
                                        variant="primary"
                                        onClick={getCurrentLocation}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <Spinner as="span" animation="border" size="sm" className="me-2" />
                                                Getting Location...
                                            </>
                                        ) : 'Get Current Location'}
                                    </Button>

                                    <Button
                                        type="submit"
                                        variant="success"
                                        disabled={loading}
                                    >
                                        Search
                                    </Button>
                                </div>

                                {searchResults.length > 0 && (
                                    <div className="search-results">
                                        <h6>Search Results:</h6>
                                        {searchResults.map((result, index) => (
                                            <Button
                                                key={index}
                                                variant="outline-primary"
                                                className="d-block w-100 mb-2"
                                                onClick={() => handlePlaceSelect(result)}
                                            >
                                                {result.display_name}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </Form>
                        </Card.Body>
                    </Card>

                    {route && (
                        <Card className="mb-4">
                            <Card.Body>
                                <h4>Route Information</h4>
                                <p>Distance: {(route.distance / 1000).toFixed(2)} km</p>
                                <p>Estimated Time: {Math.round(route.time / 60)} minutes</p>
                                <Button variant="info" onClick={shareLocation}>
                                    Share Location
                                </Button>
                            </Card.Body>
                        </Card>
                    )}

                    {trafficUpdates.length > 0 && (
                        <Card>
                            <Card.Body>
                                <h4>Traffic Updates</h4>
                                {trafficUpdates.map((update, index) => (
                                    <div key={index} className="mb-2">
                                        <p className="mb-0">{update.message}</p>
                                        <small className="text-muted">{update.time}</small>
                                    </div>
                                ))}
                            </Card.Body>
                        </Card>
                    )}
                </Col>

                <Col md={8}>
                    <div style={{ height: '600px', width: '100%' }}>
                        <MapContainer
                            center={position || [0, 0]}
                            zoom={13}
                            style={{ height: '100%', width: '100%' }}
                            ref={mapRef}
                        >
                            <TileLayer
                                url={isOnline 
                                    ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    : "path/to/offline/tiles/{z}/{x}/{y}.png"}
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            {position && (
                                <Marker position={position}>
                                    <Popup>Your current location</Popup>
                                </Marker>
                            )}
                            {selectedPlace && (
                                <Marker position={[selectedPlace.lat, selectedPlace.lon]}>
                                    <Popup>{selectedPlace.display_name}</Popup>
                                </Marker>
                            )}
                            {sharedLocations.map((location, index) => (
                                <Marker
                                    key={index}
                                    position={[location.lat, location.lng]}
                                    icon={L.divIcon({
                                        className: 'shared-location-marker',
                                        html: '<div class="shared-location"></div>'
                                    })}
                                >
                                    <Popup>
                                        Shared Location<br />
                                        {new Date(location.timestamp).toLocaleString()}
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default OfflineNavigation; 