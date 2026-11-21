/** Árboles que se ven en Uruguay. Al plantar una materia le toca uno al azar. */
export const ESPECIES = {
  ombu: {
    nombre: 'Ombú',
    cientifico: 'Phytolacca dioica',
    dato: 'El gigante de la pampa. Aunque parece un árbol, en realidad es una hierba enorme.',
  },
  ceibo: {
    nombre: 'Ceibo',
    cientifico: 'Erythrina crista-galli',
    dato: 'Su flor es la flor nacional de Uruguay.',
  },
  jacaranda: {
    nombre: 'Jacarandá',
    cientifico: 'Jacaranda mimosifolia',
    dato: 'En noviembre tiñe de violeta las calles de Montevideo.',
  },
  butia: {
    nombre: 'Butiá',
    cientifico: 'Butia odorata',
    dato: 'La palmera de Rocha. Con sus frutos se hace el licor de butiá.',
  },
  sauce: {
    nombre: 'Sauce llorón',
    cientifico: 'Salix babylonica',
    dato: 'Crece a orillas de ríos y arroyos, con las ramas colgando hasta el agua.',
  },
} as const;

export type EspecieId = keyof typeof ESPECIES;

export const IDS_ESPECIES = Object.keys(ESPECIES) as EspecieId[];

export function esEspecie(valor: unknown): valor is EspecieId {
  return typeof valor === 'string' && valor in ESPECIES;
}

export function especieAlAzar(): EspecieId {
  return IDS_ESPECIES[Math.floor(Math.random() * IDS_ESPECIES.length)];
}

/** Siempre la misma especie para el mismo texto (sirve para materias guardadas antes de que existieran especies). */
export function especieDesdeTexto(texto: string): EspecieId {
  return IDS_ESPECIES[hashTexto(texto) % IDS_ESPECIES.length];
}

/** Hash simple (FNV-1a) de un texto a un entero positivo. */
export function hashTexto(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
