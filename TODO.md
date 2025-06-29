# Proyecto: Gestor de Inventario Prime de Warframe

## Objetivos Principales

Crear una Single Page Application (SPA) para que los jugadores de Warframe puedan gestionar de forma visual e intuitiva su inventario de partes Prime. La aplicación debe ser rápida, funcionar offline y mantener toda la información del usuario de forma local para garantizar la privacidad y la simplicidad.

---

## Fases del Desarrollo (TODO)

### Fase 1: Configuración y Capa de Datos

- [x] **1. Configurar proyecto NextJS:**

  - [x] Inicializar proyecto con `create-next-app`
  - [x] Configurar estructura de carpetas (components, services, utils)
  - [x] Instalar dependencias: `@wfcd/items` para los datos de Warframe

- [ ] **2. Crear servicio de datos (`src/services/warframeData.js`):**

  - [x] Importar y procesar datos desde `@wfcd/items`
  - [x] Definir funciones para filtrar solo items Prime
  - [x] Crear función `getPrimeItems()` que devuelva solo los items con `prime: true`
  - [x] Implementar función `getCategories()` para obtener categorías disponibles
  - [x] Estructurar datos en formato `PrimeSet` y `PrimePart` para la aplicación

- [x] **3. Crear servicio de inventario del usuario (`src/services/userInventory.js`):**
  - [x] Usar `localStorage` para guardar el estado del inventario del usuario
  - [x] Implementar funciones principales:
    - [x] `saveInventory(inventory)` - Guardar estado completo
    - [x] `loadInventory()` - Cargar estado desde localStorage
    - [x] `updatePartCount(partName, newCount)` - Actualizar cantidad de una parte
    - [x] `toggleMastery(setName)` - Cambiar estado de maestría de un set
    - [x] `buildItem(setData)` - Construir item (descuenta partes, marca como masterizado)
    - [x] `sellItem(setData)` - Vender item (solo descuenta partes necesarias)

### Fase 2: Desarrollo de Componentes de la Interfaz (UI)

- [x] **1. Componente `Navbar.jsx`:**

  - [x] Crear barra de navegación flotante
  - [x] Logo de la aplicación a la izquierda
  - [x] Barra de búsqueda en el centro
  - [x] Botones de importar/exportar inventario a la derecha

- [x] **2. Componente `PrimePart.jsx`:**

  - [x] Mostrar nombre de la parte (ej. "Neuropticas")
  - [x] Botones `+` y `-` para ajustar cantidad
  - [x] Display de cantidad actual vs requerida (`0/1`, `1/1`, `2/2`)
  - [x] Sistema de colores:
    - [x] **Rojo:** cantidad = 0
    - [x] **Amarillo:** 0 < cantidad < requerida
    - [x] **Verde:** cantidad >= requerida
  - [x] Input manual para ingresar cantidad directamente

- [x] **3. Componente `PrimeSet.jsx`:**

  - [x] Mostrar icono y nombre del Set Prime
  - [x] Renderizar lista de componentes `PrimePart`
  - [x] Toggle/checkbox para marcar como "Masterizado"
  - [x] Botones de acción:
    - [x] **Construir:** Descuenta partes necesarias y marca como masterizado
    - [x] **Vender:** Solo descuenta partes necesarias
  - [x] Sistema de colores del contenedor:
    - [x] **Gris:** Faltan partes para construir
    - [x] **Verde:** Se puede construir Y no está masterizado
    - [x] **Amarillo:** Se puede construir Y está masterizado (set extra)
  - [x] Manejar items sin componentes (ej. mods Prime)

- [x] **4. Página principal `pages/index.jsx`:**
  - [x] Cargar datos iniciales de `@wfcd/items` en server-side
  - [x] Integrar inventario del usuario desde localStorage en client-side
  - [x] Renderizar lista completa de componentes `PrimeSet`
  - [x] Manejar estado global de la aplicación

### Fase 3: Lógica de Estado y Estilos

- [x] **1. Gestión de estado:**

  - [x] Al iniciar la app:
    1. [x] Cargar inventario del usuario desde `localStorage`
    2. [x] Cargar lista de items Prime desde `@wfcd/items`
    3. [x] Fusionar datos para mostrar estado actual
  - [x] Actualización en tiempo real:
    - [x] Cada cambio de cantidad actualiza estado y `localStorage`
    - [x] Cada cambio de maestría persiste inmediatamente
    - [x] Validaciones para acciones de construir/vender

- [x] **2. Estilos y UX:**
  - [x] Configurar Tailwind CSS o CSS Modules
  - [x] Definir clases para colores de estado (rojo, amarillo, verde, gris)
  - [x] Layout responsive con grid o flexbox
  - [x] Optimizar para dispositivos móviles
  - [x] Animaciones sutiles para feedback visual

### Fase 4: Funcionalidades Adicionales y Pulido

- [x] **1. Filtros y búsqueda:**

  - [x] Barra de búsqueda por nombre de set
  - [x] Filtros por categoría (Warframes, Primary, Secondary, etc.)
  - [x] Filtros por estado:
    - [x] Sets completados
    - [x] Sets incompletos
    - [x] Sets masterizados
    - [x] Sets listos para construir

- [x] **2. Indicadores y feedback:**

  - [x] Loading states durante carga inicial
  - [x] Contadores de progreso (ej. "15/20 sets completados")
  - [x] Notificaciones para acciones exitosas
  - [x] Validaciones antes de construir/vender

- [x] **3. Backup y Restauración:**

  - [x] Exportar inventario a archivo JSON
  - [x] Importar inventario desde archivo JSON
  - [x] Validación de datos importados
  - [x] Opción de reset completo del inventario

- [ ] **4. Características especiales:**
  - [x] Manejo flexible de items sin componentes (mods Prime)
  - [ ] Cálculo automático de valor de platino (opcional)
  - [x] Estadísticas del inventario (total de partes, sets completos, etc.)
  - [ ] Modo oscuro/claro

---

## Stack Técnico

- **Framework:** Next.js 14+ (App Router)
- **Lenguaje:** JavaScript (ES6+)
- **Estilos:** Tailwind CSS
- **Datos:** `@wfcd/items` package
- **Almacenamiento:** localStorage (solo client-side)
- **Gestión de estado:** React Context + useState/useReducer

---

## Estructura de Datos

### PrimeSet

```javascript
{
  name: "Ash Prime",
  category: "Warframes",
  components: [
    {
      name: "Neuroptics",
      uniqueName: "ash_prime_neuroptics",
      required: 1,
      userCount: 0
    },
    // ...más partes
  ],
  isMastered: false,
  isBuildable: false // calculado dinámicamente
}
```

### UserInventory

```javascript
{
  components: {
    "ash_prime_neuroptics": 2,
    "ash_prime_chassis": 1,
    // ...
  },
  mastery: {
    "Ash Prime": true,
    "Braton Prime": false,
    // ...
  }
}
```
