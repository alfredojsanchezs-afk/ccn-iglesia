# Centro Cristiano para las Naciones (CCN) — Plataforma web

Aplicación web en español con registro e inicio de sesión para los niveles de la iglesia:
**Pastor → Pastor base → Líder → Discípulo**.

**Tecnología:** Next.js 14 (web) + Supabase (login y base de datos) + Vercel (publicación, gratis).
No necesitas usar la consola en ningún paso: todo se hace desde páginas web.

Colores: azul `#16223B`, rojo `#A11D28` y blanco.

---

## Qué hace (versión 1)

- **Registro** con correo, nombre de usuario, contraseña, nombres, apellidos, fecha de nacimiento,
  sexo, dirección, teléfono personal y teléfono (y nombre opcional) de un contacto de emergencia.
  La **edad se calcula sola** a partir de la fecha de nacimiento.
- **Inicio de sesión** con correo **o** nombre de usuario.
- **Niveles y jerarquía**
  - **Pastor:** no elige superior. Hay varios pastores.
  - **Pastor base:** elige a qué **Pastor** pertenece.
  - **Líder:** elige a qué **Pastor base** pertenece.
  - **Discípulo:** elige su **Líder**; la web muestra automáticamente su Pastor base y su Pastor.
- **Aprobación:** todas las cuentas nuevas quedan *pendientes* hasta que un **Pastor** las apruebe
  (o rechace) en el panel, pestaña **Solicitudes**.
  - El **primer Pastor que se registre** queda aprobado automáticamente (para poder arrancar).
- **Quién ve qué**
  - **Pastor:** ve toda la red de la iglesia (todos los pastores y todo lo que hay debajo).
  - **Pastor base:** ve a sus líderes y a los discípulos de esos líderes.
  - **Líder:** ve a sus discípulos.
  - **Discípulo:** ve su propia cobertura (líder → pastor base → pastor).
  - Esto lo hace respetar la propia base de datos (no solo la pantalla).
- Cada persona puede **editar sus datos** en *Mi perfil* (no puede cambiar su nivel, estado ni superior).
- **Etapas (fases del discípulo):** cada discípulo cursa 4 fases y registra en cuál va, con fecha de inicio y de fin:
  1. **Ruta al Éxito**
  2. **ESFORDI** (Escuela de Formación Discipular)
  3. **ADN CCN**
  4. **ESFORMI** (Escuela de Formación Ministerial)

  El panel tiene tres pestañas: **Red de la iglesia**, **Etapas** y **Solicitudes** (esta última solo para Pastores).
  - El **discípulo** ve *Mis etapas* y registra las suyas.
  - El **líder, pastor base y pastor** ven *Etapas*: resumen por fase, **búsqueda por fase**, por estado
    (en curso / completada / sin iniciar) y por nombre, y pueden registrar o corregir las etapas de los discípulos que ven.

---

## Estructura del proyecto

```
ccn-iglesia/
├── app/                  Páginas (login, registro, panel, perfil) y estilos
├── components/           Encabezado, formulario compartido, árbol de personas
├── lib/                  Conexión a Supabase y utilidades (edad, textos)
├── public/logo/          <-- AQUÍ va tu logo (logo.png)
├── supabase/schema.sql   Script de la base de datos (se pega en Supabase)
├── supabase/etapas.sql   Script del módulo de Etapas (se pega en Supabase, después de schema.sql)
├── package.json
└── README.md
```

---

## Puesta en marcha (3 pasos, sin consola)

### Paso 1 — Supabase (base de datos y login)

1. Entra a <https://supabase.com>, crea una cuenta y pulsa **New project**.
   Ponle un nombre (por ejemplo `ccn`), crea una contraseña de base de datos (guárdala) y elige la región más cercana.
2. Cuando el proyecto esté listo, abre **SQL Editor** (menú izquierdo) → **New query**.
3. Abre el archivo `supabase/schema.sql` de este repositorio, **copia todo su contenido**, pégalo en el editor y pulsa **Run**.
   Debe decir *Success*.
