# AGENTS.md — g360-price-audit

App de auditoría de precios (React 19 + Vite + TS + Tailwind + zustand + ExcelJS).

## Comandos

- Dev: `npm run dev` · Build: `npm run build` (tsc -b && vite build) · Lint: `npm run lint`

## Convenciones de código

- **Idioma**: código técnico en inglés; términos de dominio del negocio en
  español completo (cliente, competidor, marca, descuento). En nombres
  nuevos usar `descuento`, no abreviaturas como `dscto`.
- **Componentes**: PascalCase, nombre por propósito (nunca sufijos de
  historia tipo "Refactor"/"Nuevo").
- **Hooks**: `useX` en `src/hooks`, un archivo por hook, extensión `.ts`
  salvo que rendericen JSX (`.tsx`).
- **Stores**: `useXStore` (zustand + `persist` cuando aplica).
- **Schemas**: zod en `src/interfaces.ts` como fuente única; extensiones por
  módulo en `src/api/schemas.ts`.
- **UI**: tokens CSS del design system (`var(--...)`), sin colores
  hardcodeados; exports públicos de `ui/` por el barrel `ui/index.ts`.
- **Toasts**: único sistema = `useToast()` de `contexts/ToastContext.tsx`
  (el provider tiene estado + contenedor).
- **Fórmulas de precios**: únicamente desde
  `src/utils/priceCalculations.ts`; la fórmula canónica de comparación es
  `calculateDsctoRequerido` = `1 − precioCompetidor/precioPropio`
  (positivo = hay que descontar). Verificada contra el prototipo XLSX
  "Prisma Comercial" (hoja PPvta Competencia).

## Supabase (búsqueda de clientes)

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (ver `.env.example`).
  Sin configuración, el campo Cliente degrada a captura manual.
- Al seleccionar un cliente se autocompletan solo Cliente, Documento y
  Cód.Cliente. **Sucursal siempre manual** (decisión de producto: no
  autocompletar).

## Verificación de fórmulas fuera del build

- Compilar utils aisladas con esbuild (`node_modules/esbuild`) y probarlas
  con Node contra valores del XLSX prototipo (ej: VNF 9.5 vs ARTESCO 8 →
  0.1579).
