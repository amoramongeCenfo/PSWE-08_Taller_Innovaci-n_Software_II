# Convenciones

Reglas para que el código nuevo se parezca al existente.

## Componentes

- **Atómicos y reutilizables.** Lo genérico va en `components/ui` y no conoce el negocio (un `TextField` no sabe qué es un "negocio").
- **Una responsabilidad.** Si un componente maneja datos, validación y diseño a la vez, se parte.
- **Formularios:** el formulario arma átomos y maneja su estado; guardar es responsabilidad de un hook o servicio (ver `ProfileForm` + `useProfileSettings`).
- **Accesibilidad por defecto:** etiquetas visibles, `aria-invalid` y `aria-describedby` en errores, foco en el primer campo con error, botones solo con ícono llevan `label`.
- **Estados siempre:** cargando, vacío, error y éxito.

## Datos

- Un dato que no existe es `null` (o `[]`) y se muestra con `orNotAvailable` / `listOrNotAvailable` (**N/A**). Nunca inventes datos fijos en pantalla.
- Todo acceso a datos pasa por un **servicio con contrato**. Los componentes no llaman a `fetch`, cookies ni `localStorage`.
- Una acción que afecta varias áreas se define una vez y los slices la escuchan.

## Textos

- Español neutro, trato de "tú", frases cortas y sin jerga técnica: las personas usuarias son dueños de PYMEs.
- Los errores dicen **qué pasó y qué hacer**, sin culpar. Ejemplo: "No pudimos guardar tus datos. Inténtalo de nuevo."
- Mensajes de seguridad que no revelan información (por ejemplo, el de credenciales incorrectas).

## Código

- TypeScript estricto. Sin `any`; usa `unknown` y valida (ver `isStoredSession`).
- Nombres en inglés para código y en español para textos visibles.
- Comentarios solo para explicar el **porqué**, en español.
- Estilos con las clases de Tailwind y los tokens del tema; sin colores sueltos.
- Importa desde el `index.ts` de cada feature, no desde sus archivos internos.

## Calidad y Git

- Antes de subir: `pnpm lint`, `pnpm typecheck` y `pnpm build` deben pasar. Los hooks de Husky ya lo exigen al hacer commit y push.
- Commits pequeños, con mensaje en español que explique el cambio.
- Nunca subas secretos (tokens, claves). Van en variables de entorno y `.env` está en `.gitignore`.

## Agregar una pantalla nueva

1. Crea la carpeta `features/<area>/` con sus componentes, hook y, si guarda datos, su servicio con contrato.
2. Crea `pages/<Nombre>Page.tsx` que solo compone la feature.
3. Registra la ruta en `app/router.tsx` (carga perezosa con `lazy`).
4. Si va en el menú, agrégala en `layouts/AppShell/navigation.ts`.
5. Si usa estado global, crea su slice y regístralo en `store/index.ts`.
6. Prueba: vacío (N/A), cargando, error, éxito y vista móvil.
