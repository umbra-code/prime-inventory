# Proyecto: Gestor de Inventario Prime de Warframe

## Objetivos Principales

Crear una Single Page Application (SPA) para que los jugadores de Warframe puedan gestionar de forma visual e intuitiva su inventario de partes Prime. La aplicación debe ser rápida, funcionar offline y mantener toda la información del usuario de forma local para garantizar la privacidad y la simplicidad.

---

## Fases del Desarrollo (TODO)

### Fase 1: Configuración y Capa de Datos

- [ ] **1. Configurar proyecto NextJS:**

  - [ ] Inicializar proyecto con `create-next-app`
  - [ ] Configurar estructura de carpetas (components, services, utils)
  - [ ] Instalar dependencias: `@wfcd/items` para los datos de Warframe

- [ ] **2. Crear servicio de datos (`src/services/warframeData.js`):**

  - [ ] Importar y procesar datos desde `@wfcd/items`
  - [ ] Definir funciones para filtrar solo items Prime
  - [ ] Crear función `getPrimeItems()` que devuelva solo los items con `prime: true`
  - [ ] Implementar función `getCategories()` para obtener categorías disponibles
  - [ ] Estructurar datos en formato `PrimeSet` y `PrimePart` para la aplicación

- [ ] **3. Crear servicio de inventario del usuario (`src/services/userInventory.js`):**
  - [ ] Usar `localStorage` para guardar el estado del inventario del usuario
  - [ ] Implementar funciones principales:
    - [ ] `saveInventory(inventory)` - Guardar estado completo
    - [ ] `loadInventory()` - Cargar estado desde localStorage
    - [ ] `updatePartCount(partName, newCount)` - Actualizar cantidad de una parte
    - [ ] `toggleMastery(setName)` - Cambiar estado de maestría de un set
    - [ ] `buildItem(setData)` - Construir item (descuenta partes, marca como masterizado)
    - [ ] `sellItem(setData)` - Vender item (solo descuenta partes necesarias)

### Fase 2: Desarrollo de Componentes de la Interfaz (UI)

- [ ] **1. Componente `Navbar.jsx`:**

  - [ ] Crear barra de navegación flotante
  - [ ] Logo de la aplicación a la izquierda
  - [ ] Barra de búsqueda en el centro
  - [ ] Botones de importar/exportar inventario a la derecha

- [ ] **2. Componente `PrimePart.jsx`:**

  - [ ] Mostrar nombre de la parte (ej. "Neuropticas")
  - [ ] Botones `+` y `-` para ajustar cantidad
  - [ ] Display de cantidad actual vs requerida (`0/1`, `1/1`, `2/2`)
  - [ ] Sistema de colores:
    - [ ] **Rojo:** cantidad = 0
    - [ ] **Amarillo:** 0 < cantidad < requerida
    - [ ] **Verde:** cantidad >= requerida
  - [ ] Input manual para ingresar cantidad directamente

- [ ] **3. Componente `PrimeSet.jsx`:**

  - [ ] Mostrar icono y nombre del Set Prime
  - [ ] Renderizar lista de componentes `PrimePart`
  - [ ] Toggle/checkbox para marcar como "Masterizado"
  - [ ] Botones de acción:
    - [ ] **Construir:** Descuenta partes necesarias y marca como masterizado
    - [ ] **Vender:** Solo descuenta partes necesarias
  - [ ] Sistema de colores del contenedor:
    - [ ] **Gris:** Faltan partes para construir
    - [ ] **Verde:** Se puede construir Y no está masterizado
    - [ ] **Amarillo:** Se puede construir Y está masterizado (set extra)
  - [ ] Manejar items sin componentes (ej. mods Prime)

- [ ] **4. Página principal `pages/index.jsx`:**
  - [ ] Cargar datos iniciales de `@wfcd/items` en server-side
  - [ ] Integrar inventario del usuario desde localStorage en client-side
  - [ ] Renderizar lista completa de componentes `PrimeSet`
  - [ ] Manejar estado global de la aplicación

### Fase 3: Lógica de Estado y Estilos

- [ ] **1. Gestión de estado:**

  - [ ] Al iniciar la app:
    1. [ ] Cargar inventario del usuario desde `localStorage`
    2. [ ] Cargar lista de items Prime desde `@wfcd/items`
    3. [ ] Fusionar datos para mostrar estado actual
  - [ ] Actualización en tiempo real:
    - [ ] Cada cambio de cantidad actualiza estado y `localStorage`
    - [ ] Cada cambio de maestría persiste inmediatamente
    - [ ] Validaciones para acciones de construir/vender

- [ ] **2. Estilos y UX:**
  - [ ] Configurar Tailwind CSS o CSS Modules
  - [ ] Definir clases para colores de estado (rojo, amarillo, verde, gris)
  - [ ] Layout responsive con grid o flexbox
  - [ ] Optimizar para dispositivos móviles
  - [ ] Animaciones sutiles para feedback visual

### Fase 4: Funcionalidades Adicionales y Pulido

- [ ] **1. Filtros y búsqueda:**

  - [ ] Barra de búsqueda por nombre de set
  - [ ] Filtros por categoría (Warframes, Primary, Secondary, etc.)
  - [ ] Filtros por estado:
    - [ ] Sets completados
    - [ ] Sets incompletos
    - [ ] Sets masterizados
    - [ ] Sets listos para construir

- [ ] **2. Indicadores y feedback:**

  - [ ] Loading states durante carga inicial
  - [ ] Contadores de progreso (ej. "15/20 sets completados")
  - [ ] Notificaciones para acciones exitosas
  - [ ] Validaciones antes de construir/vender

- [ ] **3. Backup y Restauración:**

  - [ ] Exportar inventario a archivo JSON
  - [ ] Importar inventario desde archivo JSON
  - [ ] Validación de datos importados
  - [ ] Opción de reset completo del inventario

- [ ] **4. Características especiales:**
  - [ ] Manejo flexible de items sin componentes (mods Prime)
  - [ ] Cálculo automático de valor de platino (opcional)
  - [ ] Estadísticas del inventario (total de partes, sets completos, etc.)
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
  parts: [
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
  parts: {
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
