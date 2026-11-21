import { useRouter } from 'expo-router';

import { useJardin } from '@/state/jardin';

/**
 * Lo que hace el botón de Estudiar (en la barra de abajo o en la lateral):
 * si hay una sesión en curso la abre; si no, pregunta qué estudiar (o pide plantar la primera materia).
 */
export function useEstudiar() {
  const router = useRouter();
  const { materias, activa } = useJardin();

  const estudiar = () => {
    if (activa) router.push({ pathname: '/materia/[id]', params: { id: activa.materiaId } });
    else if (materias.length > 0) router.push('/estudiar');
    else router.push('/nueva');
  };

  return { estudiar, regando: activa !== null };
}
