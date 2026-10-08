import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { accountReducer, loadingReducer, snackbarReducer } from "@/slices";
const store = configureStore({
  reducer: combineReducers({ loading: loadingReducer, account: accountReducer, snackbar: snackbarReducer })
});
type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;
export { store, type AppDispatch, type RootState };
