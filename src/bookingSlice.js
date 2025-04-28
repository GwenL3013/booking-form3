// redux/bookingSlice.js
import { createSlice } from '@reduxjs/toolkit';


export const bookingSlice = createSlice({
    name: 'bookings',
    initialState: {
        bookings: [],
    },
    reducers: {
        setBookings: (state, action) => {
            state.bookings = action.payload;
        },
        addBooking: (state, action) => {
            state.bookings.push(action.payload);
        },
        deleteBooking: (state, action) => {
            state.bookings = state.bookings.filter(booking => booking.id !== action.payload);
        },
    },
});

export const { setBookings, addBooking, deleteBooking } = bookingSlice.actions;
export default bookingSlice.reducer;
