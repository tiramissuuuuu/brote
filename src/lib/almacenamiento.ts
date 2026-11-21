// iOS y Android: localStorage respaldado por SQLite (lo provee expo-sqlite).
// En web se usa almacenamiento.web.ts, que usa el localStorage del navegador.
import 'expo-sqlite/localStorage/install';

export function leer(clave: string): string | null {
  return globalThis.localStorage.getItem(clave);
}

export function guardar(clave: string, valor: string): void {
  globalThis.localStorage.setItem(clave, valor);
}
