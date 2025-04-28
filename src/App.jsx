import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Navbar, Nav } from 'react-bootstrap';
import { BrowserRouter, Route, Routes, Outlet, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import ErrorPage from './pages/ErrorPage';
import Home from './pages/Home';
import GroundTours from './pages/GroundTours';
import TourDetails from './components/UserTourDetails';
import GroupTours from './pages/GroupTours';
import Contact from "./pages/Contact";
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Weather from './components/Weather';
import FlightBooking from './components/FlightBooking';

import BookingPage from './pages/BookingPage';
import BookingList from './pages/BookingList';
import BookingAdmin from './pages/BookingAdmin';
import AdminTourDetails from './components/AdminTourDetails';
import Unauthorized from './pages/Unauthorized';
import Login from './components/Login';
import Signup from './components/Signup';
import AdminSetup from './pages/AdminSetup';
import UserDashboard from './components/UserDashboard';
import TravelDiariesPage from './pages/TravelDiariesPage';
import TravelDiariesList from './components/TravelDiariesList';
import CommunityFeed from './pages/CommunityFeed';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getAuth, signOut } from 'firebase/auth';
import { Provider } from 'react-redux';
import store from './store';
import './App.css';
import UserTourDetails from './components/UserTourDetails';
import { AdminRoute, UserRoute } from './components/ProtectedRoute';
// src/App.jsx or wherever your routes are
import TranslatorPage from "./pages/TranslatorPage";
import ItineraryPage from './pages/ItineraryPage';
import NavigationPage from './pages/NavigationPage';
import TravelDiaryDetail from './components/TravelDiaryDetail';
import RecreateAuthUser from './components/RecreateAuthUser';


// inside your routes



function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  const handleLogout = async () => {
    const isConfirmed = window.confirm('Are you sure you want to log out?');

    if (isConfirmed) {
      try {
        await logout();
        navigate('/');
      } catch (error) {
        console.error("Error signing out:", error);
      }
    }
  };

  return (
    <>
      <Navbar expand="lg" expanded={expanded} className="shadow-sm mb-4 custom-navbar">
        <div className="container-fluid px-md-5">
          <Navbar.Brand href="/" className="d-flex align-items-center">
            <img
              src="new2.png"
              alt="Logo"
              style={{ height: '40px', marginRight: '5px' }}
            />
            BetaHoliday
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" onClick={handleToggle}>
            {expanded ? <span>&times;</span> : <span>&#9776;</span>}
          </Navbar.Toggle>
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto align-items-center gap-3">
              {!user ? (
                <>
                  <Nav.Link as={Link} to="/group-tours" className="custom-nav-link">Group Tours</Nav.Link>
                  <Nav.Link as={Link} to="/ground-tours" className="custom-nav-link">Ground Tours</Nav.Link>
                  <Nav.Link as={Link} to="/flights" className="custom-nav-link">Flights</Nav.Link>
                  <Nav.Link as={Link} to="/contact" className="custom-nav-link">Contact Us</Nav.Link>
                  <Nav.Link as={Link} to="/signup" className="custom2-nav-link">Sign Up</Nav.Link>
                  <Nav.Link as={Link} to="/login" className="custom2-nav-link">Login</Nav.Link>
                </>
              ) : isAdmin() ? (
                <>
                  <Nav.Link as={Link} to="/admin-dashboard" className="custom-nav-link">Tour Card List</Nav.Link>
                  <Nav.Link as={Link} to="/flights" className="custom-nav-link">Flights</Nav.Link>
                  <Nav.Link as={Link} to="/bookinglist" className="custom-nav-link">Booking List</Nav.Link>
                  <Nav.Link as={Link} to="/booking-admin" className="custom-nav-link">Handle Booking</Nav.Link>
                  <Nav.Link onClick={handleLogout} className="custom-nav-link">Logout</Nav.Link>
                </>
              ) : (
                <>
                  <Nav.Link as={Link} to="/group-tours" className="custom-nav-link">Group Tours</Nav.Link>
                  <Nav.Link as={Link} to="/ground-tours" className="custom-nav-link">Ground Tours</Nav.Link>
                  <Nav.Link as={Link} to="/flights" className="custom-nav-link">Flights</Nav.Link>
                  <Nav.Link as={Link} to="/user-dashboard" className="custom-nav-link">Dashboard</Nav.Link>
                  <Nav.Link as={Link} to="/contact" className="custom-nav-link">Contact Us</Nav.Link>
                  <Nav.Link onClick={handleLogout} className="custom-nav-link">Logout</Nav.Link>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </div>
      </Navbar>
      <Outlet />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Provider store={store}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="/group-tours" element={<GroupTours />} />
              <Route path="/ground-tours" element={<GroundTours />} />
              <Route path="/tour/:id" element={<UserTourDetails />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="*" element={<ErrorPage />} />

              {/* Auth routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/admin-setup" element={<AdminSetup />} />
              <Route path="/signup" element={<Signup />} />

              {/* Admin routes */}
              <Route path="/admin-dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/bookinglist" element={<AdminRoute><BookingList /></AdminRoute>} />
              <Route path="/booking-admin" element={<AdminRoute><BookingAdmin /></AdminRoute>} />
              <Route path="/admin/tour/:id" element={<AdminRoute><AdminTourDetails /></AdminRoute>} />

              {/* User routes */}
              <Route path="/my-bookings" element={<UserRoute><BookingPage /></UserRoute>} />
              <Route path="/user-dashboard" element={<UserRoute><UserDashboard /></UserRoute>} />
              <Route path="/translator" element={<TranslatorPage />} />
              <Route path="/itinerary" element={<ItineraryPage />} />
              <Route path="/navigation" element={<NavigationPage />} />
              <Route path="/flights" element={<FlightBooking />} />
              <Route path="/community-feed" element={<CommunityFeed />} />
              <Route path="/travel-diaries/:diaryId" element={<TravelDiaryDetail />} />
              <Route path="/recreate-auth" element={<RecreateAuthUser />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </Provider>
    </AuthProvider>
  );
}
