import { useEffect, useState } from 'react';

/** La hora actual, actualizada cada segundo mientras `activo` sea true (para el cronómetro). */
export function useAhora(activo: boolean): number {
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    if (!activo) return;
    // Hasta el primer tick `ahora` puede estar atrasado; quien lo usa lo acota a 0.
    const intervalo = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(intervalo);
  }, [activo]);

  return ahora;
}
