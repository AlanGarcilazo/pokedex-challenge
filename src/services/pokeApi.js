import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { REHYDRATE } from "redux-persist";

const INDEX_PAGE_SIZE = 200;

function toReference(resource) {
  const parts = resource.url.split("/").filter(Boolean);

  return {
    id: Number(parts[parts.length - 1]),
    name: resource.name,
    url: resource.url,
  };
}

function toPokemonDetail(pokemon) {
  return {
    id: pokemon.id,
    name: pokemon.name,
    height: pokemon.height,
    weight: pokemon.weight,

    species: toReference(pokemon.species),

    types: pokemon.types.map(({ type }) => type.name),

    abilities: pokemon.abilities.map(({ ability, is_hidden }) => ({
      name: ability.name,
      isHidden: is_hidden,
    })),

    stats: pokemon.stats.map(({ stat, base_stat }) => ({
      name: stat.name,
      value: base_stat,
    })),

    images: {
      front: pokemon.sprites.front_default,
      back: pokemon.sprites.back_default,
      shiny: pokemon.sprites.front_shiny,
      backShiny: pokemon.sprites.back_shiny,
      artwork:
        pokemon.sprites.other?.["official-artwork"]?.front_default ??
        pokemon.sprites.front_default,
    },
  };
}

export const pokeApi = createApi({
  reducerPath: "pokeApi",

  extractRehydrationInfo(action, { reducerPath }) {
    if (action.type === REHYDRATE && action.key === "pokedex-v1") {
      return action.payload?.[reducerPath];
    }
  },

  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_POKEAPI_URL,
    timeout: 15000,

    cache: "no-cache",
  }),

  keepUnusedDataFor: 60 * 60,

  refetchOnMountOrArgChange: false,
  refetchOnFocus: false,
  refetchOnReconnect: false,

  tagTypes: [
    "Pokemon",
    "PokemonList",
    "PokemonIndex",
    "PokemonType",
    "Generation",
    "Species",
    "GenerationPokemon",
  ],

  endpoints: (builder) => ({
    getPokemonByName: builder.query({
      query: (name) => `pokemon/${name}`,

      transformResponse: toPokemonDetail,

      keepUnusedDataFor: 5 * 60,

      providesTags: (_result, _error, name) => [{ type: "Pokemon", id: name }],
    }),

    getPokemonList: builder.query({
      query: ({ limit = 20, offset = 0 } = {}) => ({
        url: "pokemon",
        params: { limit, offset },
      }),

      transformResponse: (response) => ({
        count: response.count,
        next: response.next,
        previous: response.previous,
        results: response.results.map(toReference),
      }),

      providesTags: (_result, _error, { limit = 20, offset = 0 } = {}) => [
        { type: "PokemonList", id: `${limit}:${offset}` },
      ],
    }),

    getPokemonIndex: builder.query({
      queryFn: async (_arg, api, _extraOptions, baseQuery) => {
        const firstPage = await baseQuery({
          url: "pokemon",
          params: { limit: INDEX_PAGE_SIZE, offset: 0 },
        });

        if (firstPage.error) {
          return { error: firstPage.error };
        }

        const expectedCount = firstPage.data.count;
        const totalPages = Math.ceil(expectedCount / INDEX_PAGE_SIZE);

        const offsets = Array.from(
          { length: Math.max(0, totalPages - 1) },
          (_, index) => (index + 1) * INDEX_PAGE_SIZE,
        );

        if (api.signal.aborted) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "La consulta fue cancelada.",
            },
          };
        }

        const remainingPages = await Promise.all(
          offsets.map((offset) =>
            baseQuery({
              url: "pokemon",
              params: { limit: INDEX_PAGE_SIZE, offset },
            }),
          ),
        );

        if (api.signal.aborted) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "La consulta fue cancelada.",
            },
          };
        }

        const failedPage = remainingPages.find((page) => page.error);

        if (failedPage) {
          return { error: failedPage.error };
        }

        const pages = [
          firstPage.data,
          ...remainingPages.map((page) => page.data),
        ];

        const count = pages[pages.length - 1].count;

        const countChanged = pages.some((page) => page.count !== expectedCount);

        const results = pages.flatMap((page) => page.results);

        const uniquePokemon = new Map(
          results.map((pokemon) => [pokemon.name, toReference(pokemon)]),
        );

        const uniqueResults = Array.from(uniquePokemon.values());

        return {
          data: {
            results: uniqueResults,
            count,
            isComplete: !countChanged && uniqueResults.length === count,
          },
        };
      },

      providesTags: [{ type: "PokemonIndex", id: "ALL" }],
    }),

    getPokemonByType: builder.query({
      query: (type) => `type/${type}`,

      transformResponse: (response) => ({
        id: response.id,
        name: response.name,
        pokemon: response.pokemon.map(({ pokemon }) => toReference(pokemon)),
      }),

      providesTags: (_result, _error, type) => [
        { type: "PokemonType", id: type },
      ],
    }),

    getGeneration: builder.query({
      query: (generation) => `generation/${generation}`,

      transformResponse: (response) => ({
        id: response.id,
        name: response.name,

        species: response.pokemon_species.map(toReference),
      }),

      providesTags: (_result, _error, generation) => [
        { type: "Generation", id: String(generation) },
      ],
    }),

    getGenerationPokemon: builder.query({
      keepUnusedDataFor: 60 * 60,

      queryFn: async (generation, api, _extraOptions, baseQuery) => {
        if (!Number.isInteger(generation) || generation < 1 || generation > 9) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "La generación debe estar entre 1 y 9.",
            },
          };
        }

        const cancelled = {
          error: {
            status: "CUSTOM_ERROR",
            error: "La consulta fue cancelada.",
          },
        };

        try {
          if (api.signal.aborted) {
            return cancelled;
          }

          const generationResponse = await baseQuery(
            `generation/${generation}`,
          );

          if (generationResponse.error) {
            return { error: generationResponse.error };
          }

          const species = generationResponse.data.pokemon_species;

          
          const batches = Array.from(
            { length: Math.ceil(species.length / 4) },
            (_, index) => species.slice(index * 4, index * 4 + 4),
          );

          
          const result = await batches.reduce(
            async (previousBatch, batch) => {
              const previous = await previousBatch;

              if (previous.error) {
                return previous;
              }

              if (api.signal.aborted) {
                return cancelled;
              }

              const responses = await Promise.all(
                batch.map((reference) =>
                  baseQuery(`pokemon-species/${reference.name}`),
                ),
              );

              if (api.signal.aborted) {
                return cancelled;
              }

              const failedResponse = responses.find(
                (response) => response.error,
              );

              if (failedResponse) {
                return { error: failedResponse.error };
              }

              const pokemon = responses.flatMap((response) =>
                response.data.varieties.map((variety) =>
                  toReference(variety.pokemon),
                ),
              );

              return {
                data: [...previous.data, ...pokemon],
              };
            },
            Promise.resolve({ data: [] }),
          );

          if (result.error) {
            return result;
          }

          if (api.signal.aborted) {
            return cancelled;
          }
          
          const uniquePokemon = new Map(
            result.data.map((pokemon) => [pokemon.name, pokemon]),
          );

          return {
            data: {
              generation,
              speciesCount: species.length,
              results: Array.from(uniquePokemon.values()),
              isComplete: true,
            },
          };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error:
                error.message ??
                "No pudimos preparar los Pokémon de la generación.",
            },
          };
        }
      },

      providesTags: (_result, _error, generation) => [
        {
          type: "GenerationPokemon",
          id: String(generation),
        },
      ],
    }),

    getPokemonSpecies: builder.query({
      query: (name) => `pokemon-species/${name}`,

      transformResponse: (response) => ({
        id: response.id,
        name: response.name,
        generation: toReference(response.generation),

        varieties: response.varieties.map(({ is_default, pokemon }) => ({
          isDefault: is_default,
          pokemon: toReference(pokemon),
        })),
      }),

      providesTags: (_result, _error, name) => [{ type: "Species", id: name }],
    }),
  }),
});

export const {
  useGetPokemonByNameQuery,
  useGetPokemonListQuery,
  useGetPokemonIndexQuery,
  useGetPokemonByTypeQuery,
  useGetGenerationQuery,
  useGetPokemonSpeciesQuery,
} = pokeApi;
