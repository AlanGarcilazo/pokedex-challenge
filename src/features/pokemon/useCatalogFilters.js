import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { TYPE_OPTIONS } from './pokemonOptions';

const VALID_TYPES = new Set(
  TYPE_OPTIONS.map((option) => option.value),
);

function normalizeSearch(value) {
  return String(value).trim().toLowerCase();
}

function normalizeTypes(values) {
  return Array.from(
    new Set(
      values
        .map(normalizeSearch)
        .filter((value) => VALID_TYPES.has(value)),
    ),
  ).sort();
}

function normalizeGenerations(values) {
  return Array.from(
    new Set(
      values
        .map(Number)
        .filter(
          (value) =>
            Number.isInteger(value) &&
            value >= 1 &&
            value <= 9,
        ),
    ),
  ).sort((a, b) => a - b);
}

function readFilters(params) {
  return {
    q: normalizeSearch(params.get('q') ?? ''),
    types: normalizeTypes(
      params.getAll('type').flatMap((value) => value.split(',')),
    ),
    generations: normalizeGenerations(
      params
        .getAll('generation')
        .flatMap((value) => value.split(',')),
    ),
  };
}

function writeFilters(currentParams, changes) {
  const filters = {
    ...readFilters(currentParams),
    ...changes,
  };

  const q = normalizeSearch(filters.q);

  
  const otherParams = Array.from(currentParams.entries()).filter(
    ([key]) => !['q', 'type', 'generation'].includes(key),
  );

  return new URLSearchParams([
    ...otherParams,
    ...(q ? [['q', q]] : []),
    ...normalizeTypes(filters.types).map((type) => ['type', type]),
    ...normalizeGenerations(filters.generations).map(
      (generation) => ['generation', String(generation)],
    ),
  ]);
}

function toggleValue(values, value) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

export default function useCatalogFilters() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const timerRef = useRef(null);

  const filters = useMemo(
    () => readFilters(searchParams),
    [searchParams],
  );

  
  const [searchText, setSearchText] = useState(filters.q);

  useEffect(() => {
    
    window.clearTimeout(timerRef.current);
    setSearchText(filters.q);

    return () => window.clearTimeout(timerRef.current);
  }, [location.key, filters.q]);

  function changeSearch(value) {
    setSearchText(value);
    window.clearTimeout(timerRef.current);

    timerRef.current = window.setTimeout(() => {
      const q = normalizeSearch(value);

      if (q === filters.q) {
        return;
      }

      setSearchParams(
        (current) => writeFilters(current, { q }),
        { replace: true },
      );
    }, 300);
  }

  function updateFilters(changes) {
    window.clearTimeout(timerRef.current);

    
    setSearchParams((current) =>
      writeFilters(current, {
        q: searchText,
        ...changes,
      }),
    );
  }

  function toggleType(type) {
    updateFilters({
      types: toggleValue(filters.types, type),
    });
  }

  function toggleGeneration(generation) {
    updateFilters({
      generations: toggleValue(filters.generations, generation),
    });
  }

  function clearFilters() {
    setSearchText('');

    updateFilters({
      q: '',
      types: [],
      generations: [],
    });
  }

  return {
    filters,
    searchText,
    changeSearch,
    toggleType,
    toggleGeneration,
    clearFilters,
    filterKey: JSON.stringify([
      filters.q,
      filters.types,
      filters.generations,
    ]),
    searchPending: normalizeSearch(searchText) !== filters.q,
  };
}