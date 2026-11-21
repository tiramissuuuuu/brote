// Web: localStorage del navegador. Puede fallar en modo privado o si está bloqueado.
export function leer(clave: string): string | null {
  try {
    return window.localStorage.getItem(clave);
  } catch {
    return null;
  }
}

export function guardar(clave: string, valor: string): void {
  try {
    window.localStorage.setItem(clave, valor);
  } catch {
    // Sin almacenamiento disponible: la app sigue andando, pero no guarda.
  }
}

export function quitar(clave: string): void {
  try {
    window.localStorage.removeItem(clave);
  } catch {
    // Ídem.
  }
}

/** Donde Supabase guarda la sesión del usuario (para no tener que volver a entrar). */
export const almacenAuth = { getItem: leer, setItem: guardar, removeItem: quitar };
