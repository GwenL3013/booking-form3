import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, InputGroup, Button, Card, Alert, ListGroup, Badge, Row, Col, Container } from 'react-bootstrap';
import { WiDaySunny, WiRain, WiCloudy, WiSnow, WiThunderstorm, WiFog, WiDayCloudy, WiNightClear, WiHumidity, WiStrongWind, WiSunrise, WiSunset } from 'react-icons/wi';
import { BsStarFill, BsStar, BsSearch } from 'react-icons/bs';
import './Weather.css';

const getWeatherIcon = (code, isDay) => {
  // Weather codes from WeatherAPI
  const weatherIcons = {
    1000: isDay ? <WiDaySunny size={40} /> : <WiNightClear size={40} />, // Sunny/Clear
    1003: <WiDayCloudy size={40} />, // Partly cloudy
    1006: <WiCloudy size={40} />, // Cloudy
    1009: <WiCloudy size={40} />, // Overcast
    1030: <WiFog size={40} />, // Mist
    1063: <WiRain size={40} />, // Patchy rain
    1066: <WiSnow size={40} />, // Patchy snow
    1069: <WiRain size={40} />, // Patchy sleet
    1072: <WiRain size={40} />, // Patchy freezing drizzle
    1087: <WiThunderstorm size={40} />, // Thundery outbreaks
    1114: <WiSnow size={40} />, // Blowing snow
    1117: <WiSnow size={40} />, // Blizzard
    1135: <WiFog size={40} />, // Fog
    1147: <WiFog size={40} />, // Freezing fog
    1150: <WiRain size={40} />, // Patchy light drizzle
    1153: <WiRain size={40} />, // Light drizzle
    1168: <WiRain size={40} />, // Freezing drizzle
    1171: <WiRain size={40} />, // Heavy freezing drizzle
    1180: <WiRain size={40} />, // Patchy light rain
    1183: <WiRain size={40} />, // Light rain
    1186: <WiRain size={40} />, // Moderate rain
    1189: <WiRain size={40} />, // Heavy rain
    1192: <WiRain size={40} />, // Light freezing rain
    1195: <WiRain size={40} />, // Heavy freezing rain
    1198: <WiRain size={40} />, // Light sleet
    1201: <WiRain size={40} />, // Moderate or heavy sleet
    1204: <WiRain size={40} />, // Light snow
    1207: <WiSnow size={40} />, // Moderate or heavy snow
    1210: <WiSnow size={40} />, // Patchy light snow
    1213: <WiSnow size={40} />, // Light snow
    1216: <WiSnow size={40} />, // Patchy moderate snow
    1219: <WiSnow size={40} />, // Moderate snow
    1222: <WiSnow size={40} />, // Patchy heavy snow
    1225: <WiSnow size={40} />, // Heavy snow
    1237: <WiSnow size={40} />, // Ice pellets
    1240: <WiRain size={40} />, // Light rain shower
    1243: <WiRain size={40} />, // Moderate or heavy rain shower
    1246: <WiRain size={40} />, // Torrential rain shower
    1249: <WiRain size={40} />, // Light sleet showers
    1252: <WiRain size={40} />, // Moderate or heavy sleet showers
    1255: <WiSnow size={40} />, // Light snow showers
    1258: <WiSnow size={40} />, // Moderate or heavy snow showers
    1261: <WiSnow size={40} />, // Light showers of ice pellets
    1264: <WiSnow size={40} />, // Moderate or heavy showers of ice pellets
    1273: <WiThunderstorm size={40} />, // Patchy light rain with thunder
    1276: <WiThunderstorm size={40} />, // Moderate or heavy rain with thunder
    1279: <WiThunderstorm size={40} />, // Patchy light snow with thunder
    1282: <WiThunderstorm size={40} />, // Moderate or heavy snow with thunder
  };

  return weatherIcons[code] || <WiDaySunny size={40} />;
};

