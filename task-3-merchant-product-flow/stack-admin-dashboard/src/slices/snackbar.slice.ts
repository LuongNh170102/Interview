import { createSlice } from "@reduxjs/toolkit";

interface ISnackbar {
  open: boolean;
}
const initialState: ISnackbar = {
  open: false
};

// ==============================|| SLICE - SNACKBAR ||============================== //

const slice = createSlice({
  name: "snackbar",
  initialState,
  reducers: {
    openSnackbar(state) {
      state.open = true;
    },

    closeSnackbar(state) {
      state.open = false;
    }
  }
});

const { closeSnackbar, openSnackbar } = slice.actions;
const { reducer } = slice;
export { reducer as snackbarReducer, closeSnackbar, openSnackbar };
