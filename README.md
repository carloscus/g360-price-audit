# G360 Price Audit - Comparador de Precios y Simulador de Márgenes

> Aplicación corporativa para el levantamiento competitivo de precios y simulación de rentabilidad en la cadena de valor. Forma parte de la familia de microherramientas **G360** para apoyo CRM y gestión estratégica de precios.

[![React](https://img.shields.io/badge/React_19-61DAFB?style=flat&logo=react)](https://es.react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5.9-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite_7-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS_3.4-06B6D4?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Tabla de Contenidos

- [Descripción](#-descripción)
- [Características](#-características)
- [Flujo de Trabajo](#-flujo-de-trabajo)
- [Tecnologías](#-tecnologías)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación y Desarrollo](#-instalación-y-desarrollo)
- [Guía de Usuario](#-guía-de-usuario)
- [Guía para Diapositivas](#-guía-para-diapositivas)
- [Modelo de Negocio](#-modelo-de-negocio)
- [Configuración](#-configuración)
- [Ecosistema G360](#-ecosistema-g360)
- [Licencia](#-licencia)

---

## 📋 Descripción

**G360 Price Audit** (CIPSA) es una herramienta web diseñada para transformar el levantamiento de precios en campo en una herramienta de decisión estratégica. Permite a la fuerza de ventas capturar datos en tiempo real y a la jefatura simular escenarios de rentabilidad interna mediante exportaciones dinámicas a Excel con fórmulas vivas.

**Workflow central:** `Comparador → Slide-over (simular márgenes) → Agregar al Informe → Exportar XLSX`

Todo en una sola página: el vendedor levanta precios, simula propuestas en el slide-over, confirma, y exporta un XLSX unificado para jefatura.

---

## ✨ Características

| Módulo | Descripción |
|--------|-------------|
| **Comparador de Precios** | Compara precios entre tu marca y hasta 5 competidores con variaciones porcentuales automáticas |
| **Simulador de Márgenes** | Panel lateral (slide-over) para simular propuestas comerciales con validación de "Ranking de Estante" |
| **Reporte para Jefatura** | Hoja secundaria en Excel con Costo de Fábrica, Margen de Protección mínimo y alertas semáforo |
| **Exportación XLSX Robusta** | Celdas editables con formato condicional que sobreviven a pegados masivos (Ctrl+V) |
| **Persistencia local** | Datos de costo y propuestas persisten en localStorage entre sesiones |
| **Carga Masiva** | Importación mediante plantilla Excel para poblar el comparador con cientos de registros en segundos |
| **Identidad EAN13** | Integración total con códigos de barras de 13 dígitos para sincronización con ERPs corporativos |

---

## 🔄 Flujo de Trabajo

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────────┐     ┌──────────────┐
│  COMPARADOR │ ──→ │  SLIDE-OVER     │ ──→ │  AGREGAR AL     │ ──→ │  EXPORTAR    │
│  (precios)  │     │  (simular mg)   │     │  INFORME        │     │  XLSX        │
└─────────────┘     └─────────────────┘     └──────────────────┘     └──────────────┘
```

---

## 🚀 Tecnologías

### Frontend
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| React | 19.x | Biblioteca de interfaz de usuario |
| TypeScript | 5.9 | Tipado estático |
| Vite | 7.x | Build tool y servidor de desarrollo |
| Tailwind CSS | 3.4 | Estilos utilitarios + CSS variables |
| Zustand | 5.x | Gestión de estado con persistencia localStorage |
| React Router DOM | 7.x | Navegación SPA |
| Recharts | 3.x | Gráficos interactivos (barras, pastel) |
| React Hook Form | — | Manejo de formularios |
| Zod | 4.x | Validación de esquemas tipados |
| ExcelJS | — | Generación de XLSX con fórmulas nativas |
| Lucide React | — | Iconos vectoriales |
| html2canvas | — | Captura de pantallas para exportación PNG |

---

## 📁 Estructura del Proyecto

```
g360-price-audit/
├── .github/workflows/
│   └── deploy.yml              # CI/CD GitHub Actions
├── docs/
│   └── MANUAL_USUARIO.md       # Guía de usuario para diapositivas
├── public/
│   └── data/
│       └── catalogo_productos.json  # Catálogo de productos
├── schemas/
│   ├── precios.schema.json
│   └── precios.types.ts
├── src/
│   ├── api/
│   │   └── schemas.ts
│   ├── components/
│   │   ├── comparador/         # BrandRankingChart, ComparisonBar, PriceInput,
│   │   │                       # MiniPriceChart, PricePieChart, PrintReport, etc.
│   │   ├── margen/             # MarginSlideOver (simulador de propuestas)
│   │   ├── ui/                 # Button, Modal, SearchInput, Toast, Tooltip, Select, etc.
│   │   ├── DataTable.tsx       # Tabla principal de precios
│   │   ├── ExcelJSExportButton.tsx
│   │   ├── Layout.tsx
│   │   ├── DatosGeneralesForm.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── Footer.tsx
│   │   └── LineSelectorModal.tsx
│   ├── contexts/               # AuthContext, ToastContext
│   ├── hooks/
│   │   ├── useComparadorColumns.tsx
│   │   ├── useComparadorExport.tsx
│   │   ├── useComparadorKPIs.ts
│   │   ├── useMarginSlideOver.ts
│   │   ├── useSearch.ts
│   │   ├── useBackendSync.ts
│   │   ├── useCatalogSync.ts
│   │   ├── useCompetitiveAnalysis.ts
│   │   ├── useFormValidation.ts
│   │   └── useToasts.ts
│   ├── pages/
│   │   ├── ComparadorPage.tsx  # Página principal (todo en una)
│   │   └── LoginPage.tsx
│   ├── store/
│   │   ├── useAppStore.ts      # Estado global (productos, precios, marcas)
│   │   └── useMarginStore.ts   # Estado de márgenes con persistencia
│   ├── styles/
│   │   ├── design-system.css   # CSS variables G360, slide-over animations
│   │   ├── input-system-enhanced.css
│   │   └── print-report.css
│   ├── utils/
│   │   ├── excelJsGenerator.ts # Generador XLSX unificado con fórmulas
│   │   ├── comparisonUtils.ts  # Cálculos de variación porcentual
│   │   ├── priceCalculations.ts
│   │   ├── calculationUtils.ts
│   │   ├── api.ts, config.ts, colorScheme.ts, normalize.ts
│   │   ├── downloadBlob.ts, htmlSnapshot.ts, sessionCache.ts
│   │   └── indexedDb.ts
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── interfaces.ts
│   ├── enums.ts
│   └── vite-env.d.ts
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
└── vite.config.ts
```

---

## 🛠️ Instalación y Desarrollo

### Requisitos Previos

| Requisito | Versión |
|-----------|---------|
| Node.js | 24.x (verificado con v24.14.0) |
| npm | 9.x o superior |

### Instalación Local

```bash
# Clonar el repositorio
git clone <repositorio>
cd g360-price-audit

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
# Abrir en → http://localhost:5174
```

### Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor de desarrollo (Vite) |
| `npm run build` | Compila para producción (`tsc -b && vite build`) |
| `npm run lint` | Ejecuta linter ESLint |
| `npm run preview` | Previsualiza build de producción |

---

## 📖 Guía de Usuario

### 1. Inicio de Sesión

1. Abra la aplicación en su navegador
2. Ingrese sus credenciales corporativas
3. Haga clic en "Iniciar Sesión"

### 2. Comparador de Precios

**Paso 1 — Datos Generales**

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| Documento | ✅ | RUC (11 dígitos) o DNI (8 dígitos) |
| Cliente | ✅ | Nombre o razón social |
| Código Cliente | ❌ | Código interno |
| Sucursal | ✅ | Seleccionar de la lista desplegable |
| Fecha | ✅ | Fecha del análisis |
| Marca 1-5 | ✅ | Hasta 5 competidores (Marca 1 = **tu marca**) |

**Paso 2 — Buscar Productos**

1. Escriba código, EAN o nombre del producto
2. Seleccione uno o varios de la lista desplegable
3. Haga clic en "Agregar X seleccionado(s)"
4. Alternativas: Elegir por línea o agregar manualmente

**Paso 3 — Tabla de Comparación**

| Código | Nombre | M1 | M2 | ... | M5 | % vs M2 | % vs M3 | Promedio | Sugerido |
|--------|--------|----|----|-----|----|---------|---------|----------|----------|
| PROD001 | Leche Evap. | 4.50 | 5.00 | ... | 4.80 | -10.0% | -6.25% | 4.77 | 4.60 |

- **% Variación**: `((PrecioBase / PrecioCompetidor) - 1) × 100`
  - Negativo = tu precio es **menor** (más competitivo)
  - Positivo = tu precio es **mayor** (menos competitivo)

### 3. Simulador de Márgenes (Slide-over)

Haga clic en el botón **Calculadora** de cualquier fila para abrir el panel lateral:

| Sección | Descripción |
|---------|-------------|
| **Actual** | Costo, precio tienda, margen actual y ranking vs competencia |
| **Propuesta 1** | Mismo costo, nuevo precio → calcula margen y ranking automático |
| **Propuesta 2** | Nuevo costo + nuevo precio → calcula margen, dif. costo, impacto % y ranking |
| **Refrescar** | Botón para actualizar precios de competencia desde la tabla sin cerrar |
| **Agregar/Actualizar** | Guarda en store persistente (indicador verde en botón Calculadora) |

### 4. Exportación XLSX Unificada

Un solo archivo con **Comparador + Margen** en la misma hoja:

- **Celdas editables** (fondo amarillo, borde punteado): precio tienda, precios competencia, costo, propuestas
- **Fórmulas vivas**: ranking, margen, dif. costo, impacto % — se recalculan al editar en Excel
- **Ranking**: Fórmula `IF(AND(comp<>"",comp<miPrecio),1,0)` por competidor

### 5. Tablero Estratégico (Hoja 2)

- **Costo Fábrica vs Mayorista**: Utilidad real empresa vs utilidad punto de venta
- **Margen de Protección**: Casilla dinámica (C2) para umbral de rentabilidad
- **Semáforo de Alerta**: Celdas se iluminan en rojo si la propuesta sacrifica margen
- **Escudo de Color**: Formato condicional que soporta Ctrl+V masivo

---

## 🎯 Guía para Diapositivas

Estructura recomendada para presentaciones del producto:

### Sección 1: Introducción (2-3 diapositivas)
- **1.1** ¿Qué es G360 Price Audit? — Herramienta corporativa para análisis estratégico de precios
- **1.2** Problema que resuelve — Levantamiento manual en campo, falta de visibilidad de rentabilidad
- **1.3** Beneficios clave — Toma de decisiones basada en datos, exportación unificada, simulación en tiempo real

### Sección 2: Arquitectura Técnica (2-3 diapositivas)
- **2.1** Tech Stack — React 19 + TypeScript 5.9 + Vite 7 + Tailwind 3.4
- **2.2** Ecosistema G360 — Familia de microherramientas, skill corporativo-g360
- **2.3** Flujo de datos — Catálogo JSON → Store Zustand → Excel export con fórmulas vivas

### Sección 3: Funcionalidades Core (5-7 diapositivas)
- **3.1** Comparador de Precios — UI de tabla, búsqueda de productos, hasta 5 competidores
- **3.2** Dashboard Visual — Gráficos Recharts (barras, pastel), KPIs, win rate
- **3.3** Simulador de Márgenes — Slide-over con Propuesta 1 / Propuesta 2, ranking automático
- **3.4** Carga Masiva — Plantilla Excel para importación rápida
- **3.5** Exportación XLSX — Celdas editables, fórmulas vivas, escudo de color

### Sección 4: Modelo de Negocio (2-3 diapositivas)
- **4.1** Cadena de valor: Fabricante → Mayorista → Tienda
- **4.2** Fórmulas clave: Margen %, Markup %, Ranking, Impacto %
- **4.3** Tablero Estratégico: Costo fábrica, margen de protección, semáforo

### Sección 5: Demo en Vivo (3-4 diapositivas)
- **5.1** Login e ingreso de datos generales
- **5.2** Búsqueda de productos y llenado de precios
- **5.3** Simulación de propuesta comercial en slide-over
- **5.4** Exportación a Excel y análisis de resultados

### Sección 6: Cierre (1-2 diapositivas)
- **6.1** Próximos pasos — Roadmap, integraciones planeadas
- **6.2** Q&A — Preguntas y respuestas

> 💡 **Tip para presentadores:** Use el modo oscuro de la aplicación para capturas de pantalla más profesionales. Los gráficos de Recharts (BrandRankingChart, PricePieChart) están diseñados con la paleta corporativa G360 para coherencia visual.

---

## 💼 Modelo de Negocio

```
Fabricante → Mayorista → Tienda
                ↑
          Vendedor (usuario)
```

| Concepto | Definición |
|----------|------------|
| **Costo** | Precio de venta del fabricante al mayorista |
| **Precio Tienda** | Precio que cobra la tienda al consumidor final |
| **Margen %** | `(Precio Tienda - Costo) / Precio Tienda × 100` |
| **Ranking** | 1 + cantidad de competidores con precio menor (1 = más barato = mejor) |
| **Impacto %** | `(P2 Costo - Costo) / Costo` (cambio con Propuesta 2) |

---

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz:

```env
VITE_API_URL=http://localhost:5000
VITE_APP_TITLE=CIPSA Análisis de Precios
```

### Catálogo de Productos

`public/data/catalogo_productos.json`:

```json
[
  {
    "codigo": "PROD001",
    "cod_ean": "1234567890123",
    "nombre": "Producto de Ejemplo",
    "linea": "Línea A",
    "peso": 1.5,
    "stock_referencial": 100,
    "precio_referencial": 25.00,
    "cantidad_por_caja": 12,
    "keywords": ["producto", "ejemplo"]
  }
]
```

### Esquemas de Validación

Los esquemas Zod en `src/interfaces.ts` y `schemas/precios.types.ts` definen la forma de los datos. Usar `g360 audit` para verificar compliance.

---

## 🌐 Ecosistema G360

Este proyecto forma parte de la familia de microherramientas **G360** para apoyo CRM y gestión de datos en escritorio.

### Skill Activo: `corporativo-g360`

| Token | Color | Uso |
|-------|-------|-----|
| `--color-primary-500` | `#1a56db` | Azul Marino corporativo (primario) |
| `--color-primary-800` | `#0b225a` | Header login / fondo oscuro |
| `--color-mi-marca` | `#f97316` | Naranja Vinifan (tu marca) |
| `--color-secondary-500` | `#627d98` | Gris corporativo secundario |
| `--color-accent-500` | `#ef4444` | Rojo corporativo (acento) |
| `--color-success-500` | `#22c55e` | Éxito / positivo |
| `--color-warning-500` | `#f59e0b` | Advertencia |
| `--color-error-500` | `#ef4444` | Error / peligro |
| Dark mode bg | `#0c1929` | Fondo principal dark mode |

- **Signature**: `powered by G360` (modo `powered`)
- **Effects**: Glassmorphism + Blacklight Neon (dark mode). Blurs decorativos, patrones de puntos, glow en cards e inputs
- **Device**: PC desktop

### Convenciones G360 Aplicadas

| Convención | Implementación |
|------------|----------------|
| **Colores desde CSS variables** | `var(--color-primary)`, `var(--g360-accent)` |
| **Core sin UI** | Lógica de negocio en `utils/` y `store/` sin imports de React |
| **UI con Core** | Componentes importan desde `store/` y `utils/` |
| **Locale es-PE** | Moneda S/, separador de miles coma, decimal punto |
| **Naming** | PascalCase componentes, camelCase hooks/utils, kebab-case CSS |
| **Glassmorphism** | Navbar y cards con backdrop blur + superficie semi-transparente |
| **Signature** | Footer con "powered by G360" + isotipo |

### g360-cli

```bash
g360 init mi-proyecto --template web-pwa --skill corporativo-g360
g360 set-skill corporativo-g360
g360 bring brand/cipsa
g360 audit
g360 clean --all --dry-run
```

### Familia G360

> **G360 >** Microherramientas para apoyo CRM y datos en escritorio

- **Isotipo**: 3 puntos verticales paralelos (gris → verde → gris) + chevron = **G360 >**
- **Colores marca**: `#00d084` verde G360, `#94a3b8` gris
- **Signature**: `powered by G360` (modo `powered`)

| Herramienta | Descripción |
|-------------|-------------|
| [g360-cli](https://github.com/carloscus/g360-cli) | CLI de scaffolding |
| [g360-signature](https://github.com/carloscus/g360-signature) | Web component branding |
| [g360-order-xlsx](https://github.com/carloscus/g360-order-xlsx) | Procesador de cotizaciones Excel |
| [g360-precios-movil](https://github.com/carloscus/g360-precios-movil) | Variante móvil del comparador |
| [g360-discount-calculator](https://github.com/carloscus/g360-discount-calculator) | Calculadora de descuentos |
| [g360-master-data](https://github.com/carloscus/g360-master-data) | Gestión de datos maestros |

---

## 📄 Licencia

Desarrollado por **Carlos Cusi** ([ccusi@outlook.com](mailto:ccusi@outlook.com)) con asistencia de IA.

*G360 Ecosystem — CCUSI 2026*
