import { useEffect, useState } from 'react';

/**
 * La hora actual, que se actualiza sola:
 * - cada segundo si hay una sesión en curso (para el cronómetro);
 * - cada minuto si no (para que el lunes la semana cambie sin recargar).
 */
export function useAhora(sesionEnCurso: boolean): number {
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    // Hasta el primer tick `ahora` puede estar un poco atrasado; quien lo usa lo acota a 0.
    const intervalo = setInterval(() => setAhora(Date.now()), sesionEnCurso ? 1000 : 60_000);
    return () => clearInterval(intervalo);
  }, [sesionEnCurso]);

  return ahora;
}
