import type { ReactNode } from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import { hashTexto, type EspecieId } from '@/lib/especies';

type Props = {
  especie: EspecieId;
  /** De 0 (semilla) a 1 (árbol completo, florecido). */
  progreso: number;
  /** Color de las flores o frutos. */
  color: string;
  /** Texto (el id de la materia) que decide si el árbol se dibuja espejado, para que no sean todos iguales. */
  semilla: string;
  /** Ancho en píxeles; el alto se calcula solo (proporción 120 × 150). */
  tamano: number;
};

// Hasta UMBRAL_BROTE todas las especies son un brote igual; después cada una crece con su forma.
const UMBRAL_BROTE = 0.12;
// Desde UMBRAL_FLOR empiezan a aparecer flores o frutos; con progreso 1 está en plena floración.
const UMBRAL_FLOR = 0.66;

/** Proporción de alto / ancho del dibujo. */
export const PROPORCION_ARBOL = 150 / 120;

type Dibujo = {
  /** Cuánto creció el árbol, de 0 a 1 (después del brote). */
  c: number;
  /** Cuánto floreció, de 0 a 1. */
  f: number;
  color: string;
};

export function Arbol({ especie, progreso, color, semilla, tamano }: Props) {
  const p = Math.max(0, Math.min(1, progreso));
  const espejo = hashTexto(semilla) % 2 === 0 ? 1 : -1;

  let contenido: ReactNode;
  if (p <= 0) {
    contenido = <Semilla />;
  } else if (p < UMBRAL_BROTE) {
    contenido = <Brote k={p / UMBRAL_BROTE} />;
  } else {
    const c = (p - UMBRAL_BROTE) / (1 - UMBRAL_BROTE);
    const f = p < UMBRAL_FLOR ? 0 : (p - UMBRAL_FLOR) / (1 - UMBRAL_FLOR);
    const escala = 0.32 + 0.68 * c;
    const Especie = DIBUJOS[especie];
    contenido = (
      <G>
        <Ellipse cx={60} cy={141} rx={10 + 34 * escala} ry={3.5} fill="#000000" opacity={0.12} />
        <G transform={`translate(60, 140) scale(${espejo * escala}, ${escala}) translate(-60, -140)`}>
          <Especie c={c} f={f} color={color} />
        </G>
        {p >= 1 && BRILLOS.map((b, i) => <Brillo key={i} {...b} />)}
      </G>
    );
  }

  return (
    <Svg width={tamano} height={tamano * PROPORCION_ARBOL} viewBox="0 0 120 150">
      {contenido}
    </Svg>
  );
}

// ---------- Etapas comunes ----------

function Monticulo() {
  return (
    <G>
      <Path d="M40 141 Q60 127 80 141 Z" fill="#8B5A35" />
      <Path d="M48 136 Q56 131 64 132" stroke="#A8744A" strokeWidth={2} strokeLinecap="round" fill="none" />
    </G>
  );
}

function Semilla() {
  return (
    <G>
      <Monticulo />
      <Ellipse cx={60} cy={131} rx={4.5} ry={3} fill="#6B4226" transform="rotate(-18, 60, 131)" />
      <Ellipse cx={58.6} cy={130.2} rx={1.4} ry={0.9} fill="#FFFFFF" opacity={0.4} />
    </G>
  );
}

function Brote({ k }: { k: number }) {
  const alto = 6 + 18 * k;
  const topeY = 134 - alto;
  const largo = 5 + 7 * k;
  return (
    <G>
      <Monticulo />
      <Path
        d={`M60 134 Q57 ${134 - alto / 2} 60 ${topeY}`}
        stroke="#4E8A33"
        strokeWidth={2 + k}
        strokeLinecap="round"
        fill="none"
      />
      <Hoja x={60} y={topeY} angulo={-35} largo={largo} color="#6DBE45" />
      <Hoja x={60} y={topeY} angulo={-145} largo={largo} color="#5AAE36" />
    </G>
  );
}

