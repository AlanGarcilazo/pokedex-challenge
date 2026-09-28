import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { pokeApi } from '../services/pokeApi';
import { apiCacheTransform } from './persistence';
import teamReducer from '../features/team/teamSlice';
import notificationsReducer, {
  toastAdded,
} from '../features/notifications/notificationsSlice';

let storageWarningShown = false;

const rootReducer = combineReducers({
  [pokeApi.reducerPath]: pokeApi.reducer,
  team: teamReducer,
  notifications: notificationsReducer,
});

const persistedReducer = persistReducer(
  {
    key: 'pokedex-v1',
    version: 1,
    storage,
    whitelist: [pokeApi.reducerPath, 'team'],
    transforms: [apiCacheTransform],
    stateReconciler: false,

    writeFailHandler(error) {
      console.error('No se pudo guardar la caché local.', error);

      if (!storageWarningShown) {
        storageWarningShown = true;

        store.dispatch(
          toastAdded({
            message:
              'No pudimos guardar los datos en este navegador. Los últimos cambios pueden perderse al recargar.',
            tone: 'error',
          }),
        );
      }
    },
  },
  rootReducer,
);

export const store = configureStore({
  reducer: persistedReducer,

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          FLUSH,
          REHYDRATE,
          PAUSE,
          PERSIST,
          PURGE,
          REGISTER,
        ],
      },
    }).concat(pokeApi.middleware),
});

export const persistor = persistStore(store);