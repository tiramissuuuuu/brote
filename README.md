# brote 🌱

Cada materia de la facultad es una planta: cuanto más estudiás, más crece.

Hecha con [Expo](https://expo.dev) (React Native), así que el mismo código corre en web, iOS y Android.

## Cómo correrlo

Necesitás [Node.js](https://nodejs.org) (versión LTS).

```bash
npm install
npm run web
```

Se abre en el navegador en http://localhost:8081.

Para probarla en el celular: instalá **Expo Go** desde la App Store o Google Play, corré `npx expo start` y escaneá el código QR (el celular y la computadora tienen que estar en la misma red Wi‑Fi).

## Cómo funciona

- **Meta de horas:** créditos × 15, porque en la UdelaR 1 crédito equivale a 15 horas de trabajo (clases y estudio). Se puede cambiar al crear la materia.
- **La planta crece** según horas estudiadas / meta: semilla → brote → plantita → planta joven → arbolito → en flor → ¡florecida!
- **El cronómetro guarda la hora de inicio**, no un contador, así no se pierde tiempo si se cierra la app o se recarga la página.
- **Los datos quedan en el dispositivo** (localStorage del navegador en web, SQLite en el celular). Todavía no hay cuentas ni servidor.

## Estructura

```
src/
  app/                  Pantallas (Expo Router: cada archivo es una ruta)
    _layout.tsx         Navegación
    index.tsx           El jardín (todas las materias)
    nueva.tsx           Crear materia
    materia/[id].tsx    Detalle de una materia con el cronómetro
  components/
    planta.tsx          El dibujo de la planta (SVG), según el progreso
    tarjeta-materia.tsx Tarjeta del jardín
    boton.tsx, barra-progreso.tsx
  lib/
    brote.ts            Tipos y cálculos (progreso, etapas, formatos)
    almacenamiento.ts   Guardar datos en iOS/Android
    almacenamiento.web.ts  Guardar datos en web
  state/jardin.tsx      Estado global: materias, sesiones y sesión en curso
  hooks/use-ahora.ts    Reloj que se actualiza cada segundo
```

## Antes de subir cambios

```bash
npx tsc --noEmit
npx expo lint
```
