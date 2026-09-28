import { createSlice } from '@reduxjs/toolkit';
import { REHYDRATE } from 'redux-persist';
import { toastAdded } from '../notifications/notificationsSlice';

export const TEAM_LIMIT = 6;

const isValidId = (id) => Number.isSafeInteger(id) && id > 0;

function restoreIds(value) {
  if (!Array.isArray(value)) return [];

  return [...new Set(value.filter(isValidId))].slice(0, TEAM_LIMIT);
}

const teamSlice = createSlice({
  name: 'team',
  initialState: {
    ids: [],
  },
  reducers: {
    addMember(state, { payload: id }) {
      if (
        !isValidId(id) ||
        state.ids.includes(id) ||
        state.ids.length >= TEAM_LIMIT
      ) {
        return;
      }

      state.ids = [...state.ids, id];
    },

    removeMember(state, { payload: id }) {
      state.ids = state.ids.filter((memberId) => memberId !== id);
    },

    moveMember(state, { payload }) {
      const { id, direction } = payload;
      const currentIndex = state.ids.indexOf(id);
      const targetIndex = currentIndex + direction;

      if (
        ![-1, 1].includes(direction) ||
        currentIndex === -1 ||
        targetIndex < 0 ||
        targetIndex >= state.ids.length
      ) {
        return;
      }

      state.ids = state.ids.map((memberId, index) => {
        if (index === currentIndex) return state.ids[targetIndex];
        if (index === targetIndex) return id;

        return memberId;
      });
    },
  },
  extraReducers: (builder) => {
    builder.addCase(REHYDRATE, (state, action) => {
      if (action.key !== 'pokedex-v1') return;

      state.ids = restoreIds(action.payload?.team?.ids);
    });
  },
});

export const {
  addMember,
  removeMember,
  moveMember,
} = teamSlice.actions;

export const selectTeamIds = (state) => state.team.ids;

export function addPokemonToTeam({ id, name }) {
  return (dispatch, getState) => {
    const ids = selectTeamIds(getState());
    const label = name.replaceAll('-', ' ');

    if (!isValidId(id)) {
      dispatch(
        toastAdded({
          message: 'No se pudo agregar ese Pokémon.',
          tone: 'error',
        }),
      );

      return;
    }

    if (ids.includes(id)) {
      dispatch(
        toastAdded({
          message: `${label} ya está en tu equipo.`,
          tone: 'error',
        }),
      );

      return;
    }

    if (ids.length >= TEAM_LIMIT) {
      dispatch(
        toastAdded({
          message: `Tu equipo ya tiene ${TEAM_LIMIT} Pokémon. Quitá uno para agregar otro.`,
          tone: 'error',
        }),
      );

      return;
    }

    dispatch(addMember(id));

    dispatch(
      toastAdded({
        message: `${label} se agregó a tu equipo.`,
      }),
    );
  };
}

export function removePokemonFromTeam({ id, name }) {
  return (dispatch, getState) => {
    if (!selectTeamIds(getState()).includes(id)) {
      dispatch(
        toastAdded({
          message: 'Ese Pokémon ya no está en tu equipo.',
          tone: 'error',
        }),
      );

      return;
    }

    dispatch(removeMember(id));

    dispatch(
      toastAdded({
        message: `${name.replaceAll('-', ' ')} se quitó de tu equipo.`,
      }),
    );
  };
}

export default teamSlice.reducer;