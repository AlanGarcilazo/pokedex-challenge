export const TYPE_OPTIONS = [
  { value: 'normal', label: 'Normal', color: '#909078' },
  { value: 'fire', label: 'Fuego', color: '#dd6b20' },
  { value: 'water', label: 'Agua', color: '#3977c9' },
  { value: 'electric', label: 'Eléctrico', color: '#b88b00' },
  { value: 'grass', label: 'Planta', color: '#428c35' },
  { value: 'ice', label: 'Hielo', color: '#398b91' },
  { value: 'fighting', label: 'Lucha', color: '#b53d35' },
  { value: 'poison', label: 'Veneno', color: '#9743a1' },
  { value: 'ground', label: 'Tierra', color: '#a77b32' },
  { value: 'flying', label: 'Volador', color: '#8065bd' },
  { value: 'psychic', label: 'Psíquico', color: '#ce4670' },
  { value: 'bug', label: 'Bicho', color: '#778b20' },
  { value: 'rock', label: 'Roca', color: '#95813a' },
  { value: 'ghost', label: 'Fantasma', color: '#665080' },
  { value: 'dragon', label: 'Dragón', color: '#7140c7' },
  { value: 'dark', label: 'Siniestro', color: '#665246' },
  { value: 'steel', label: 'Acero', color: '#72728e' },
  { value: 'fairy', label: 'Hada', color: '#b76c9b' },
  { value: 'stellar', label: 'Astral', color: '#447a85' },
];

export const GENERATIONS = Array.from(
  { length: 9 },
  (_, index) => index + 1,
);

export const STAT_LABELS = {
  hp: 'PS',
  attack: 'Ataque',
  defense: 'Defensa',
  'special-attack': 'Ataque especial',
  'special-defense': 'Defensa especial',
  speed: 'Velocidad',
};