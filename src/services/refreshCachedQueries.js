import { pokeApi } from './pokeApi';

export function refreshCachedQueries(tags) {
  return async (dispatch, getState) => {
    const state = getState();

    const queries = pokeApi.util
      .selectInvalidatedBy(state, tags)
      .filter(
        ({ queryCacheKey }) =>
          state[pokeApi.reducerPath].queries[queryCacheKey]?.data !== undefined,
      );

    return Promise.all(
      queries.map(async ({ endpointName, originalArgs }) => {
        const request = dispatch(
          pokeApi.endpoints[endpointName].initiate(originalArgs, {
            subscribe: true,
            forceRefetch: true,
          }),
        );

        try {
          return await request;
        } finally {
          request.unsubscribe();
        }
      }),
    );
  };
}