import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

type Props = {
  /** De 0 (semilla) a 1 (planta completa). */
  progreso: number;
  /** Color de las flores y del halo de fondo. */
  color: string;
  /** Cambia la forma (curva del tallo, ángulo de las hojas) para que cada materia sea distinta. */
  semilla: string;
  /** Ancho en píxeles; el alto se calcula solo. */
  tamano: number;
};

const VERDES = {
  tallo: '#4C8636',
  hoja: '#6DB33F',
  hojaAlt: '#5AA036',
  nervio: '#3E7A2C',
  copaAtras: '#4E9638',
  copa: '#5DA544',
  copaLuz: '#72BC55',
};

// Cada hoja aparece cuando el progreso pasa su umbral. t = posición a lo largo del tallo (0 base, 1 punta).
const HOJAS = [
  { t: 0.97, lado: 1, umbral: 0 },
  { t: 0.97, lado: -1, umbral: 0 },
  { t: 0.72, lado: 1, umbral: 0.06 },
  { t: 0.6, lado: -1, umbral: 0.12 },
  { t: 0.47, lado: 1, umbral: 0.2 },
  { t: 0.36, lado: -1, umbral: 0.28 },
  { t: 0.26, lado: 1, umbral: 0.36 },
  { t: 0.18, lado: -1, umbral: 0.44 },
];

// Posición de las flores sobre la copa, relativa a su radio.
const FLORES = [
  { dx: -0.35, dy: -0.35 },
  { dx: 0.5, dy: -0.05 },
  { dx: 0.05, dy: -0.85 },
  { dx: -0.85, dy: 0.35 },
  { dx: 0.85, dy: 0.45 },
];

const BRILLOS = [
  { x: 16, y: 34, s: 1 },
  { x: 104, y: 26, s: 0.8 },
  { x: 12, y: 96, s: 0.7 },
  { x: 108, y: 90, s: 1 },
];

const UMBRAL_COPA = 0.42;
const UMBRAL_FLORES = 0.66;

type Punto = { x: number; y: number };

function bezier(a: Punto, c: Punto, b: Punto, t: number): Punto {
  const u = 1 - t;
  return {
    x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
  };
}

