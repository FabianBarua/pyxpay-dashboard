# Pyx Pay Dashboard

Dashboard de gestión para la API de [Pyx Pay](https://pyxpay.com.br). Permite consultar transacciones, visualizar saldos, crear cobros y gestionar múltiples claves de API desde una interfaz moderna y responsiva.

## Tech Stack

| Categoría | Tecnología |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| UI | [React 19](https://react.dev) |
| Componentes | [shadcn/ui](https://ui.shadcn.com) + [Radix UI](https://www.radix-ui.com) |
| Estilos | [Tailwind CSS 4](https://tailwindcss.com) |
| Estado | [Zustand 5](https://zustand.docs.pmnd.rs) con persistencia en localStorage |
| Iconos | [Tabler Icons](https://tabler.io/icons) |
| Tema | [next-themes](https://github.com/pacocoursey/next-themes) (claro / oscuro / sistema) |
| Fechas | [date-fns](https://date-fns.org) + [react-day-picker](https://react-day-picker.js.org) |
| Package Manager | [pnpm](https://pnpm.io) |

## Funcionalidades

- **Autenticación** — Login con API key y endpoint configurable
- **Múltiples cuentas** — Guarda, edita y elimina claves de API; cambio rápido desde el sidebar
- **Listado de transacciones** — Tabla con paginación, filtros por fecha, status, tipo y búsqueda libre
- **Búsqueda por ID / Hash** — Busca transacciones por identificador numérico o Hash ID
- **Detalle de transacción** — Vista completa en ruta propia (`/dashboard/transacoes/[id]`), con historial de status y acciones
- **Columnas configurables** — Elige qué columnas mostrar; se persiste en localStorage
- **Calendario** — Selectores de fecha con calendario popover en formato dd/mm/yyyy
- **Crear transacción** — Formulario para Pix, Boleto y Tarjeta
- **Saldo** — Consulta de saldo en tiempo real
- **Tema** — Switcher de 3 estados (claro, oscuro, sistema) en el sidebar
- **Server Actions** — Todas las llamadas a la API se ejecutan del lado del servidor

## Primeros pasos

### Requisitos

- [Node.js](https://nodejs.org) 18+
- [pnpm](https://pnpm.io) 10+

### Instalación

```bash
git clone https://github.com/FabianBarua/pyxpay-dashboard.git
cd pyxpay-dashboard
pnpm install
```

### Desarrollo

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Build de producción

```bash
pnpm build
pnpm start
```

## Estructura del proyecto

```
app/
├── layout.tsx              # Layout raíz con ThemeProvider
├── page.tsx                # Redirect a login
├── login/page.tsx          # Login + gestión de claves guardadas
└── dashboard/
    ├── layout.tsx          # Sidebar + contenido
    ├── page.tsx            # Home con estadísticas
    ├── transacoes/
    │   ├── page.tsx        # Listado con filtros y tabla
    │   ├── [id]/page.tsx   # Detalle de transacción
    │   └── crear/page.tsx  # Crear nueva transacción
    ├── saldo/page.tsx      # Consulta de saldo
    └── cashout/page.tsx    # Cashout
components/
├── ui/                     # Componentes shadcn/ui
└── dashboard/              # Componentes del dashboard (sidebar, etc.)
lib/
├── api.ts                  # Tipos, enums y constantes
├── actions/api.ts          # Server Actions (llamadas HTTP)
├── store/
│   ├── auth.ts             # Zustand: autenticación
│   ├── transacoes.ts       # Zustand: transacciones y filtros
│   ├── wallet.ts           # Zustand: saldo
│   └── saved-keys.ts       # Zustand: claves guardadas
└── utils.ts                # Utilidades (cn)
```

## Licencia

MIT
