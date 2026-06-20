# Manual de Usuario - CIPSA Análisis de Precios

> **Guía completa para el uso de la aplicación de comparación de precios y cálculo de márgenes**

---

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Primeros Pasos](#primeros-pasos)
3. [Análisis Competitivo de Precios](#análisis-competitivo-de-precios)
4. [Calculadora de Márgenes](#calculadora-de-márgenes)
5. [Exportación de Informes](#exportación-de-informes)
6. [Funciones Avanzadas](#funciones-avanzadas)
7. [Solución de Problemas](#solución-de-problemas)

---

## 1. Introducción

### 1.1 ¿Qué es CIPSA?

**CIPSA Análisis de Precios** es una herramienta web diseñada para:

- **Comparar precios** entre tu marca y hasta 5 competidores
- **Calcular márgenes** de ganancia y markup de productos
- **Generar informes** visuales para presentaciones
- **Tomar decisiones** comerciales basadas en datos

### 1.2 Requisitos del Sistema

| Requisito | Mínimo | Recomendado |
|-----------|--------|-------------|
| Navegador | Chrome 90+, Firefox 88+, Edge 90+ | Chrome 100+ |
| Resolución | 1280x720 | 1920x1080 |
| Conexión | Internet para cargar catálogos | - |

### 1.3 Navegación Principal

La aplicación tiene dos módulos principales accesibles desde la barra de navegación:

```
┌─────────────────────────────────────────────────────────────┐
│  CIPSA Análisis de Precios          [Usuario ▼]            │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ Análisis        │  │ Análisis de     │                   │
│  │ Competitivo ●   │  │ Margen          │                   │
│  └─────────────────┘  └─────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Primeros Pasos

### 2.1 Iniciar Sesión

1. Abra la aplicación en su navegador
2. Ingrese sus credenciales
3. Haga clic en "Iniciar Sesión"

### 2.2 Interfaz General

```
┌──────────────────────────────────────────────────────────────┐
│ [Logo] CIPSA Análisis de Precios           [Usuario] [Cerrar]│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              PÁGINA DE BIENVENIDA                       │  │
│  │                                                          │  │
│  │   ┌─────────────┐    ┌─────────────┐                    │  │
│  │   │  COMPARADOR │    │  CALCULADORA│                    │  │
│  │   │   DE PRECIOS│    │   DE MARGEN │                    │  │
│  │   └─────────────┘    └─────────────┘                    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 2.3 Cambiar Tema (Claro/Oscuro)

Haga clic en el ícono de sol/luna en la esquina superior derecha para alternar entre modo claro y modo oscuro.

---

## 3. Análisis Competitivo de Precios

### 3.1 Flujo de Trabajo

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ 1. Datos    │ →  │ 2. Buscar   │ →  │ 3. Ingresar │ →  │ 4. Exportar│
│ Generales   │    │ Productos   │    │ Precios     │    │ Resultados │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### 3.2 Paso 1: Datos Generales

Complete los siguientes campos en la sección "Datos Generales":

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| Documento | ✅ | RUC (11 dígitos) o DNI (8 dígitos) |
| Cliente | ✅ | Nombre o razón social |
| Código Cliente | ❌ | Código interno del cliente |
| Sucursal | ✅ | Seleccionar de la lista |
| Fecha | ✅ | Fecha del análisis |
| Marca 1-5 | ✅ | Nombres de competidores |

**Nota**: La "Marca 1" es SU marca (precio base para comparaciones)

### 3.3 Paso 2: Buscar Productos

1. Haga clic en el campo de búsqueda
2. Escriba el código, EAN o nombre del producto
3. Seleccione uno o varios productos de la lista
4. Haga clic en "Agregar X seleccionado(s)"

**Opciones adicionales**:
- **Elegir línea**: Seleccione productos por categoría/línea
- **Agregar manualmente**: Cree un producto nuevo si no existe en el catálogo

### 3.4 Paso 3: Tabla de Comparación

La tabla de comparación contiene las siguientes columnas:

```
┌────────┬──────────┬────────┬────────┬─────────┬─────────┬──────────┬──────────┬─────────┐
│Código  │Nombre    │Marca 1│Marca 2│...Marca5│% vs M2  │% vs M3   │Precio    │Precio   │
│        │          │(Precio)│(Precio)│        │         │         │Promedio │Sugerido │
├────────┼──────────┼────────┼────────┼─────────┼─────────┼──────────┼──────────┼─────────┤
│PROD001 │Producto A│ 25.00 │ 28.00 │  26.00  │ -10.7%  │ -3.8%   │  26.33  │  26.00  │
└────────┴──────────┴────────┴────────┴─────────┴─────────┴──────────┴──────────┴─────────┘
```

#### Columnas Explicadas:

- **Código**: Identificador único del producto
- **Nombre**: Descripción del producto
- **Marca 1-5**: Precios de cada competidor (editables)
- **% vs Marca**: Variación porcentual vs cada competidor
- **Precio Promedio**: Media aritmética de precios
- **Precio Sugerido**: Precio recomendado (editable)
- **% Ajuste a Sugerido**: Diferencia entre precio base y sugerido

### 3.5 Cálculos Automáticos

La aplicación calcula automáticamente:

```
┌────────────────────────────────────────────────────────────────────────┐
│                    FÓRMULAS UTILIZADAS                                  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Precio Promedio = (Precio1 + Precio2 + ... + PrecioN) / N             │
│                                                                        │
│  % Variación = ((PrecioBase / PrecioCompetidor) - 1) × 100            │
│                                                                        │
│  Ejemplo:                                                              │
│  - PrecioBase = S/25.00                                                │
│  - PrecioCompetidor = S/28.00                                          │
│  - Variación = ((25/28) - 1) × 100 = -10.71%                          │
│                                                                        │
│  Interpretación:                                                       │
│  - Valor NEGATIVO = Tu precio es MENOR (más competitivo)              │
│  - Valor POSITIVO = Tu precio es MAYOR (menos competitivo)             │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.6 Análisis Visual

#### Dashboard de Comparación

El dashboard muestra métricas clave:

```
┌─────────────────────────────────────────────────────────────────┐
│                    DASHBOARD DE COMPARACIÓN                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │   PRODUCTO   │  │   PRODUCTO   │  │  PRECIO      │            │
│  │   MÁS        │  │   MÁS        │  │  WIN RATE    │            │
│  │   BARATO     │  │   CARO       │  │              │            │
│  │  S/ 22.50    │  │  S/ 35.00    │  │    65%      │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         GRÁFICO DE DISTRIBUCIÓN DE PRECIOS               │   │
│  │                                                          │   │
│  │            ┌────────┐                                     │   │
│  │           /   35%   \                                    │   │
│  │          │  Mi Marca   │   ← Marca más económica         │   │
│  │           \   25%   /                                    │   │
│  │            └────────┘                                     │   │
│  │              Comp 1  Comp 2                                │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Tarjetas de Análisis por Producto

Cada producto tiene una tarjeta de análisis visual:

```
┌─────────────────────────────────────────┐
│  PRODUCTO: Leche Evaporada Entera       │
│  Código: LAC001                         │
├─────────────────────────────────────────┤
│  [████████░░] 75% - Mi Marca (S/4.50)  │
│  [██████████] 100% - Competidor A (S/6.00)│
│  [████████  ] 90% - Competidor B (S/5.40) │
├─────────────────────────────────────────┤
│  Posición: #2 de 3                      │
│  vs Líder: +33.3%                        │
└─────────────────────────────────────────┘
```

---

## 4. Calculadora de Márgenes

### 4.1 Acceso

Desde la barra de navegación, haga clic en "Análisis de Margen"

### 4.2 Flujo de Trabajo

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ 1. Datos    │ →  │ 2. Agregar  │ →  │ 3. Calcular │ →  │ 4. Exportar│
│ Cliente     │    │ Productos   │    │ Márgenes    │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### 4.3 Datos del Cliente

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| Documento | ✅ | RUC o DNI |
| Cliente | ✅ | Nombre o razón social |
| Código Cliente | ❌ | Código interno |

### 4.4 Agregar Productos

Igual que en el módulo de precios:
- Buscar en catálogo
- Selección por línea
- Agregar manualmente

### 4.5 Tabla de Márgenes

```
┌────────┬────────────┬────────┬────────┬────────┬────────┬──────────┬─────────┐
│Código  │ Producto   │ Costo  │ Precio │ Markup│ Margen│ Ganancia│Acciones │
├────────┼────────────┼────────┼────────┼────────┼────────┼──────────┼─────────┤
│PROD001 │Producto A │ 20.00  │ 30.00  │ 50.0% │ 33.3% │ 10.00   │   🗑️    │
│PROD002 │Producto B │ 15.00  │ 25.00  │ 66.7% │ 40.0% │ 10.00   │   🗑️    │
└────────┴────────────┴────────┴────────┴────────┴────────┴──────────┴─────────┘
```

### 4.6 Fórmulas de Cálculo

```
┌────────────────────────────────────────────────────────────────────────┐
│                    FÓRMULAS DE MÁRGEN                                   │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  MARKUP = ((Precio - Costo) / Costo) × 100                            │
│                                                                        │
│  Ejemplo:                                                              │
│  - Costo: S/20.00                                                     │
│  - Precio: S/30.00                                                     │
│  - Markup = ((30-20)/20) × 100 = 50%                                  │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  MARGEN = ((Precio - Costo) / Precio) × 100                           │
│                                                                        │
│  Ejemplo:                                                              │
│  - Costo: S/20.00                                                     │
│  - Precio: S/30.00                                                     │
│  - Margen = ((30-20)/30) × 100 = 33.3%                                │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  GANANCIA = Precio - Costo                                            │
│                                                                        │
│  Ejemplo:                                                              │
│  - Ganancia = 30 - 20 = S/10.00                                       │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.7 Aplicación Global

Para aplicar el mismo margen/markup a todos los productos:

1. Ingrese el porcentaje deseado en "Margen Global" o "Markup Global"
2. Haga clic en "Aplicar"
3. Confirme en el modal

```
┌─────────────────────────────────────────────────────────┐
│  APLICAR GLOBALMENTE                                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Margen: [30.0 %]  [Aplicar]    → Aplica a todos        │
│  Markup: [45.0 %]  [Aplicar]    → Aplica a todos        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Exportación de Informes

### 5.1 Tipos de Exportación

| Formato | Descripción | Uso |
|---------|-------------|-----|
| **PNG** | Imagen de la tabla/dashboard | Presentaciones |
| **Excel (XLSX)** | Archivo estructurado | Análisis deeper |
| **HTML** | Página web navegable | Compartir informes |

### 5.2 Exportar a PNG

**Pasos:**
1. En la tabla de comparación, haga clic en "Exportar PNG"
2. El sistema generará una imagen de alta calidad
3. Se descargará automáticamente

**Consejos:**
- Use el modo oscuro para gráficos más profesionales
- Ajuste el zoom del navegador para mejor resolución

### 5.3 Exportar a Excel

**Pasos:**
1. Haga clic en "Exportar Excel"
2. El archivo incluirá:
   - Datos generales (cliente, fecha, sucursal)
   - Tabla de productos con precios
   - Porcentajes de variación
   - Resumen de totales

### 5.4 Exportar a HTML

**Pasos:**
1. Haga clic en "Exportar HTML"
2. Se generará un archivo `.html`
3. Ábralo en cualquier navegador

**Características:**
- Navegación interactiva
- Estilos idénticos a la aplicación
- Puedes enviarlo por email

---

## 6. Funciones Avanzadas

### 6.1 Selección Múltiple

En los resultados de búsqueda:
- Use "Seleccionar todos" para elegir todos los resultados
- Haga clic en las casillas individuales para seleccionar

### 6.2 Ordenamiento de Tablas

Haga clic en los encabezados de columna para ordenar:
- Ascendente (A-Z, 0-9)
- Descendente (Z-A, 9-0)

### 6.4 Tema Claro/Oscuro

**Cambiar tema:**
1. Haga clic en el ícono de sol/luna
2. El cambio es instantáneo
3. Se mantiene en futuras sesiones

### 6.5 Keyboard Shortcuts

| Atajo | Acción |
|-------|--------|
| `Esc` | Cerrar modales |
| `Tab` | Navegar entre campos |
| `Enter` | Confirmar selections |

---

## 7. Solución de Problemas

### 7.1 Problemas Comunes

| Problema | Solución |
|----------|----------|
| No aparecen productos en la búsqueda | Verifique que el catálogo esté cargado |
| Los cálculos no se actualizan | Actualice los campos de precio |
| La exportación falla | Verifique la conexión a internet |
| El modal no se cierra | Haga clic fuera del modal o presione Esc |

### 7.2 Mensajes de Error

| Mensaje | Significado | Acción |
|---------|-------------|--------|
| "Debe ingresar al menos 2 marcas" | Faltan competidores | Complete los campos de marca |
| "El Documento y Nombre del cliente son obligatorios" | Faltan datos | Complete los campos requeridos |
| "Producto ya en lista" | Producto duplicado | El producto ya fue agregado |

### 7.3 Consejos de Uso

1. **Guarde sus datos frecuentemente**: No hay auto-guardado
2. **Use el modo oscuro**: Mejor para presentaciones
3. **Exporte antes de cerrar**: Evite perder trabajo
4. **Revise los porcentajes**: Verifique que los cálculos tengan sentido

---

---

## Anexo: Guía para Creación de Diapositivas

### Estructura Recomendada (18-22 diapositivas)

#### Bloque 1: Introducción (3 diapositivas)

| # | Título | Contenido Clave |
|---|--------|-----------------|
| 1 | **Portada** | G360 Price Audit — Análisis Estratégico de Precios. Logotipo CIPSA + G360 |
| 2 | **Problema** | Levantamiento manual en campo, datos dispersos en Excel, falta de visibilidad de rentabilidad en tiempo real |
| 3 | **Solución** | Aplicación web corporativa que unifica captura, simulación y exportación en un solo flujo |

#### Bloque 2: Arquitectura (2 diapositivas)

| # | Título | Contenido Clave |
|---|--------|-----------------|
| 4 | **Tech Stack** | React 19 + TypeScript 5.9 + Vite 7 + Tailwind 3.4 + Zustand + Recharts |
| 5 | **Ecosistema G360** | Familia de microherramientas, skill `corporativo-g360`, CLI de scaffolding |

#### Bloque 3: Funcionalidades Core (7 diapositivas)

| # | Título | Contenido Clave |
|---|--------|-----------------|
| 6 | **Comparador — Datos Generales** | Formulario: Documento, Cliente, Sucursal, Fecha, Marcas (hasta 5 competidores) |
| 7 | **Comparador — Búsqueda** | Búsqueda por código/EAN/nombre, selección múltiple, filtro por línea |
| 8 | **Comparador — Tabla** | Columnas editables, variaciones porcentuales automáticas, precio promedio y sugerido |
| 9 | **Dashboard Visual** | Gráficos: BrandRankingChart (barras), PricePieChart (pastel), KPIs, Win Rate |
| 10 | **Simulador de Márgenes** | Slide-over: costo actual, Propuesta 1 (mismo costo), Propuesta 2 (nuevo costo + precio) |
| 11 | **Ranking Automático** | 1 + competidores con precio menor. Fórmula Excel nativa en exportación |
| 12 | **Carga Masiva** | Plantilla Excel para importar cientos de registros en segundos |

#### Bloque 4: Exportación (3 diapositivas)

| # | Título | Contenido Clave |
|---|--------|-----------------|
| 13 | **Exportación XLSX** | Un solo archivo con Comparador + Margen. Celdas editables (fondo amarillo) |
| 14 | **Fórmulas Vivas** | Ranking, margen, dif. costo, impacto % — se recalculan en Excel |
| 15 | **Tablero Estratégico** | Hoja 2: Costo fábrica, Margen de Protección, Semáforo de Alerta |

#### Bloque 5: Modelo de Negocio (2 diapositivas)

| # | Título | Contenido Clave |
|---|--------|-----------------|
| 16 | **Cadena de Valor** | Fabricante → Mayorista → Tienda. Rol del vendedor en el centro |
| 17 | **Fórmulas** | Margen %, Markup %, Ranking, Impacto %. Casos prácticos con números |

#### Bloque 6: Demo y Cierre (3-4 diapositivas)

| # | Título | Contenido Clave |
|---|--------|-----------------|
| 18 | **Demo en Vivo** | Flujo completo: login → datos → búsqueda → precios → simulación → exportación |
| 19 | **Roadmap** | Próximas features: dashboard web, integración ERP, app móvil |
| 20 | **Q&A** | Preguntas frecuentes y contacto |

### Tips Visuales para Diapositivas

| Aspecto | Recomendación |
|---------|---------------|
| **Fondo** | Usar el dark mode de la app (`#0c1929`) para capturas más profesionales. Las cards tienen glow neón en modo oscuro |
| **Gráficos** | Los BrandRankingChart y PricePieChart usan: naranja `#f97316` (Mi Marca Vinifan), rojo `#e11d48`, verde `#059669`, teal `#0d9488`, púrpura `#7c3aed` |
| **Código** | Mostrar ejemplos de JSON del catálogo y fórmulas Excel en bloques de código |
| **Flujo** | Diagrama `Comparador → Slide-over → Informe → XLSX` en cada transición |
| **Consistencia** | Mantener colores corporativos: Azul Marino (primario), Naranja Vinifan (Mi Marca), Rojo CIPSA (acento), Gris Corporativo (secundario) |

### Script Sugerido (por diapositiva)

**Diapositiva 1** — "Hoy les presentamos G360 Price Audit, una herramienta corporativa para el análisis estratégico de precios, diseñada para transformar la forma en que levantamos y analizamos información de mercado."

**Diapositiva 6** — "Comenzamos con el Comparador. El usuario ingresa datos generales del cliente: documento, razón social, sucursal y hasta 5 marcas competidoras. La Marca 1 es siempre nuestra marca, el baseline de comparación."

**Diapositiva 10** — "El Simulador de Márgenes es el corazón de la herramienta. Con un clic en el botón Calculadora de cualquier producto, se despliega un panel lateral que permite modelar dos escenarios comerciales."

**Diapositiva 13** — "La exportación genera un archivo XLSX con fórmulas vivas. El usuario puede editar precios y costos directamente en Excel y las fórmulas se recalculan automáticamente. Las celdas editables tienen fondo amarillo para identificarlas."

---

*Manual de Usuario v2.0 — Versión para presentaciones*
*© 2025-2026 CIPSA — Desarrollado por Carlos Cusi con asistencia de IA*
*Parte del ecosistema G360*
