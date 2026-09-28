import * as Yup from 'yup';

export function createComparisonSchema(pokemon) {
  const validIds = new Set(
    pokemon.map((item) => String(item.id)),
  );

  const pokemonId = () =>
    Yup.string()
      .required('Buscá y seleccioná un Pokémon de la lista.')
      .test(
        'known-pokemon',
        'Seleccioná un Pokémon válido de la lista.',
        (value) => !value || validIds.has(value),
      );

  return Yup.object({
    first: pokemonId(),

    second: pokemonId().test(
      'different-pokemon',
      'Elegí dos Pokémon diferentes.',
      (value, context) =>
        !value ||
        !context.parent.first ||
        value !== context.parent.first,
    ),
  });
}