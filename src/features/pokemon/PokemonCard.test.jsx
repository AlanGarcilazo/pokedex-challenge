import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { pokeApi } from '../../services/pokeApi';
import teamReducer from '../team/teamSlice';
import PokemonCard from './PokemonCard';

let store;

afterEach(() => {
  cleanup();
  store?.dispatch(pokeApi.util.resetApiState());
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test('recupera los detalles del Pokémon al reintentar una consulta fallida', async () => {
  const pokemonResponse = {
    id: 1,
    name: 'bulbasaur',
    height: 7,
    weight: 69,
    species: {
      name: 'bulbasaur',
      url: 'https://pokeapi.test/api/v2/pokemon-species/1/',
    },
    types: [
      { type: { name: 'grass' } },
      { type: { name: 'poison' } },
    ],
    abilities: [],
    stats: [],
    sprites: {
      front_default: null,
      back_default: null,
      front_shiny: null,
      back_shiny: null,
    },
  };

  const fetchMock = vi
    .fn()
    .mockRejectedValue(new Error('Solicitud inesperada'))
    .mockResolvedValueOnce(
      Response.json(
        { message: 'Error del servidor' },
        { status: 500 },
      ),
    )
    .mockResolvedValueOnce(Response.json(pokemonResponse));

  vi.stubGlobal('fetch', fetchMock);

  store = configureStore({
    reducer: {
      [pokeApi.reducerPath]: pokeApi.reducer,
      team: teamReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(pokeApi.middleware),
  });

  const user = userEvent.setup();

  render(
    <Provider store={store}>
      <MemoryRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <PokemonCard pokemon={{ id: 1, name: 'bulbasaur' }} />
      </MemoryRouter>
    </Provider>,
  );

  const retryButton = await screen.findByRole('button', {
    name: 'Reintentar',
  });

  expect(
    screen.getByText('No pudimos cargar los detalles.'),
  ).toBeInTheDocument();
  expect(screen.queryByText('Planta')).not.toBeInTheDocument();

  await user.click(retryButton);

  expect(await screen.findByText('Planta')).toBeInTheDocument();
  expect(screen.getByText('Veneno')).toBeInTheDocument();
  expect(
    screen.getByRole('heading', { name: 'bulbasaur' }),
  ).toBeInTheDocument();
  expect(
    screen.queryByText('No pudimos cargar los detalles.'),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Reintentar' }),
  ).not.toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});