4. Haz lo mismo con el archivo `supabase/etapas.sql` (New query → pegar todo → **Run**). Es el módulo de Etapas.
5. Para que las personas puedan entrar apenas se registren (sin confirmar correo):
   **Authentication → Sign In / Providers → Email** y desactiva **Confirm email**. Guarda.
   *(Si prefieres dejar la confirmación por correo activada, también funciona: les pedirá confirmar antes de entrar.)*
6. Copia tus dos datos de conexión, los necesitarás en el Paso 3:
   **Project Settings → API** (o *Data API*):
   - **Project URL** (algo como `https://abcdxyz.supabase.co`)
   - **anon public key** (clave larga que empieza con `eyJ...`)

### Paso 2 — GitHub (guardar el código)

1. Crea un repositorio nuevo en <https://github.com/new> (por ejemplo `ccn-iglesia`).
2. Descomprime el ZIP en tu computadora.
3. En la página del repositorio pulsa **Add file → Upload files** y **arrastra todo el contenido** de la carpeta descomprimida
   (las carpetas `app`, `components`, `lib`, `public`, `supabase` y los archivos sueltos). Pulsa **Commit changes**.
   - Asegúrate de subir también los archivos que empiezan con punto (`.gitignore`, `.env.example`). Si no los ves en tu
     explorador de archivos, activa "mostrar archivos ocultos". Si alguno no se sube, la web igual funciona.
4. **Logo:** entra a la carpeta `public/logo` en GitHub → **Add file → Upload files** y sube tu imagen con el nombre exacto
   **`logo.png`**. Aparecerá arriba a la izquierda. (Mientras no exista, se muestra solo el nombre de la iglesia.)

### Paso 3 — Vercel (publicar la web)

1. Entra a <https://vercel.com> e inicia sesión con tu cuenta de GitHub.
2. **Add New… → Project** y elige el repositorio `ccn-iglesia` → **Import**.
3. Antes de desplegar, abre **Environment Variables** y agrega estas dos:

   | Nombre | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | el *Project URL* de Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | la *anon public key* de Supabase |

4. Pulsa **Deploy**. En un par de minutos tendrás una dirección tipo `https://ccn-iglesia.vercel.app`.
5. Vuelve a Supabase → **Authentication → URL Configuration** y pon esa dirección en **Site URL**.
   (Solo importa si usas confirmación de correo.)

### Primer uso

1. Abre tu web y entra a **Registrarme**.
2. Regístrate tú (o quien sea el pastor principal) con nivel **Pastor**: queda **aprobado automáticamente**.
3. Después se registran los demás. A los Pastores base, Líderes y Discípulos los aprueba un Pastor desde
   **Panel → Solicitudes**.

> Orden recomendado para registrarse: primero los Pastores (los nuevos pastores los aprueba un pastor),
> luego Pastores base, luego Líderes y por último Discípulos. Cada nivel solo puede elegir a un superior que ya esté **aprobado**.

---

## Cómo actualizar la web después

Cada vez que cambies archivos en GitHub, Vercel vuelve a publicar la web automáticamente.
Si en el futuro agregamos campos al formulario, también habrá que pegar un pequeño script nuevo en el **SQL Editor** de Supabase;
te lo daré listo para copiar y pegar.

---

## Notas de seguridad y privacidad

- Las contraseñas las maneja Supabase (nunca se guardan en texto plano).
- Al registrarse, la lista para elegir superior muestra **solo nombres** de personas ya aprobadas (nunca teléfonos ni direcciones).
- Para entrar con nombre de usuario, la web consulta el correo asociado a ese usuario. Es un compromiso habitual;
  si prefieres que solo se entre con correo, se puede quitar fácilmente.
- La clave `anon public` es pública por diseño; la protección real son las reglas (RLS) del archivo `schema.sql`.
  **Nunca** pegues la clave `service_role` en Vercel ni en GitHub.
- Por ser datos de personas (incluyendo teléfonos y direcciones), conviene guardar las contraseñas de Supabase y Vercel de forma segura
  y avisar a los miembros cómo se usan sus datos.

---

## Ideas para las próximas versiones

Más campos en el formulario, asistencia, reportes, edición de la jerarquía por parte de un Pastor,
restablecer contraseña, exportar a Excel, notificaciones. Lo vamos agregando paso a paso.
