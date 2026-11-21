// iOS y Android: localStorage respaldado por SQLite (lo provee expo-sqlite).
// En web se usa almacenamiento.web.ts, que usa el localStorage del navegador.
import 'expo-sqlite/localStorage/install';

export function leer(clave: string): string | null {
  return globalThis.localStorage.getItem(clave);
}

export function guardar(clave: string, valor: string): void {
  globalThis.localStorage.setItem(clave, valor);
}

export function quitar(clave: string): void {
  globalThis.localStorage.removeItem(clave);
}

/** Donde Supabase guarda la sesión del usuario (para no tener que volver a entrar). */
export const almacenAuth = { getItem: leer, setItem: guardar, removeItem: quitar };