const Weather = () => {
  const [city, setCity] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [savedLocations, setSavedLocations] = useState([]);
  const [defaultLocation, setDefaultLocation] = useState(null);

  // Load saved locations and default location from localStorage on component mount
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('savedLocations')) || [];
    const defaultLoc = JSON.parse(localStorage.getItem('defaultLocation'));
    setSavedLocations(saved);
    setDefaultLocation(defaultLoc);
    if (defaultLoc) {
      fetchWeatherData(defaultLoc.name);
    }
  }, []);

  // Save locations and default location to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
    if (defaultLocation) {
      localStorage.setItem('defaultLocation', JSON.stringify(defaultLocation));
    }
  }, [savedLocations, defaultLocation]);

  const fetchWeatherData = async (cityName) => {
    try {
      setLoading(true);
      setError(null);
      const apiKey = '24ac715d1e9a423cb79234637252404';
      const url = `https://api.weatherapi.com/v1/forecast.json?q=${cityName}&key=${apiKey}&days=7`;

      const response = await axios.get(url);
      setWeatherData(response.data);
      setLoading(false);
    } catch (error) {
      setError('Error fetching weather data. Please check the city name and try again.');
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const apiKey = '24ac715d1e9a423cb79234637252404';
            const url = `https://api.weatherapi.com/v1/forecast.json?q=${latitude},${longitude}&key=${apiKey}&days=7`;
            
            const response = await axios.get(url);
            setCurrentLocation(response.data);
            setLocationPermission('granted');
            setLoading(false);
          } catch (error) {
            setError('Error fetching current location weather data');
            setLoading(false);
          }
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setLocationPermission('denied');
            setError('Location access denied. Please search for a city or enable location services in your browser settings.');
          } else {
            setError('Error getting your location. Please search for a city manually.');
          }
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!defaultLocation) {
      getCurrentLocation();
    }
  }, [defaultLocation]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchCity.trim()) {
      setCity(searchCity.trim());
      fetchWeatherData(searchCity.trim());
      setSearchCity('');
    }
  };

  const saveLocation = () => {
    if (weatherData && !savedLocations.some(loc => loc.name === weatherData.location.name)) {
      const newLocation = {
        name: weatherData.location.name,
        country: weatherData.location.country,
        lastUpdated: new Date().toISOString()
      };
      setSavedLocations([...savedLocations, newLocation]);
    }
  };

  const removeLocation = (locationName) => {
    setSavedLocations(savedLocations.filter(loc => loc.name !== locationName));
    if (defaultLocation && defaultLocation.name === locationName) {
      setDefaultLocation(null);
      localStorage.removeItem('defaultLocation');
    }
  };

  const loadSavedLocation = (locationName) => {
    setCity(locationName);
    fetchWeatherData(locationName);
  };

  const setAsDefault = (location) => {
    setDefaultLocation(location);
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    
    // Convert 12-hour format to 24-hour format
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':');
    
    let hour = parseInt(hours);
    if (period === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period === 'AM' && hour === 12) {
      hour = 0;
    }

    const date = new Date();
    date.setHours(hour);
    date.setMinutes(parseInt(minutes));

    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const renderWeatherDetails = (data, isCurrentLocation = false) => {
    if (!data) return null;

    return (
      <div className="weather-details">
        <div className="weather-main">
          <div className="weather-icon-large">
            {getWeatherIcon(data.current.condition.code, data.current.is_day === 1)}
          </div>
          <div className="temperature">
            <h2>{Math.round(data.current.temp_c)}°C</h2>
            <p className="condition">{data.current.condition.text}</p>
          </div>
        </div>

        <div className="weather-info-grid">
          <div className="info-item">
            <WiHumidity size={24} className="info-icon" />
            <div className="info-text">
              <span className="info-value">{data.current.humidity}%</span>
              <span className="info-label">Humidity</span>
            </div>
          </div>
          <div className="info-item">
            <WiStrongWind size={24} className="info-icon" />
            <div className="info-text">
              <span className="info-value">{data.current.wind_kph} km/h</span>
              <span className="info-label">Wind</span>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">UV</div>
            <div className="info-text">
              <span className="info-value">{data.current.uv}</span>
              <span className="info-label">UV</span>
            </div>
          </div>
        </div>

        <div className="location-info">
          <h3>{data.location.name}, {data.location.country}</h3>
        </div>

        {!isCurrentLocation && (
          <div className="action-buttons">
            <Button 
              variant="outline-light" 
              size="sm" 
              onClick={saveLocation}
              disabled={savedLocations.some(loc => loc.name === data.location.name)}
            >
              Save
            </Button>
            <Button 
              variant="outline-light" 
              size="sm" 
              onClick={() => setAsDefault({
                name: data.location.name,
                country: data.location.country
              })}
              disabled={defaultLocation && defaultLocation.name === data.location.name}
            >
              Set Default
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderForecast = (data) => {
    if (!data?.forecast?.forecastday) return null;

    return (
      <div className="forecast-section">
        <h5 className="forecast-title">7-Day Forecast</h5>
        <div className="forecast-grid">
          {data.forecast.forecastday.map((day) => (
            <div key={day.date} className="forecast-card">
              <div className="forecast-day">{formatDate(day.date)}</div>
              <div className="forecast-icon">
                {getWeatherIcon(day.day.condition.code, true)}
              </div>
              <div className="forecast-temp">
                {Math.round(day.day.maxtemp_c)}° / {Math.round(day.day.mintemp_c)}°
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="weather-card p-3 bg-light rounded shadow-sm">
      <div className="text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading weather data...</p>
      </div>
    </div>
  );

  return (
    <Container className="weather-container">
      <div className="search-section">
        <Form onSubmit={handleSearch} className="search-form">
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Search city..."
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              className="search-input"
            />
            <Button variant="primary" type="submit" className="search-button">
              <BsSearch />
            </Button>
          </InputGroup>
        </Form>
      </div>

      {error && (
        <Alert variant="danger" className="error-message">
          {error}
        </Alert>
      )}

      <div className="weather-sections">
        {locationPermission === 'denied' ? (
          <Alert variant="warning" className="location-denied">
            Please enable location access to see current weather.
          </Alert>
        ) : (
          <>
            {currentLocation && (
              <div className="current-location-section">
                {renderWeatherDetails(currentLocation, true)}
              </div>
            )}

            {weatherData && (
              <div className="search-result-section">
                {renderWeatherDetails(weatherData)}
                {renderForecast(weatherData)}
              </div>
            )}
          </>
        )}

        {savedLocations.length > 0 && (
          <div className="saved-locations-section">
            <h2 className="section-title">Saved Locations</h2>
            <div className="saved-locations-grid">
              {savedLocations.map((location) => (
                <div key={location.name} className="saved-location-card">
                  <div className="location-name">
                    {location.name}
                    {defaultLocation && defaultLocation.name === location.name && (
                      <Badge bg="primary" className="default-badge">Default</Badge>
                    )}
                  </div>
                  <div className="location-actions">
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      onClick={() => loadSavedLocation(location.name)}
                    >
                      Load
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => removeLocation(location.name)}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Container>
  );
};

export default Weather;
