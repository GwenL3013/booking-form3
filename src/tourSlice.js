// redux/store.js
// redux/tourSlice.js
import { createSlice } from '@reduxjs/toolkit';



export const tourSlice = createSlice({
    name: 'tours',
    initialState: {
        tours: [],
    },
    reducers: {
        setTours: (state, action) => {
            state.tours = action.payload;
        },
        addTour: (state, action) => {
            state.tours.push(action.payload);
        },
        deleteTour: (state, action) => {
            state.tours = state.tours.filter(tour => tour.id !== action.payload);
        },
    },
});

export const { setTours, addTour, deleteTour } = tourSlice.actions;
export default tourSlice.reducer;