function Hoja({ x, y, angulo, largo, color }: { x: number; y: number; angulo: number; largo: number; color: string }) {
  return (
    <G transform={`translate(${x}, ${y}) rotate(${angulo})`}>
      <Path
        d={`M0 0 Q${largo * 0.5} ${-largo * 0.45} ${largo} 0 Q${largo * 0.5} ${largo * 0.45} 0 0 Z`}
        fill={color}
      />
    </G>
  );
}

// ---------- Piezas reutilizables ----------

type Bola = { x: number; y: number; r: number };

/** Copa hecha de bolas que van apareciendo a medida que el árbol crece. */
function Copa({
  bolas,
  c,
  oscuro,
  medio,
  claro,
  ondas = true,
}: {
  bolas: Bola[];
  c: number;
  oscuro: string;
  medio: string;
  claro: string;
  ondas?: boolean;
}) {
  const visibles = bolas.filter((_, i) => c >= (i / bolas.length) * 0.7);
  return (
    <G>
      {visibles.map((b, i) => (
        <Circle key={`o${i}`} cx={b.x} cy={b.y} r={b.r} fill={oscuro} />
      ))}
      {visibles.map((b, i) => (
        <Circle key={`m${i}`} cx={b.x - b.r * 0.12} cy={b.y - b.r * 0.18} r={b.r * 0.78} fill={medio} />
      ))}
      {visibles
        .filter((_, i) => i % 2 === 0)
        .map((b, i) => (
          <Circle key={`c${i}`} cx={b.x - b.r * 0.32} cy={b.y - b.r * 0.4} r={b.r * 0.3} fill={claro} />
        ))}
      {ondas &&
        visibles
          .filter((_, i) => i % 3 === 1)
          .map((b, i) => <Onda key={`w${i}`} x={b.x + b.r * 0.1} y={b.y + b.r * 0.25} ancho={b.r * 0.5} color={oscuro} />)}
    </G>
  );
}

/** La rayita ondulada de los árboles de dibujito. */
function Onda({ x, y, ancho, color }: { x: number; y: number; ancho: number; color: string }) {
  const a = ancho;
  return (
    <Path
      d={`M${x - a} ${y} Q${x - a / 2} ${y - a * 0.45} ${x} ${y} Q${x + a / 2} ${y + a * 0.45} ${x + a} ${y}`}
      stroke={color}
      strokeWidth={1.4}
      strokeLinecap="round"
      fill="none"
    />
  );
}

function Rama({ d, ancho, color }: { d: string; ancho: number; color: string }) {
  return <Path d={d} stroke={color} strokeWidth={ancho} strokeLinecap="round" strokeLinejoin="round" fill="none" />;
}

/** Cuántos elementos de una lista mostrar según cuánto floreció. */
const cantidad = (f: number, total: number) => (f <= 0 ? 0 : Math.ceil(f * total));

// ---------- Especies ----------

function Ombu({ c, f, color }: Dibujo) {
  const bolas: Bola[] = [
    { x: 60, y: 64, r: 26 },
    { x: 36, y: 72, r: 19 },
    { x: 84, y: 72, r: 19 },
    { x: 46, y: 50, r: 20 },
    { x: 74, y: 50, r: 20 },
    { x: 60, y: 40, r: 19 },
    { x: 18, y: 80, r: 13 },
    { x: 102, y: 80, r: 13 },
  ];
  const bayas = [
    [40, 62],
    [62, 52],
    [80, 64],
    [50, 78],
    [72, 80],
    [58, 34],
    [26, 80],
    [96, 80],
  ];
  return (
    <G>
      {/* Tronco grueso con la base ensanchada, típico del ombú */}
      <Path
        d="M38 140 C47 137 50 128 51 116 C52 106 50 98 46 88 L56 93 L60 84 L64 93 L74 88 C70 98 68 106 69 116 C70 128 73 137 82 140 Z"
        fill="#8A5A3B"
      />
      <Path
        d="M55 134 Q57 120 56 106 M65 134 Q63 122 64 108"
        stroke="#6E452C"
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
      />
      <Copa bolas={bolas} c={c} oscuro="#2D7A4C" medio="#3E9A60" claro="#62BC80" />
      {bayas.slice(0, cantidad(f, bayas.length)).map(([x, y], i) => (
        <G key={i}>
          <Circle cx={x} cy={y} r={2.3} fill={color} />
          <Circle cx={x + 3.2} cy={y + 1.6} r={2.1} fill={color} />
          <Circle cx={x + 1} cy={y + 3.8} r={2.1} fill={color} />
        </G>
      ))}
    </G>
  );
}

