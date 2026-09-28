import { useEffect, useMemo } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { pokeApi } from '../../services/pokeApi';

export default function useFilterData(types, generations) {
  const dispatch = useDispatch();

  
  const selectionKey = JSON.stringify([types, generations]);

  const selections = useMemo(() => {
    const [selectedTypes, selectedGenerations] =
      JSON.parse(selectionKey);

    return [
      ...selectedTypes.map((type) => ({
        kind: 'type',
        endpoint: 'getPokemonByType',
        argument: type,
        tag: { type: 'PokemonType', id: type },
      })),

      ...selectedGenerations.map((generation) => ({
        kind: 'generation',
        endpoint: 'getGenerationPokemon',
        argument: generation,
        tag: {
          type: 'GenerationPokemon',
          id: String(generation),
        },
      })),
    ];
  }, [selectionKey]);

  const selectors = useMemo(
    () =>
      selections.map((selection) =>
        pokeApi.endpoints[selection.endpoint].select(
          selection.argument,
        ),
      ),
    [selections],
  );

  const queryStates = useSelector(
    (state) => selectors.map((selectQuery) => selectQuery(state)),
    shallowEqual,
  );

  useEffect(() => {
    
    const subscriptions = selections.map((selection) =>
      dispatch(
        pokeApi.endpoints[selection.endpoint].initiate(
          selection.argument,
        ),
      ),
    );

    return () => {      
      subscriptions.map((subscription) => subscription.unsubscribe());
    };
  }, [dispatch, selections]);

  const membership = useMemo(() => {
    const typeNames = new Set(
      selections.flatMap((selection, index) =>
        selection.kind === 'type'
          ? (queryStates[index].data?.pokemon ?? []).map(
              (pokemon) => pokemon.name,
            )
          : [],
      ),
    );

    const generationNames = new Set(
      selections.flatMap((selection, index) =>
        selection.kind === 'generation'
          ? (queryStates[index].data?.results ?? []).map(
              (pokemon) => pokemon.name,
            )
          : [],
      ),
    );

    const ready = selections.every((selection, index) => {
      const data = queryStates[index].data;

      return (
        data !== undefined &&
        (selection.kind !== 'generation' || data.isComplete)
      );
    });

    return { typeNames, generationNames, ready };
  }, [selections, queryStates]);

  function retry() {
    
    return Promise.all(
      selections
        .filter((selection, index) => queryStates[index].isError)
        .map((selection) =>
          dispatch(
            pokeApi.endpoints[selection.endpoint].initiate(
              selection.argument,
              {
                subscribe: false,
                forceRefetch: true,
              },
            ),
          ),
        ),
    );
  }

  return {
    ...membership,
    retry,
    tags: selections.map((selection) => selection.tag),
    hasError: queryStates.some((query) => query.isError),
    
    isFetching: queryStates.some(
      (query) => query.isUninitialized || query.isLoading,
    ),
  };
}