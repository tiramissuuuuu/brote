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
