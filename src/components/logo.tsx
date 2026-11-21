import { Link } from 'expo-router';
import type { ComponentProps } from 'react';
import { Platform } from 'react-native';

import { Texto } from '@/components/texto';

type Props = Omit<ComponentProps<typeof Texto>, 'variante' | 'children'> & {
  /** Muestra el brotecito antes del nombre. */
  conIcono?: boolean;
};

/**
 * El logo "Brote". En la web es un link a la página de inicio; en el celular, solo el texto
 * (la página de inicio es para la web).
 */
export function Logo({ conIcono = false, ...resto }: Props) {
  const texto = (
    <Texto variante="marca" {...resto}>
      {conIcono ? '🌱 Brote' : 'Brote'}
    </Texto>
  );
  if (Platform.OS !== 'web') return texto;
  return (
    <Link href="/inicio" accessibilityLabel="Ir al inicio de Brote">
      {texto}
    </Link>
  );
}
