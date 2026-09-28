import { createSlice, nanoid } from '@reduxjs/toolkit';

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: [],
  reducers: {
    toastAdded: {
      reducer: (state, action) => [
        ...state.slice(-3),
        action.payload,
      ],
      prepare: ({ message, tone = 'success' }) => ({
        payload: {
          id: nanoid(),
          message,
          tone,
        },
      }),
    },
    toastRemoved: (state, action) =>
      state.filter((toast) => toast.id !== action.payload),
  },
});

export const { toastAdded, toastRemoved } = notificationsSlice.actions;

export default notificationsSlice.reducer;