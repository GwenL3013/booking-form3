// pages/BookingPage.js
import React, { useState } from 'react';
import { db } from '../firebase/config';
import { useDispatch } from 'react-redux';
import { addBooking } from '../bookingSlice';

const BookingPage = ({ match }) => {
  const [userName, setUserName] = useState('');
  const [date, setDate] = useState('');
  const dispatch = useDispatch();

  const tourId = match.params.tourId;

  const handleBooking = async () => {
    const newBooking = {
      userName,
      date,
      tourId,
      timestamp: new Date(),
    };
    const docRef = await db.collection('bookings').add(newBooking);
    dispatch(addBooking({ id: docRef.id, ...newBooking }));
    alert('Booking confirmed!');
  };

  return (
    <div>
      <h2>Book a Tour</h2>
      <input
        type="text"
        placeholder="Your Name"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <button onClick={handleBooking}>Confirm Booking</button>
    </div>
  );
};

export default BookingPage;
