import { useWindowDimensions } from 'react-native';

/** Desde este ancho (en píxeles) se usa el diseño de computadora. */
export const ANCHO_ESCRITORIO = 900;
/** Ancho de la barra lateral en computadora. */
export const ANCHO_LATERAL = 240;

/** Tamaño de la ventana y si corresponde el diseño de computadora (barra lateral, dos columnas). */
export function useDisposicion() {
  const { width, height } = useWindowDimensions();
  return { ancho: width, alto: height, escritorio: width >= ANCHO_ESCRITORIO };
}