function Ceibo({ c, f, color }: Dibujo) {
  const tronco = '#7B5236';
  const bolas: Bola[] = [
    { x: 61, y: 42, r: 13 },
    { x: 37, y: 66, r: 13 },
    { x: 87, y: 52, r: 13 },
    { x: 50, y: 38, r: 10 },
    { x: 28, y: 58, r: 10 },
    { x: 97, y: 60, r: 10 },
    { x: 84, y: 90, r: 10 },
    { x: 73, y: 34, r: 10 },
  ];
  const flores = [
    [55, 32],
    [68, 36],
    [30, 58],
    [44, 60],
    [82, 44],
    [94, 50],
    [80, 84],
    [90, 88],
    [66, 48],
    [24, 66],
  ];
  return (
    <G>
      {/* Tronco retorcido e inclinado */}
      <Rama d="M60 140 C53 126 50 114 56 102 C62 90 70 86 64 72" ancho={10} color={tronco} />
      <Rama d="M57 104 C48 96 41 86 37 72" ancho={5} color={tronco} />
      <Rama d="M64 78 C73 70 81 64 86 56" ancho={5} color={tronco} />
      <Rama d="M64 74 C62 64 61 56 61 46" ancho={4.5} color={tronco} />
      <Rama d="M59 112 C68 110 77 104 84 94" ancho={4} color={tronco} />
      <Ellipse cx={57} cy={118} rx={2} ry={3} fill="#5C3B25" />
      <Copa bolas={bolas} c={c} oscuro="#3A8A4C" medio="#52A864" claro="#7CC48A" />
      {flores.slice(0, cantidad(f, flores.length)).map(([x, y], i) => (
        <G key={i} transform={`translate(${x}, ${y})`}>
          {[-30, 0, 30].map((a) => (
            <Ellipse key={a} cx={0} cy={-4.2} rx={1.9} ry={4.2} fill={color} transform={`rotate(${a})`} />
          ))}
          <Circle cx={0} cy={0} r={1.3} fill="#3A2A1A" />
        </G>
      ))}
    </G>
  );
}

function Jacaranda({ c, f, color }: Dibujo) {
  const tronco = '#8B6A50';
  const bolas: Bola[] = [
    { x: 62, y: 58, r: 16 },
    { x: 47, y: 62, r: 15 },
    { x: 77, y: 62, r: 15 },
    { x: 33, y: 66, r: 13 },
    { x: 91, y: 66, r: 13 },
    { x: 54, y: 47, r: 13 },
    { x: 71, y: 47, r: 13 },
    { x: 20, y: 70, r: 10 },
    { x: 104, y: 70, r: 10 },
  ];
  const visibles = bolas.filter((_, i) => c >= (i / bolas.length) * 0.7);
  // Racimos de flores repartidos por toda la copa, en orden para que la floración se vaya extendiendo.
  const desplazamientos = [
    [-0.4, -0.3],
    [0.35, -0.2],
    [0, 0.35],
  ];
  const racimos = desplazamientos.flatMap(([dx, dy]) => visibles.map((b) => [b.x + dx * b.r, b.y + dy * b.r]));
  const caidas = [
    [32, 141],
    [45, 143],
    [78, 142],
    [90, 141],
    [70, 144],
  ];
  return (
    <G>
      <Rama d="M61 140 C60 128 61 114 61 102" ancho={7} color={tronco} />
      <Rama d="M61 106 C55 96 49 86 44 74" ancho={4.5} color={tronco} />
      <Rama d="M61 102 C62 90 62 80 62 68" ancho={4.5} color={tronco} />
      <Rama d="M61 108 C68 98 75 88 80 74" ancho={4.5} color={tronco} />
      <Copa bolas={bolas} c={c} oscuro="#3A8757" medio="#52A86E" claro="#78C48F" />
      {racimos.slice(0, cantidad(f, racimos.length)).map(([x, y], i) => (
        <G key={i}>
          <Circle cx={x} cy={y} r={2.5} fill={color} />
          <Circle cx={x + 2.7} cy={y + 1} r={2.3} fill={color} />
          <Circle cx={x - 2.5} cy={y + 1.2} r={2.3} fill={color} />
          <Circle cx={x + 0.5} cy={y - 2.5} r={2.3} fill={color} />
        </G>
      ))}
      {/* Flores caídas en el piso, como las veredas de Montevideo en noviembre */}
      {f >= 0.5 &&
        caidas.map(([x, y], i) => <Ellipse key={i} cx={x} cy={y} rx={2.6} ry={1.2} fill={color} opacity={0.85} />)}
    </G>
  );
}

