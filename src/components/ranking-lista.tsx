import { StyleSheet, View } from 'react-native';

import { BarraProgreso } from '@/components/barra-progreso';
import { Texto } from '@/components/texto';
import { Colores, Espacio } from '@/constants/theme';
import { formatoDuracion } from '@/lib/brote';
import type { FilaRanking } from '@/lib/grupos';

const MEDALLAS = ['🥇', '🥈', '🥉'];

/** Tabla del ranking: puesto, nombre, horas y una barra comparada con el primero. */
export function RankingLista({ filas, limite }: { filas: FilaRanking[]; limite?: number }) {
  const maximo = Math.max(...filas.map((f) => f.horas), 0);
  const visibles = limite ? filas.slice(0, limite) : filas;
  const yo = filas.findIndex((f) => f.soyYo);
  // Si me quedé afuera del recorte, igual me muestro al final.
  const agregarme = limite !== undefined && yo >= limite;

  return (
    <View style={estilos.lista}>
      {visibles.map((fila, i) => (
        <Fila key={fila.usuarioId} fila={fila} puesto={i} maximo={maximo} />
      ))}
      {agregarme && (
        <>
          <Texto variante="chico" color={Colores.blancoSuave} style={estilos.centrado}>
            ···
          </Texto>
          <Fila fila={filas[yo]} puesto={yo} maximo={maximo} />
        </>
      )}
    </View>
  );
}

function Fila({ fila, puesto, maximo }: { fila: FilaRanking; puesto: number; maximo: number }) {
  return (
    <View
      style={[estilos.fila, fila.soyYo && estilos.yo]}
      accessible
      accessibilityLabel={`Puesto ${puesto + 1}: ${fila.nombre}${fila.soyYo ? ' (vos)' : ''}, ${formatoDuracion(fila.horas * 3_600_000)}`}>
      <Texto variante="subtitulo" color={Colores.blanco} style={estilos.puesto}>
        {MEDALLAS[puesto] ?? `${puesto + 1}`}
      </Texto>
      <View style={estilos.datos}>
        <View style={estilos.titulo}>
          <Texto variante="subtitulo" color={Colores.blanco} numberOfLines={1} style={estilos.nombre}>
            {fila.nombre}
            {fila.soyYo ? ' (vos)' : ''}
          </Texto>
          <Texto variante="subtitulo" color={Colores.blanco}>
            {formatoDuracion(fila.horas * 3_600_000)}
          </Texto>
        </View>
        <BarraProgreso progreso={maximo > 0 ? fila.horas / maximo : 0} alto={8} />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  lista: {
    gap: Espacio.s,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.m - 4,
    padding: Espacio.s + 2,
    borderRadius: 16,
  },
  yo: {
    backgroundColor: 'rgba(255,200,61,0.18)',
  },
  puesto: {
    width: 32,
    textAlign: 'center',
  },
  datos: {
    flex: 1,
    gap: 6,
  },
  titulo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Espacio.s,
  },
  nombre: {
    flex: 1,
  },
  centrado: {
    textAlign: 'center',
  },
});
