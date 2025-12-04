# Actas Abiertas

Aplicación abierta para el conteo y validación colaborativa de las actas que definirán la presidencia de Honduras en 2025. Todo el código es público para permitir auditoría y máxima transparencia; la incorporación de cambios sigue bajo la decisión del equipo central.

## Objetivo del repositorio
- Garantizar trazabilidad y revisión pública de la lógica que procesa y valida actas.
- Permitir que observadores independientes auditen cómo se manejan los datos y los resultados.
- Facilitar herramientas comunitarias (visualización, verificación y control de calidad) alrededor de las actas oficiales.

## Stack y componentes clave
- Next.js 16 (App Router) con React 19 y TypeScript.
- Tailwind CSS v4 para estilos utilitarios.
- Clerk para autenticación/gestión de sesiones (en preparación).
- Tooling base: ESLint 9, PostCSS, configuración en `src/app` y `next.config.ts`.

## Datos y fuentes
- Las imágenes de las actas se descargaron directamente del sitio oficial del Consejo Nacional Electoral (CNE) y se mantienen sin alteraciones.
- Se usan únicamente con fines de observación ciudadana, verificación y transparencia.
- Cualquier procesamiento posterior conserva referencias a los archivos originales para que puedan ser auditados.

## Estado actual
- Proyecto inicial de Next.js (carpeta `src/app`) listo para personalizar la experiencia de conteo y validación.
- Estilos globales en `src/app/globals.css`; punto de entrada principal en `src/app/page.tsx`.
- Próximos pasos incluyen flujo de autenticación con Clerk y carga/visualización de actas.

## Desarrollo local
1) Clona el repositorio y prepara dependencias con `pnpm install` (o `npm install` si prefieres).
2) Levanta el servidor de desarrollo con `pnpm dev` y abre `http://localhost:3000`.
3) Otros scripts útiles: `pnpm build` para compilar, `pnpm start` para producción y `pnpm lint` para validar el código.

## Contribuciones y gobernanza
- El código es open source para auditarlo; no es un proyecto de contribución abierta.
- El equipo principal decidirá si y cómo aceptar aportes externos; abre issues para reportar problemas o sugerir mejoras.
- Cambios significativos deben mantener la trazabilidad de datos y respetar la fuente oficial de las actas (CNE).
