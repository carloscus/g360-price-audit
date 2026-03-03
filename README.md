# CIPSA - Comparador de Precios y Calculadora de Márgenes

> **Aplicación web para análisis competitivo de precios y cálculo de márgenes de ganancia**

[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat&logo=react)](https://es.react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.x-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![MUI](https://img.shields.io/badge/MUI-7.x-007FFF?style=flat&logo=mui)](https://mui.com/)

---

## 📋 Descripción

**CIPSA Análisis de Precios** es una aplicación web moderna diseñada para optimizar la toma de decisiones comerciales mediante el análisis competitivo de precios y el cálculo preciso de márgenes de ganancia.

### Características Principales

| Módulo | Descripción |
|--------|-------------|
| **Análisis Competitivo** | Compara precios entre tu marca y hasta 5 competidores, calculando variaciones porcentuales y sugiriendo precios óptimos |
| **Calculadora de Márgenes** | Calcula markup, margen de ganancia y rentabilidad de productos de forma individual o masiva |
| **Dashboard Visual** | Gráficos interactivos (barras, torta) para análisis rápido de la posición competitiva |
| **Exportación** | Exporta informes a PNG, Excel (XLSX), y HTML navegable |

---

## 👥 Autores

| Rol | Nombre | Contribución |
|-----|--------|--------------|
| **Desarrollador Principal** | [Carlos Cusi](mailto:ccusi@outlook.com) | Arquitectura, implementación, diseño UI/UX, lógica de negocio |
| **Asistente de IA** | Claude (Anthropic) | Código, documentación, refactorización, resolución de problemas |

*Proyecto desarrollado collaboratively entre el desarrollador y su asistente de IA.*

---

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 19** - Biblioteca de interfaz de usuario
- **TypeScript 5.9** - Tipado estático
- **Vite 7** - Build tool y servidor de desarrollo
- **MUI (Material UI) 7** - Componentes UI
- **Tailwind CSS 3.4** - Estilos utilitarios
- **Zustand 5** - Gestión de estado
- **React Router DOM 7** - Navegación
- **Recharts** - Gráficos interactivos
- **React Hook Form** - Formularios
- **Zod** - Validación de esquemas
- **html2canvas** - Captura de pantallas
- **ExcelJS** - Generación de archivos Excel
- **Lucide React** - Iconos

### Backend (Opcional)
- **Python/Flask** - API para exportación avanzada
- **Pyodide** - Ejecutar Python en el navegador

---

## 📁 Estructura del Proyecto

```
comparador_de_precios/
├── public/
│   └── data/
│       └── productos.json       # Catálogo de productos
├── src/
│   ├── api/                    # Esquemas de API
│   ├── assets/                # Recursos estáticos
│   ├── components/             # Componentes React
│   │   ├── charts/            # Gráficos y visualizaciones
│   │   ├── comparador/        # Componentes del comparador
│   │   ├── navbar/            # Barra de navegación
│   │   ├── ui/                # Componentes UI base
│   │   └── ...
│   ├── contexts/              # React Contexts
│   ├── hooks/                 # Hooks personalizados
│   ├── pages/                 # Páginas principales
│   │   ├── ComparadorPage.tsx # Página de análisis competitivo
│   │   └── MarginCalculatorPage.tsx # Página de márgenes
│   ├── store/                 # Estados globales (Zustand)
│   ├── styles/                # Archivos CSS
│   ├── theme/                 # Temas MUI
│   ├── types/                 # Definiciones de tipos
│   └── utils/                 # Utilidades y funciones helper
├── docs/                      # Documentación adicional
├── backend/                   # Servidor Python (opcional)
└── package.json
```

---

## 🚀 Instalación y Ejecución

### Requisitos Previos

- **Node.js** 18.x o superior
- **npm** 9.x o superior
- **Git** (opcional)

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repositorio>
   cd comparador_de_precios
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo**
   ```bash
   npm run dev
   ```

4. **Abrir en el navegador**
   ```
   http://localhost:5173
   ```

### Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Compila la aplicación para producción |
| `npm run lint` | Ejecuta el linter |
| `npm run preview` | Previsualiza la build de producción |

---

## 📖 Guía de Uso

### Página de Análisis Competitivo

1. **Configurar datos generales**
   - Ingrese el documento del cliente (RUC/DNI)
   - Nombre del cliente
   - Código de cliente (opcional)
   - Sucursal
   - Fecha de análisis

2. **Agregar competidores**
   - Ingrese hasta 5 nombres de marca/competidor en los campos "Marca 1" a "Marca 5"
   - La "Marca 1" se considera SU marca (precio base)

3. **Buscar productos**
   - Use el buscador para agregar productos del catálogo
   - Puede agregar productos manualmente si no están en el catálogo

4. **Ingresar precios**
   - Ingrese los precios de cada competidor en la tabla
   - El sistema calculará automáticamente:
     - Precio promedio
     - Variación porcentual vs cada competidor
     - Precio sugerido

5. **Exportar resultados**
   - **PNG**: Captura de tabla o dashboard
   - **Excel (XLSX)**: Archivo estructurado
   - **HTML**: Página navegable

### Calculadora de Márgenes

1. **Datos del cliente**
   - Ingrese documento y nombre del cliente

2. **Agregar productos**
   - Busque en el catálogo o agregue manualmente

3. **Configurar costos y precios**
   - Ingrese el costo de cada producto
   - Ingrese el precio de venta
   - El sistema calculará:
     - **Markup**: (Precio - Costo) / Costo × 100
     - **Margen**: (Precio - Costo) / Precio × 100
     - **Ganancia**: Precio - Costo

4. **Aplicación masiva**
   - Use "Aplicar Globalmente" para establecer el mismo margen/markup a todos los productos

5. **Exportar**
   - Genere un archivo Excel con todos los cálculos

---

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_API_URL=http://localhost:5000
VITE_APP_TITLE=CIPSA Análisis de Precios
```

### Catálogo de Productos

El catálogo se encuentra en `public/data/productos.json`. Formato esperado:

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

---

## 🧪 Desarrollo

### Añadir nuevos componentes

1. Crear el componente en `src/components/`
2. Exportar desde `src/components/ui/index.ts` si es un componente reutilizable
3. Importar en la página correspondiente

### Estilos

- **Tailwind CSS** para estilos utilitarios
- **CSS Variables** en `src/styles/design-system.css` para temas
- **MUI Theme** en `src/theme/muiTheme.ts` para componentes Material

---

## 📄 Licencia

*© 2025-2026 CIPSA - Todos los derechos reservados*

Desarrollado por Carlos Cusi con asistencia de IA.

---

## 📞 Soporte

Para consultas o reporte de errores:
- **Email**: ccusi@outlook.com

---

*Última actualización: 2026-03-03*
