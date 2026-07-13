import { createSlice } from "@reduxjs/toolkit";
const initialState = {
  isShow: false
};
const slice = createSlice({
  name: "loading-slice",
  initialState,
  reducers: {
    showLoading: (state) => {
      state.isShow = true;
    },
    hideLoading: (state) => {
      state.isShow = false;
    }
  }
});
const { showLoading, hideLoading } = slice.actions;
const { reducer } = slice;
export { reducer as loadingReducer, showLoading, hideLoading };
