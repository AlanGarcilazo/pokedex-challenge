import { expect, test } from 'vitest';
import { createComparisonSchema } from './comparisonSchema';

test('rechaza comparar el mismo Pokémon en ambos campos', async () => {
  const schema = createComparisonSchema([
    { id: 1, name: 'bulbasaur' },
  ]);

  const values = {
    first: '1',
    second: '1',
  };

  await expect(schema.validate(values)).rejects.toMatchObject({
    name: 'ValidationError',
    path: 'second',
    message: 'Elegí dos Pokémon diferentes.',
  });
});