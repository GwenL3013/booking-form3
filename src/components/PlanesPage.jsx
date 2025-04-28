import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Rectangle, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import './PlanesPage.css';

const ASEAN_BOUNDING_BOX = {
  minLat: -11,
  maxLat: 25,
  minLng: 92,
  maxLng: 135,
};

const ASEAN_BOUNDS = [
  [ASEAN_BOUNDING_BOX.minLat, ASEAN_BOUNDING_BOX.minLng],
  [ASEAN_BOUNDING_BOX.maxLat, ASEAN_BOUNDING_BOX.maxLng],
];

// CORS Proxy for some APIs that might need it
const CORS_PROXY = "https://corsproxy.io/?";

const PlanesPage = () => {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [nextFetchTime, setNextFetchTime] = useState(null);
  const mapRef = useRef(null);
  const POLLING_INTERVAL = 120000; // 2 minutes

  // Mock data for development and as fallback
  const getMockData = () => {
    const baseLat = 8;
    const baseLng = 115;
    const mockPlanes = [];

    // Generate 20 random planes in the ASEAN region
    for (let i = 0; i < 20; i++) {
      const latOffset = (Math.random() - 0.5) * 20;
      const lngOffset = (Math.random() - 0.5) * 20;

      mockPlanes.push({
        icao24: `MOCK${i.toString().padStart(4, '0')}`,
        callsign: `SIA${Math.floor(Math.random() * 2000)}`,
        originCountry: ["Singapore", "Malaysia", "Thailand", "Indonesia", "Vietnam"][Math.floor(Math.random() * 5)],
        longitude: baseLng + lngOffset,
        latitude: baseLat + latOffset,
        altitude: Math.floor(Math.random() * 12000),
        heading: Math.floor(Math.random() * 360),
        velocity: Math.floor(Math.random() * 500) + 300,
        verticalRate: (Math.random() - 0.5) * 20,
        onGround: Math.random() > 0.9, // 10% chance plane is on ground
        isMock: true
      });
    }

    return mockPlanes;
  };

  const useBackupAPI = async () => {
    try {
      // Try AirLabs API
      const response = await axios.get(
        'https://airlabs.co/api/v9/flights',
        {
          params: {
            api_key: 'YOUR_KEY_HERE', // Get a free key from airlabs.co
            bbox: `${ASEAN_BOUNDING_BOX.minLat},${ASEAN_BOUNDING_BOX.minLng},${ASEAN_BOUNDING_BOX.maxLat},${ASEAN_BOUNDING_BOX.maxLng}`
          }
        }
      );

      if (response.data && response.data.response) {
        const planeData = response.data.response.map(flight => ({
          icao24: flight.hex || flight.flight_icao || Math.random().toString(36).substr(2, 9),
          callsign: flight.flight_iata || flight.flight_icao || "Unknown",
          originCountry: flight.dep_iata || flight.flag || "Unknown",
          longitude: flight.lng,
          latitude: flight.lat,
          altitude: flight.alt || 0,
          heading: flight.dir || 0,
          velocity: flight.speed || 0,
          verticalRate: 0, // Not provided by AirLabs
          onGround: flight.status === "landed"
        }));

        return planeData;
      }
    } catch (error) {
      console.error("Backup API failed:", error);
    }

    // If all APIs fail, return mock data
    console.log("Using mock data as fallback");
    return getMockData();
  };

  const fetchPlanes = async () => {
    // Check cooldown
    if (nextFetchTime && Date.now() < nextFetchTime) {
      const remainingTime = Math.ceil((nextFetchTime - Date.now()) / 1000);
      setError(`Please wait ${remainingTime} seconds before refreshing.`);
      return;
    }

    setLoading(true);
    try {
      // Using ADS-B Exchange API via RapidAPI
      const response = await axios.get('https://adsbexchange-com1.p.rapidapi.com/v2/lat/lng/dist/', {
        params: {
          lat: (ASEAN_BOUNDING_BOX.minLat + ASEAN_BOUNDING_BOX.maxLat) / 2, // Center latitude
          lng: (ASEAN_BOUNDING_BOX.minLng + ASEAN_BOUNDING_BOX.maxLng) / 2, // Center longitude
          dist: 1000 // Distance in nautical miles (covers ASEAN region)
        },
        headers: {
          'X-RapidAPI-Key': '29d0bc7eb2mshbb8d5bd6ec58c24p1bdf2ejsnd3d137ace4e1', // Replace with your RapidAPI key
          'X-RapidAPI-Host': 'adsbexchange-com1.p.rapidapi.com'
        }
      });

      if (response.data && response.data.ac) {
        // Filter the planes to only include those in our bounding box
        const planeData = response.data.ac
          .filter(plane =>
            plane.lat >= ASEAN_BOUNDING_BOX.minLat &&
            plane.lat <= ASEAN_BOUNDING_BOX.maxLat &&
            plane.lon >= ASEAN_BOUNDING_BOX.minLng &&
            plane.lon <= ASEAN_BOUNDING_BOX.maxLng
          )
          .map(plane => ({
            icao24: plane.hex || Math.random().toString(36).substr(2, 9),
            callsign: plane.call || plane.flight || "Unknown",
            originCountry: plane.cou || "Unknown",
            longitude: plane.lon,
            latitude: plane.lat,
            altitude: plane.alt_baro || plane.alt_geom || 0,
            heading: plane.track || 0,
            velocity: plane.spd || 0,
            verticalRate: plane.vsi || 0,
            onGround: plane.gnd === 1
          }));

        setPlanes(planeData);
        setError(null);
      } else {
        // If the primary API fails, try backup
        console.log("Primary API returned no data, trying backup");
        const backupData = await useBackupAPI();
        setPlanes(backupData);
        if (backupData.length > 0 && backupData[0].isMock) {
          setError('Using simulated flight data (APIs unavailable)');
        } else {
          setError(null);
        }
      }

      setLastFetchTime(Date.now());
      setNextFetchTime(Date.now() + POLLING_INTERVAL);
    } catch (error) {
      console.error("Error fetching plane data:", error);

      // If the primary API fails, try backup
      const backupData = await useBackupAPI();
      setPlanes(backupData);

      if (backupData.length > 0 && backupData[0].isMock) {
        setError('Using simulated flight data (APIs unavailable)');
      } else {
        setError(null);
      }

      setLastFetchTime(Date.now());
      setNextFetchTime(Date.now() + POLLING_INTERVAL);
    }

    setLoading(false);
  };

  useEffect(() => {
    return () => {
      if (mapRef.current?.fetchInterval) {
        clearInterval(mapRef.current.fetchInterval);
      }
    };
  }, []);

  const handleStart = () => {
    setHasStarted(true);
    fetchPlanes();
    const interval = setInterval(fetchPlanes, POLLING_INTERVAL);
    mapRef.current = { ...mapRef.current, fetchInterval: interval };
  };

  const handleManualRefresh = () => {
    if (nextFetchTime && Date.now() < nextFetchTime) {
      const remainingTime = Math.ceil((nextFetchTime - Date.now()) / 1000);
      setError(`Please wait ${remainingTime} seconds before refreshing.`);
      return;
    }
    fetchPlanes();
  };

  // Helper to format altitude
  const formatAltitude = (meters) => {
    if (!meters || meters === 0) return "On ground";
    return `${meters.toFixed(0)} m (${(meters * 3.28084).toFixed(0)} ft)`;
  };

  // Helper to format velocity
  const formatVelocity = (mps) => {
    if (!mps) return "Unknown";
    const knots = mps * 1.94384;
    return `${mps.toFixed(0)} m/s (${knots.toFixed(0)} knots)`;
  };

  // Get plane icon based on altitude and vertical rate
  // Updated getPlaneIcon function using Bootstrap Icons
  const getPlaneIcon = (plane) => {
    const verticalState = plane.verticalRate > 1 ? 'climbing' :
                          plane.verticalRate < -1 ? 'descending' : 'cruising';
  
    const color = verticalState === 'climbing' ? '#00cc00' :
                  verticalState === 'descending' ? '#ff3300' : '#ffffff';
  
    const rotation = plane.heading || 0;
  
    const svg = `
      <svg width="30" height="30" viewBox="0 0 512 512"
           style="transform: rotate(${rotation}deg); filter: drop-shadow(0 0 2px black);"
           xmlns="http://www.w3.org/2000/svg">
        <path fill="${color}" d="M480 352v-32L320 192V48c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v144L32 320v32l224-64v64l-48 36v20l80-16 80 16v-20l-48-36v-64l224 64z"/>
      </svg>
    `;
  
    return L.divIcon({
      className: '',
      html: svg,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  };
  
  
  

  return (
    <div className={`planes-page ${darkMode ? 'dark' : ''}`}>
      <h1>ASEAN Live Planes ✈️</h1>

      {!hasStarted ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="start-screen"
          style={{ textAlign: "center", marginTop: "100px" }}
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            style={{
              padding: "15px 30px",
              fontSize: "20px",
              borderRadius: "10px",
              background: "#007bff",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            ✈️ Show Planes
          </motion.button>
        </motion.div>
      ) : (
        <>
          <div className="control-panel">
            <p>Planes: {planes.length}</p>
            <button onClick={handleManualRefresh} disabled={loading || (nextFetchTime && Date.now() < nextFetchTime)}>
              {loading ? "Loading..." : "🔄 Refresh Now"}
            </button>
            <button onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? "🌞 Light Mode" : "🌙 Dark Mode"}
            </button>
          </div>

          {loading && <p>Loading planes...</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}
          {lastFetchTime && (
            <p style={{ fontSize: "0.8em", color: "#666" }}>
              Last updated: {new Date(lastFetchTime).toLocaleTimeString()}
            </p>
          )}

          <MapContainer
            center={[8, 115]}
            zoom={4}
            className="map-container"
            whenReady={(mapInstance) => {
              mapRef.current = { ...mapRef.current, map: mapInstance.target };
              setTimeout(() => {
                mapRef.current.map.invalidateSize();
              }, 100);
            }}
          >
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="Map View">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
              </LayersControl.BaseLayer>

              <LayersControl.BaseLayer name="Satellite View">
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution='Tiles &copy; Esri'
                />
              </LayersControl.BaseLayer>
            </LayersControl>

            {/* ASEAN bounding box */}
            <Rectangle
              bounds={ASEAN_BOUNDS}
              pathOptions={{ color: 'blue', weight: 2, dashArray: '8', fillOpacity: 0 }}
            />

            {/* Planes */}
            {planes.map((plane) => (
              <Marker
              key={plane.icao24}
              position={[plane.latitude, plane.longitude]}
              icon={getPlaneIcon(plane)}
            >
              <Popup>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <strong>Flight: {plane.callsign}</strong><br />
                  <strong>Origin:</strong> {plane.originCountry}<br />
                  <strong>Altitude:</strong> {formatAltitude(plane.altitude)}<br />
                  <strong>Speed:</strong> {formatVelocity(plane.velocity)}<br />
                  <strong>Heading:</strong> {plane.heading ? `${plane.heading.toFixed(0)}°` : "N/A"}<br />
                  <strong>ICAO:</strong> {plane.icao24}
                  {plane.isMock && <p style={{ color: "red", fontSize: "0.8em" }}>*Simulated data</p>}
                </motion.div>
              </Popup>
            </Marker>
            
            ))}
          </MapContainer>
        </>
      )}
    </div>
  );
};

export default PlanesPage;