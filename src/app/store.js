import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import { pokeApi } from "../services/pokeApi";
import { apiCacheTransform } from "./persistence";

const rootReducer = combineReducers({
  [pokeApi.reducerPath]: pokeApi.reducer,
});

const persistedReducer = persistReducer(
  {
    key: "pokedex-v1",
    version: 1,
    storage,

    whitelist: [pokeApi.reducerPath],
    transforms: [apiCacheTransform],

    stateReconciler: false,

    writeFailHandler(error) {
      console.error("No se pudo guardar la caché local.", error);
    },
  },
  rootReducer,
);

export const store = configureStore({
  reducer: persistedReducer,

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(pokeApi.middleware),
});

export const persistor = persistStore(store);
