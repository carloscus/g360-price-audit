# G360 Price Audit - Comparador de Precios y Simulador de Márgenes

> Aplicación corporativa para el levantamiento competitivo de precios y simulación de rentabilidad en la cadena de valor. Forma parte de la familia de microherramientas **G360** para apoyo CRM y gestión estratégica de precios.

[![React](https://img.shields.io/badge/React_19-61DAFB?style=flat&logo=react)](https://es.react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5.9-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite_7-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS_3.4-06B6D4?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=flat&logo=pwa)](https://web.dev/progressive-web-apps/)
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
| **Comparador de Precios** | Compara precios entre tu marca y hasta 5 competidores. Fórmula canónica `1 − comp/propio` (dscto requerido), verificada contra el prototipo XLSX "Prisma Comercial" |
| **Búsqueda de Clientes** | Autocompletado del maestro de clientes desde Supabase (RUC, código o nombre). Al seleccionar llena Cliente + Documento + Cód.Cliente. Degrada a texto libre sin configuración |
| **Métricas de Vista Rápida** | Franja de KPIs: productos comparados, SKUs con precio ganado, posición promedio y margen promedio |
| **Simulador de Márgenes** | Panel lateral (slide-over) para simular propuestas comerciales con validación de "Ranking de Estante" |
| **Reporte para Jefatura** | Hoja secundaria en Excel con Costo de Fábrica, Margen de Protección mínimo y alertas semáforo |
| **Exportación XLSX Robusta** | Celdas editables con formato condicional que sobreviven a pegados masivos (Ctrl+V). Sheet 2 "Tablero de Decisión" con 25 columnas agrupadas en 6 bloques, fórmulas vivas y STATUS multicondición |
| **Progressive Web App** | Service worker con precaché de assets, manifest con iconos maskable, instalable en dispositivos móviles y desktop |
| **Responsive Mobile** | Cards en móvil con filas por competidor (sin scroll horizontal), análisis individual accesible; captura de campo 100% directa |
| **Snapshot HTML** | Exportación a HTML A4 con gráficos y KPIs visibles, ideal para imprimir |
| **Persistencia local** | Datos de costo y propuestas persisten en localStorage entre sesiones |
| **Carga Masiva** | Plantilla Excel con solicitud de los nombres de las 5 marcas (sincronizadas al comparador) |
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
| Recharts | 3.x | Gráficos interactivos (barras) |
| Zod | 4.x | Validación de esquemas tipados |
| Supabase JS | 2.x | Búsqueda de clientes (maestro en tabla `ventas`) |
| ExcelJS | — | Generación de XLSX con fórmulas nativas |
| Lucide React | — | Iconos vectoriales |
| html2canvas | — | Captura de pantallas para exportación PNG |
| vite-plugin-pwa | 1.x | Service worker + manifest para PWA |

---

## 📁 Estructura del Proyecto

```
g360-price-audit/
├── .github/workflows/
│   └── deploy.yml                  # CI/CD GitHub Actions
├── docs/
│   ├── MANUAL_USUARIO.md           # Guía de usuario completa
│   └── supabase_clientes_view.sql  # Vista materializada + índices para búsqueda de clientes
├── public/
│   └── data/
│       └── catalogo_productos.json # Catálogo de productos (JSON)
├── schemas/
│   ├── precios.schema.json         # Schema JSON de validación
│   └── precios.types.ts            # Tipos TypeScript generados
├── src/
│   ├── api/
│   │   └── schemas.ts              # Esquemas de exportación (Inventario, Pedido, Precios)
│   ├── assets/
│   │   └── brand/cipsa/            # Assets de marca CIPSA (logotipos SVG/PNG)
│   ├── components/
│   │   ├── comparador/             # Secciones de la página: ComparadorHeader, ComparadorSearchSection,
│   │   │                           # ComparadorTableSection, AnalisisIndividualSection, ComparadorDashboardSection,
│   │   │                           # ComparadorQuickMetrics, BrandRankingChart, BulkImportButton, TemplateBrandsModal,
│   │   │                           # MobilePriceRow, PriceBarChart, PriceInput, ProductAnalysisCard, ProductBarChartModal
│   │   ├── margen/                 # MarginSlideOver (simulador de propuestas)
│   │   ├── ui/                     # Button, Modal, KPICard, ClienteSearchInput, SearchInput, Toast, Tooltip, Select
│   │   ├── DataTable.tsx           # Tabla principal de precios
│   │   ├── ExcelJSExportButton.tsx # Botón de exportación XLSX
│   │   ├── Layout.tsx              # Layout principal con navbar
│   │   ├── DatosGeneralesForm.tsx  # Formulario de datos generales
│   │   ├── ErrorBoundary.tsx       # Manejo de errores global
│   │   ├── Footer.tsx              # Footer con firma G360
│   │   └── LineSelectorModal.tsx   # Modal de selección por línea
│   ├── contexts/
│   │   ├── AuthContext.tsx         # Autenticación: contexto + hook useAuth + AuthProvider
│   │   └── ToastContext.tsx        # Notificaciones: contexto + hook useToast + ToastProvider
│   ├── hooks/
│   │   ├── useClientes.ts          # Búsqueda de clientes (Supabase, 2 fuentes con auto-detección)
│   │   ├── useComparadorColumns.tsx # Definición de columnas de la tabla
│   │   ├── useComparadorExport.tsx  # Lógica de exportación del comparador
│   │   ├── useComparadorKPIs.ts    # Cálculo de KPIs del comparador
│   │   ├── useCompetitiveAnalysis.ts # Análisis competitivo
│   │   ├── useFormValidation.ts    # Validación de formularios
│   │   ├── useIsMobile.ts         # Detección de dispositivo móvil
│   │   ├── useMarginSlideOver.ts  # Lógica del slide-over de márgenes
│   │   └── useSearch.ts           # Búsqueda de productos
│   ├── lib/
│   │   └── supabaseClient.ts       # Cliente Supabase (null si no hay env vars)
│   ├── pages/
│   │   ├── ComparadorPage.tsx      # Página principal (orquestador de secciones)
│   │   └── LoginPage.tsx           # Página de login
│   ├── store/
│   │   ├── useAppStore.ts          # Estado global (productos, precios, marcas)
│   │   └── useMarginStore.ts       # Estado de márgenes con persistencia
│   ├── styles/
│   │   ├── design-system.css       # CSS variables G360, animaciones
│   │   ├── input-system-enhanced.css # Estilos de inputs mejorados
│   │   └── print-report.css        # Estilos para impresión
│   ├── utils/
│   │   ├── api.ts                  # Configuración de API
│   │   ├── bulkImport.ts           # Lógica de importación masiva
│   │   ├── calculationUtils.ts     # Utilidades de cálculo de márgenes
│   │   ├── cn.ts                   # Utility para concatenar clases
│   │   ├── colorScheme.ts          # Paleta de colores por marca
│   │   ├── comparisonUtils.ts      # Comparación con fórmula canónica (priceCalculations)
│   │   ├── config.ts               # Configuración general
│   │   ├── downloadBlob.ts         # Utilidad para descargar archivos
│   │   ├── excelJsGenerator.ts     # Generador XLSX con fórmulas vivas
│   │   ├── htmlSnapshot.ts         # Exportación a HTML
│   │   ├── indexedDb.ts            # Persistencia en IndexedDB
│   │   ├── normalize.ts            # Normalización de datos
│   │   ├── priceCalculations.ts    # FÓRMULA CANÓNICA: calculateDsctoRequerido
│   │   └── sessionCache.ts         # Caché de sesión
│   ├── App.tsx                     # Router principal
│   ├── enums.ts                    # Enums (ModuleType)
│   ├── index.css                   # Estilos globales
│   ├── interfaces.ts               # Interfaces y schemas Zod
│   ├── main.tsx                    # Punto de entrada
│   ├── toastDefinitions.ts         # Definiciones de notificaciones
│   └── vite-env.d.ts               # Tipos de Vite + env vars
├── .env.example                    # Plantilla de variables de entorno
├── .gitignore
├── AGENTS.md                       # Convenciones del proyecto para agentes IA
├── eslint.config.js                # Configuración ESLint
├── g360-manifest.json              # Manifesto G360 del proyecto
├── index.html                      # HTML de entrada
├── package.json
├── postcss.config.js
├── skill.json                      # Configuración de skill G360
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts                  # Configuración Vite + PWA
```

---

## 🛠️ Instalación y Desarrollo

### Requisitos Previos

| Requisito | Versión |
|-----------|---------|
| Node.js | 22.x |
| npm | 10.x o superior |

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
| Cliente | ✅ | **Un solo campo de búsqueda** (RUC, código o nombre con autocompletado desde Supabase). Al seleccionar muestra una tarjeta con los datos y llena Documento y Cód.Cliente automáticamente |
| Documento / Cód.Cliente | auto | En modo búsqueda no aparecen en el formulario: se rellenan al elegir cliente. Sin Supabase configurado: campos manuales |
| Sucursal | ✅ | **Siempre manual** (decisión de producto: no autocompletar) |
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
| PROD001 | Leche Evap. | 4.50 | 5.00 | ... | 4.80 | +10.0% | +6.25% | 4.77 | 4.60 |

- **% Variación** (fórmula canónica, validada contra el prototipo XLSX): `1 − (PrecioCompetidor / PrecioPropio)`
  - Positivo = el competidor es **más barato** → hay que descontar para igualarlo (barra roja)
  - Negativo = tu precio es **menor** → estás ganando (barra verde)
  - Es el descuento requerido sobre tu precio para igualar al competidor
- **Navegación por teclado en búsqueda de cliente**: `↑↓` navegar · `Enter` seleccionar · `Esc` cerrar

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

### 5. Carga Masiva de Productos

Permite importar decenas de productos con sus precios en segundos usando una plantilla Excel.

**Cómo funciona:**

1. **Solicitar marcas**: Haga clic en "Plantilla" → se abre un modal para ingresar los nombres de las 5 marcas (Marca 1 obligatoria = tu marca; mínimo 2 completadas). Las marcas se sincronizan con el comparador. *(Solo desktop; en campo se captura directo en la app)*
2. **Descargar plantilla**: Al confirmar se genera el Excel con una columna por marca
3. **Llenar el Excel**:

   | SKU | PRECIO_TIENDA | PRECIO_<MARCA2> | PRECIO_<MARCA3> | ... |
   |-----|---------------|-----------------|-----------------|-----|
   | Código del producto | Precio en tu marca (M1) | Precio competidor 2 | Precio competidor 3 | ... |

   - `SKU`: código del producto (debe existir en el catálogo)
   - `PRECIO_TIENDA`: se mapea automáticamente a tu marca (Marca 1)
   - `PRECIO_<MARCA>`: columnas dinámicas según los nombres de marca configurados
   - Si hay marcas duplicadas se generan sufijos numéricos (ej. `PRECIO_VINIFAN2`)

4. **Importar**: Haga clic en "Cargar Excel" y seleccione el archivo
5. **Resultado**: Los productos aparecen en la tabla con sus precios. Los precios existentes se conservan y se mezclan con los nuevos

**Notas:**
- Solo se importan productos que existen en el catálogo (por SKU)
- Los valores numéricos aceptan tanto `0` como `0.00`
- La columna SKU debe estar en formato texto si tiene ceros a la izquierda

### 6. Tablero Estratégico (Sheet 2 del XLSX)

Comparación directa **Actual vs Propuesta P2** con 25 columnas agrupadas en 6 bloques visuales:

| Bloque | Columnas |
|--------|----------|
| **Info** | SKU, PRODUCTO |
| **Inputs Jefatura** | COSTO FÁBRICA (EDITABLE), % UTILIDAD MÍNIMA (EDITABLE) |
| **Actual** | COSTO MAYORISTA ACT., P. TIENDA ACT., MARGEN MAYORISTA ACT., MARGEN CLIENTE ACT. |
| **Propuesta P2** | P2 COSTO MAYORISTA, P2 PRECIO TIENDA, CANTIDAD MÍNIMA, MARGEN MAYORISTA P2, MARGEN CLIENTE P2 |
| **Evaluación** | UTILIDAD UNIDAD ACT./P2, UTILIDAD TOTAL ACT./P2, VAR. UTILIDAD (S/ y %), PRECIO MÍN. FINANCIERO, DESVIACIÓN VS MÍN., PVP MÍNIMO MERCADO, INVERSIÓN COMERCIAL, VOL. EQUILIBRIO |
| **Resultado** | STATUS (🛑 🔴 🟡 🟢 con lógica multicondición) |

**STATUS** evalúa 4 condiciones en orden:
1. 🛑 `P2 < Costo Fábrica` → Rechazado
2. 🔴 `Margen P2 < Utilidad Mínima` → Rechazar
3. 🟡 `Utilidad cae >60%` o `Vol. Equilibrio > Compromiso` → Revisar
4. 🟢 Todo ok → Aprobar

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
- **3.2** Dashboard Visual — Gráficos Recharts (barras), KPIs, win rate
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

> 💡 **Tip para presentadores:** Use el modo oscuro de la aplicación para capturas de pantalla más profesionales. Los gráficos de Recharts (BrandRankingChart, PriceBarChart) están diseñados con la paleta corporativa G360 para coherencia visual.

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

Crea un archivo `.env` en la raíz (ver `.env.example`):

```env
VITE_BACKEND_URL=http://localhost:5001

# Búsqueda de clientes (opcional: sin esto el campo Cliente es texto libre)
VITE_SUPABASE_URL=https://<proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

### Búsqueda de Clientes (Supabase)

La búsqueda consulta la tabla `ventas` (maestro de clientes embebido, mismo esquema que `g360-order-xlsx`). Para búsqueda instantánea por nombre, ejecuta `docs/supabase_clientes_view.sql` en el SQL Editor de Supabase: crea una vista materializada `clientes` con índices trgm y el hook la detecta automáticamente.

| Fuente | Detectada por | Velocidad |
|--------|---------------|-----------|
| Vista `clientes` (recomendada) | Query exitoso a la vista | Milisegundos (índice trgm, búsqueda "contiene") |
| Tabla `ventas` (fallback) | Vista inexistente | Rápido por código/RUC (`eq` indexado); por nombre sujeto a timeouts del escaneo |

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

Desarrollado por **Carlos Cusi Clares** ([carlos.cusiclares@gmail.com](mailto:carlos.cusiclares@gmail.com)) con asistencia de IA.

*G360 Ecosystem — CCUSI 2026*
