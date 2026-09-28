import { expect, test } from 'vitest';
import teamReducer, { addMember } from './teamSlice';

test('conserva los seis integrantes al intentar agregar un séptimo', () => {
  const initialState = {
    ids: [1, 2, 3, 4, 5, 6],
  };

  const nextState = teamReducer(initialState, addMember(7));

  expect(nextState.ids).toEqual([1, 2, 3, 4, 5, 6]);
});