// redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import tourReducer from './tourSlice';
import bookingReducer from './bookingSlice';


export default configureStore({
    reducer: {
        user: userReducer,
        tours: tourReducer,
        bookings: bookingReducer,
    },
});