function Butia({ c, f, color }: Dibujo) {
  const centro = { x: 62, y: 72 };
  // [punta x, punta y, cuánto se arquea]
  const hojas: [number, number, number][] = [
    [12, 96, 30],
    [16, 72, 26],
    [26, 50, 20],
    [42, 36, 14],
    [58, 28, 8],
    [70, 28, 8],
    [84, 36, 14],
    [98, 50, 20],
    [108, 72, 26],
    [112, 96, 30],
  ];
  // Primero salen las del centro, después las de los costados. Se dibujan de afuera hacia adentro.
  const orden = [4, 5, 3, 6, 2, 7, 1, 8, 0, 9];
  const visibles = orden
    .filter((_, pos) => c >= (pos / orden.length) * 0.4)
    .sort((a, b) => Math.abs(b - 4.5) - Math.abs(a - 4.5));
  const anillos = [134, 127, 120, 113, 106, 99, 92, 85, 78].map((y) => {
    const t = (140 - y) / 66;
    const izq = 54 + t * 4 + 1;
    const der = 68 - t * 2 - 1;
    return `M${izq} ${y} Q${(izq + der) / 2} ${y - 3} ${der} ${y}`;
  });
  const racimo = [
    [0, 0],
    [4, 1],
    [-4, 1],
    [2, 4.5],
    [-2, 4.5],
    [6, 4.5],
    [0, 8],
  ];
  const frutos = [
    ...racimo.map(([dx, dy]) => [50 + dx, 82 + dy]),
    ...racimo.map(([dx, dy]) => [74 + dx, 82 + dy]),
  ];
  return (
    <G>
      {/* Tronco con las marcas de las hojas viejas */}
      <Path d="M54 140 C55 120 57 98 58 74 L66 74 C66 98 67 120 68 140 Z" fill="#8C7358" />
      <Path d={anillos.join(' ')} stroke="#6E5A44" strokeWidth={1.3} strokeLinecap="round" fill="none" />
      {visibles.map((i) => {
        const [px, py, arco] = hojas[i];
        const dx = px - centro.x;
        const dy = py - centro.y;
        const largo = Math.hypot(dx, dy);
        const nx = -dy / largo;
        const ny = dx / largo;
        const mx = centro.x + dx / 2;
        const my = centro.y + dy / 2 - arco;
        const espina = `M${centro.x} ${centro.y} Q${mx} ${my} ${px} ${py}`;
        // Folíolos: rayitas que cuelgan a los dos lados de la hoja.
        const foliolos = [0.25, 0.4, 0.55, 0.7, 0.85].map((t) => {
          const u = 1 - t;
          const x = u * u * centro.x + 2 * u * t * mx + t * t * px;
          const y = u * u * centro.y + 2 * u * t * my + t * t * py;
          const l = 7 * (1 - t * 0.4);
          return `M${x} ${y} L${x + nx * l} ${y + ny * l + 4} M${x} ${y} L${x - nx * l} ${y - ny * l + 4}`;
        });
        return (
          <G key={i}>
            <Path d={foliolos.join(' ')} stroke="#5E8F78" strokeWidth={2.2} strokeLinecap="round" fill="none" />
            <Path d={espina} stroke="#6F9F88" strokeWidth={6} strokeLinecap="round" fill="none" />
            <Path d={espina} stroke="#94C2AA" strokeWidth={2} strokeLinecap="round" fill="none" />
          </G>
        );
      })}
      {f > 0 && <Path d="M58 76 L50 82 M66 76 L74 82" stroke="#B0894F" strokeWidth={1.5} strokeLinecap="round" />}
      {frutos.slice(0, cantidad(f, frutos.length)).map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={2.6} fill={color} />
      ))}
    </G>
  );
}