/** Números pseudoaleatorios a partir de un texto: la misma semilla da siempre la misma planta. */
function generador(semilla: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < semilla.length; i++) {
    h ^= semilla.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function Planta({ progreso, color, semilla, tamano }: Props) {
  const p = Math.max(0, Math.min(1, progreso));
  const azar = generador(semilla);
  const curva = (azar() - 0.5) * 16;
  const giros = HOJAS.map(() => (azar() - 0.5) * 18);

  // El tallo crece rápido al principio (raíz cuadrada) para que las primeras horas se noten.
  const base = { x: 60, y: 121 };
  const alto = 10 + 62 * Math.sqrt(p);
  const tope = { x: 60 + curva * 0.3, y: base.y - alto };
  const control = { x: 60 + curva, y: base.y - alto * 0.5 };
  const grosor = 2 + 3.5 * p;

  const avanceCopa = p >= UMBRAL_COPA ? (p - UMBRAL_COPA) / (1 - UMBRAL_COPA) : -1;
  const radio = 12 + 18 * Math.max(0, avanceCopa);
  const cantidadFlores =
    p >= UMBRAL_FLORES ? Math.min(FLORES.length, 1 + Math.floor((p - UMBRAL_FLORES) / 0.085)) : 0;
  const tamFlor = 2.2 + 1.4 * Math.max(0, avanceCopa);

  return (
    <Svg width={tamano} height={(tamano * 160) / 120} viewBox="0 0 120 160">
      <Circle cx={60} cy={80} r={56} fill={color} opacity={0.13} />
      {p >= 1 && BRILLOS.map((b, i) => <Brillo key={i} {...b} />)}

      {/* Maceta */}
      <Path
        d="M34 128 L86 128 L80.5 153 Q80 156 77 156 L43 156 Q40 156 39.5 153 Z"
        fill="#CF7650"
      />
      <Path d="M37 135 L83 135" stroke="#B85F3C" strokeWidth={1.2} opacity={0.5} />
      <Rect x={30} y={119} width={60} height={10} rx={3} fill="#B85F3C" />
      <Ellipse cx={60} cy={121} rx={26} ry={3} fill="#5B3F2A" />

      {p <= 0 ? (
        <G>
          <Ellipse
            cx={60}
            cy={118.5}
            rx={4.2}
            ry={2.8}
            fill="#8B5E3C"
            transform="rotate(-18, 60, 118.5)"
          />
          <Ellipse cx={58.8} cy={117.8} rx={1.3} ry={0.8} fill="#FFFFFF" opacity={0.35} />
        </G>
      ) : (
        <G>
          <Path
            d={`M${base.x} ${base.y} Q${control.x} ${control.y} ${tope.x} ${tope.y}`}
            stroke={VERDES.tallo}
            strokeWidth={grosor}
            strokeLinecap="round"
            fill="none"
          />

          {HOJAS.map((hoja, i) => {
            if (p < hoja.umbral) return null;
            const crecimiento = Math.min(1, (p - hoja.umbral) / 0.25);
            const largo = 6 + 8 * crecimiento + 5 * p;
            const pos = bezier(base, control, tope, hoja.t);
            const angulo = (hoja.lado === 1 ? -32 : -148) + giros[i];
            return (
              <G key={i} transform={`translate(${pos.x}, ${pos.y}) rotate(${angulo})`}>
                <Path
                  d={`M0 0 Q${largo * 0.5} ${-largo * 0.42} ${largo} 0 Q${largo * 0.5} ${largo * 0.42} 0 0 Z`}
                  fill={i % 2 === 0 ? VERDES.hoja : VERDES.hojaAlt}
                />
                <Path
                  d={`M0 0 L${largo * 0.8} 0`}
                  stroke={VERDES.nervio}
                  strokeWidth={0.6}
                  opacity={0.6}
                />
              </G>
            );
          })}

          {avanceCopa >= 0 && (
            <G>
              <Circle cx={tope.x - radio * 0.75} cy={tope.y + radio * 0.3} r={radio * 0.72} fill={VERDES.copaAtras} />
              <Circle cx={tope.x + radio * 0.75} cy={tope.y + radio * 0.3} r={radio * 0.72} fill={VERDES.copaAtras} />
              <Circle cx={tope.x} cy={tope.y} r={radio} fill={VERDES.copa} />
              <Circle cx={tope.x - radio * 0.35} cy={tope.y - radio * 0.55} r={radio * 0.7} fill={VERDES.copaLuz} />
              <Circle cx={tope.x + radio * 0.4} cy={tope.y - radio * 0.5} r={radio * 0.62} fill={VERDES.copaLuz} />
              <Circle
                cx={tope.x - radio * 0.5}
                cy={tope.y - radio * 0.75}
                r={radio * 0.25}
                fill="#FFFFFF"
                opacity={0.18}
              />
            </G>
          )}

          {FLORES.slice(0, cantidadFlores).map((f, i) => (
            <Flor key={i} x={tope.x + f.dx * radio} y={tope.y + f.dy * radio} tam={tamFlor} color={color} />
          ))}
        </G>
      )}
    </Svg>
  );
}

function Flor({ x, y, tam, color }: { x: number; y: number; tam: number; color: string }) {
  return (
    <G>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = ((i * 72 - 90) * Math.PI) / 180;
        return (
          <Circle
            key={i}
            cx={x + Math.cos(a) * tam * 1.05}
            cy={y + Math.sin(a) * tam * 1.05}
            r={tam}
            fill={color}
          />
        );
      })}
      <Circle cx={x} cy={y} r={tam * 0.7} fill="#FFD166" />
    </G>
  );
}

function Brillo({ x, y, s }: { x: number; y: number; s: number }) {
  const d = `M${x} ${y - 5 * s} Q${x + s} ${y - s} ${x + 5 * s} ${y} Q${x + s} ${y + s} ${x} ${y + 5 * s} Q${x - s} ${y + s} ${x - 5 * s} ${y} Q${x - s} ${y - s} ${x} ${y - 5 * s} Z`;
  return <Path d={d} fill="#F2C14E" />;
}
