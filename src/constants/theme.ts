export const Colores = {
  cielo: '#9AD7F3',
  nube: '#FFFFFF',
  colinaLejos: '#6CC48F',
  /** Fondo de la parte de abajo de las pantallas (el pasto de la colina). */
  pasto: '#4FA673',
  /** Tarjetas de datos sobre el pasto. */
  pastoOscuro: '#3F9163',
  /** Paneles de listas. */
  panel: '#38845A',
  barraInferior: '#2F7550',
  arbolFondo: '#2E7A55',
  arbolFondoLuz: '#3D9466',
  /** Texto oscuro (títulos sobre el cielo, números grandes). */
  tinta: '#1D2B22',
  blanco: '#FFFFFF',
  blancoSuave: 'rgba(255,255,255,0.78)',
  amarillo: '#FFC83D',
  amarilloOscuro: '#D9A21B',
  /** Fondo de las barras de progreso. */
  pista: 'rgba(255,255,255,0.35)',
  peligro: '#E5484D',
  peligroOscuro: '#B8383C',
} as const;

/** Colores de flores o frutos para elegir al crear una materia. */
export const ColoresFlor = ['#E63946', '#9B5DE5', '#F4A261', '#F15BB5', '#FFD166', '#4CC9F0'] as const;

/** Fredoka: tipografía redonda, estilo dibujito. Se carga en src/app/_layout.tsx. */
export const Fuentes = {
  normal: 'Fredoka_500Medium',
  semi: 'Fredoka_600SemiBold',
  negrita: 'Fredoka_700Bold',
} as const;

export const Espacio = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
} as const;

/** Ancho máximo del contenido (en web, para que se vea como en el celular). */
export const AnchoMaximo = 560;