function Sauce({ c, f, color }: Dibujo) {
  const tronco = '#7A5A3E';
  const bolas: Bola[] = [
    { x: 62, y: 52, r: 18 },
    { x: 44, y: 56, r: 14 },
    { x: 80, y: 56, r: 14 },
    { x: 30, y: 62, r: 10 },
    { x: 94, y: 62, r: 10 },
  ];
  // Ramas colgantes: las del medio son más largas. Salen primero las del centro.
  const xs = [26, 32, 38, 44, 50, 56, 62, 68, 74, 80, 86, 92, 98];
  const colgantes = xs
    .map((x) => {
      const distancia = Math.abs(x - 62) / 36;
      return { x, largo: 40 + (1 - distancia) * 22, rango: distancia };
    })
    .filter((r) => c >= r.rango * 0.7);
  const amentos = colgantes.flatMap((r, i) =>
    i % 2 === 0
      ? [
          [r.x + (r.x < 62 ? -1 : 1), 54 + r.largo * 0.55],
          [r.x + (r.x < 62 ? -2 : 2), 54 + r.largo * 0.85],
        ]
      : [],
  );
  return (
    <G>
      <Path
        d="M54 140 C56 124 55 108 58 94 C60 84 58 76 60 66 L66 66 C66 78 68 86 66 96 C64 110 66 126 70 140 Z"
        fill={tronco}
      />
      <Rama d="M61 74 C52 66 44 62 36 60" ancho={3} color={tronco} />
      <Rama d="M64 72 C72 64 80 60 90 58" ancho={3} color={tronco} />
      {colgantes.map((r, i) => (
        <Path
          key={r.x}
          d={`M${r.x} 54 Q${r.x + 2} ${54 + r.largo * 0.5} ${r.x + (r.x < 62 ? -3 : 3)} ${54 + r.largo}`}
          stroke={i % 2 === 0 ? '#6FAE4E' : '#86C266'}
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
        />
      ))}
      <Copa bolas={bolas} c={c} oscuro="#5E9C42" medio="#7DB85A" claro="#A2D47C" ondas={false} />
      {amentos.slice(0, cantidad(f, amentos.length)).map(([x, y], i) => (
        <Ellipse key={i} cx={x} cy={y} rx={1.4} ry={2.8} fill={color} />
      ))}
    </G>
  );
}

const DIBUJOS: Record<EspecieId, (props: Dibujo) => ReactNode> = {
  ombu: Ombu,
  ceibo: Ceibo,
  jacaranda: Jacaranda,
  butia: Butia,
  sauce: Sauce,
};

// ---------- Brillitos cuando llega a la meta ----------

const BRILLOS = [
  { x: 14, y: 28, s: 1 },
  { x: 106, y: 22, s: 0.8 },
  { x: 10, y: 96, s: 0.7 },
  { x: 110, y: 92, s: 1 },
];

function Brillo({ x, y, s }: { x: number; y: number; s: number }) {
  const d = `M${x} ${y - 5 * s} Q${x + s} ${y - s} ${x + 5 * s} ${y} Q${x + s} ${y + s} ${x} ${y + 5 * s} Q${x - s} ${y + s} ${x - 5 * s} ${y} Q${x - s} ${y - s} ${x} ${y - 5 * s} Z`;
  return <Path d={d} fill="#FFD43B" />;
}
