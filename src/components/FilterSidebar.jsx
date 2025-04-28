// FilterSidebar.jsx
import React, { useState, useEffect } from 'react';
import { Form, Button, Accordion } from 'react-bootstrap';
import './FilterSidebar.css';

function FilterSidebar({ onFilter }) {
  const [filters, setFilters] = useState({
    destinations: {
      
      AUSTRALIA: false,
        CHINA: false,
        'NEW ZEALAND': false,
        JAPAN: false,
        INDONESIA: false,
        'SOUTH KOREA': false,
        MALAYSIA: false,
        SINGAPORE: false,
        THAILAND: false,
        PHILIPPINE: false
    },
    categories: {
      Leisure: false,
      Adventurous: false,
      Cultural: false,
      Nature: false,
      Premium: false
    },
    priceRange: {
      min: '',
      max: ''
    }
  });

  // Effect to apply filters when they change
  useEffect(() => {
    // Check if all destinations and categories are selected
    const allDestinationsSelected = Object.values(filters.destinations).every(val => val);
    const allCategoriesSelected = Object.values(filters.categories).every(val => val);
    const hasPriceFilter = filters.priceRange.min || filters.priceRange.max;

    if (allDestinationsSelected && allCategoriesSelected && !hasPriceFilter) {
      // Reset to default state (show all cards)
      onFilter({
        destinations: [],
        categories: [],
        priceRange: { min: '', max: '' }
      });
    } else {
      applyFilters();
    }
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDestinationChange = (destination) => {
    if (destination === 'ALL') {
      const newState = !Object.values(filters.destinations).every(val => val);
      setFilters(prev => ({
        ...prev,
        destinations: Object.keys(prev.destinations).reduce((acc, key) => {
          acc[key] = newState;
          return acc;
        }, {})
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        destinations: {
          ...prev.destinations,
          [destination]: !prev.destinations[destination]
        }
      }));
    }
  };

  const handleCategoryChange = (category) => {
    if (category === 'ALL') {
      const newState = !Object.values(filters.categories).every(val => val);
      setFilters(prev => ({
        ...prev,
        categories: Object.keys(prev.categories).reduce((acc, key) => {
          acc[key] = newState;
          return acc;
        }, {})
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        categories: {
          ...prev.categories,
          [category]: !prev.categories[category]
        }
      }));
    }
  };

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      priceRange: {
        ...prev.priceRange,
        [name]: value
      }
    }));
  };

  const applyFilters = () => {
    const activeDestinations = Object.keys(filters.destinations).filter(
      (key) => filters.destinations[key]
    );

    const activeCategories = Object.keys(filters.categories).filter(
      (key) => filters.categories[key]
    );

    onFilter({
      destinations: activeDestinations,
      categories: activeCategories,
      priceRange: filters.priceRange
    });
  };

  const clearFilters = () => {
    setFilters({
      destinations: {
        
        AUSTRALIA: false,
        CHINA: false,
        'NEW ZEALAND': false,
        JAPAN: false,
        INDONESIA: false,
        'SOUTH KOREA': false,
        MALAYSIA: false,
        SINGAPORE: false,
        THAILAND: false,
        PHILIPPINE: false,
      },
      categories: {
        All: false,
        Leisure: false,
        Adventurous: false,
        Cultural: false,
        Nature: false,
        Premium: false
      },
      priceRange: {
        min: '',
        max: ''
      }
    });
    onFilter(null);
  };

  return (
    <div className="filter-sidebar">
      <h3>Filter by</h3>

      <Accordion defaultActiveKey="0" className="mb-3">
        <Accordion.Item eventKey="0">
          <Accordion.Header>Popular Destinations</Accordion.Header>
          <Accordion.Body>
            <Form>
              <Form.Check
                type="checkbox"
                id="destination-all"
                label="ALL DESTINATIONS"
                checked={Object.values(filters.destinations).every(val => val)}
                onChange={() => handleDestinationChange('ALL')}
                className="mb-2"
              />
              {Object.keys(filters.destinations).map((destination) => (
                <Form.Check
                  key={destination}
                  type="checkbox"
                  id={`destination-${destination}`}
                  label={destination}
                  checked={filters.destinations[destination]}
                  onChange={() => handleDestinationChange(destination)}
                  className="mb-2"
                />
              ))}
            </Form>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>

      <Accordion defaultActiveKey="0" className="mb-3">
        <Accordion.Item eventKey="0">
          <Accordion.Header>Categories</Accordion.Header>
          <Accordion.Body>
            <Form>
              <Form.Check
                type="checkbox"
                id="category-all"
                label="All Categories"
                checked={Object.values(filters.categories).every(val => val)}
                onChange={() => handleCategoryChange('ALL')}
                className="mb-2"
              />
              {Object.keys(filters.categories).map((category) => (
                <Form.Check
                  key={category}
                  type="checkbox"
                  id={`category-${category}`}
                  label={category}
                  checked={filters.categories[category]}
                  onChange={() => handleCategoryChange(category)}
                  className="mb-2"
                />
              ))}
            </Form>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>

      <Accordion defaultActiveKey="0" className="mb-3">
        <Accordion.Item eventKey="0">
          <Accordion.Header>Price Range</Accordion.Header>
          <Accordion.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Min Price (RM)</Form.Label>
                <Form.Control
                  type="number"
                  name="min"
                  value={filters.priceRange.min}
                  onChange={handlePriceChange}
                  placeholder="Min"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Max Price (RM)</Form.Label>
                <Form.Control
                  type="number"
                  name="max"
                  value={filters.priceRange.max}
                  onChange={handlePriceChange}
                  placeholder="Max"
                />
              </Form.Group>
            </Form>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>

      <div className="d-grid gap-2">
        <Button variant="primary" onClick={applyFilters}>
          Apply Filters
        </Button>
        <Button variant="outline-secondary" onClick={clearFilters}>
          Clear All
        </Button>
      </div>
    </div>
  );
}

export default FilterSidebar;