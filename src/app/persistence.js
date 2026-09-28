import { createTransform } from "redux-persist";

function snapshotApi(apiState) {
  const queries = Object.fromEntries(
    Object.entries(apiState.queries ?? {})
      .filter(([, query]) => {
        return (
          query.data !== undefined && Number.isFinite(query.fulfilledTimeStamp)
        );
      })
      .map(([cacheKey, query]) => [
        cacheKey,
        {
          status: "fulfilled",
          endpointName: query.endpointName,
          requestId: query.requestId,
          originalArgs: query.originalArgs,
          data: query.data,
          fulfilledTimeStamp: query.fulfilledTimeStamp,
        },
      ]),
  );

  return {
    queries,

    mutations: {},

    provided: apiState.provided ?? {
      tags: {},
      keys: {},
    },
  };
}

export const apiCacheTransform = createTransform(snapshotApi, snapshotApi, {
  whitelist: ["pokeApi"],
});
