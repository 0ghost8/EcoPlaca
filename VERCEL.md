# EcoPlaca: frontend y API en Vercel

Vercel publica Angular y ejecuta Express como una función Node.js mediante `api/[...path].ts`. El frontend usa `/api` en el mismo dominio. MySQL debe estar alojado en un servicio externo accesible desde Vercel.

## Causa del error

Vercel buscaba /vercel/path0/dist. El builder Angular genera el sitio en frontend/dist/frontend/browser. Los mensajes npm warn deprecated e install-scripts son advertencias; el fallo del log es ENOENT / No Output Directory.

## Ajustes en Vercel

Usa estos valores en Settings → Build and Deployment:

| Ajuste | Valor |
| --- | --- |
| Root Directory | Raíz del repositorio, sin seleccionar frontend ni backend |
| Framework Preset | Other |
| Install Command | npm ci |
| Build Command | npm run build:frontend |
| Output Directory | frontend/dist/frontend/browser |
| Node.js Version | 22.x |

vercel.json fija el build, la instalación, la salida y el fallback de Angular. Vercel detecta la función TypeScript en `api/` y compila sus importaciones del backend. package.json fija Node 22.x. No uses npm run deploy de backend como Build Command: prepara MySQL y arranca un servidor persistente. La función exporta Express sin ejecutar server.ts ni abrir un puerto.

Después de incorporar el cambio en la rama de despliegue, ejecuta Redeploy. En el primer intento, desactiva Use existing Build Cache para descartar los ajustes anteriores.

## Rutas

Los archivos publicados se sirven primero; /catalogo, /login, /register y las demás rutas Angular reciben index.html al abrirse directamente o recargarse.

Las solicitudes `/api/*` llegan a la función Express y se excluyen del fallback de Angular. `/api/health` devuelve JSON; `/api/categorias` consulta MySQL.

## Configurar MySQL y las variables

En Vercel, Settings → Environment Variables, configurar Production y, si se utilizará, Preview. No guardar contraseñas en Git ni en variables Angular. `vercel.json` excluye el archivo privado `backend/.env` del paquete de la función; las credenciales se suministran desde Vercel.

| Variable | Valor |
| --- | --- |
| NODE_ENV | production |
| JWT_SECRET | Clave privada aleatoria de al menos 32 caracteres, estable entre despliegues |
| CORS_ORIGINS | https://ecoplaca.vercel.app; otros orígenes HTTPS exactos separados por comas, sin barra final |
| DATABASE_URL | URI MySQL pública del proveedor, introducida de forma privada en Vercel |
| JWT_EXPIRES_IN | Opcional, por ejemplo 7d |

En lugar de DATABASE_URL, se pueden configurar DB_HOST, DB_PORT, DB_USER, DB_PASSWORD y DB_NAME. No mezclar métodos: la URI tiene prioridad. localhost apunta a la función Vercel, no a tu computadora.

En Railway, usar la conexión pública TCP de MySQL. Los hosts `*.railway.internal` solo funcionan dentro de Railway. Revisar los permisos de red y los requisitos de TLS del proveedor; no desactivar la verificación de certificados. Cada instancia de la función puede abrir hasta 10 conexiones: revisar el límite de MySQL según la concurrencia.

## Preparar el esquema

Crear primero la base y su usuario. Desde una máquina con acceso, configurar la conexión del proveedor en variables de entorno o en el archivo privado backend/.env. Para crear el primer administrador, configurar SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD; solo son necesarios durante el seed.

```sh
npm ci
npm run build:backend
cd backend
npm run db:prepare
```

Los scripts conservan datos existentes. No usar DB/ecoplaca_DB.sql: contiene DROP DATABASE. No ejecutar migraciones en cada petición ni durante el build de Vercel.

## Verificar el despliegue

Después de guardar las variables, ejecutar Redeploy con la rama que incluye api/[...path].ts.

1. Consultar `/api/health`: debe devolver `status: "ok"` y `app: "EcoPlaca API"`. No consulta MySQL.
2. Consultar `/api/categorias`: debe devolver `success: true` y las categorías del seed. Sí comprueba la conexión y el esquema.
3. Probar registro, inicio de sesión y catálogo.

Si health falla, revisar los logs de la función y las variables JWT/CORS/conexión. Si health funciona pero categorías falla, revisar MySQL público, credenciales y migraciones. Si /api devuelve HTML, revisar Root Directory y que el despliegue incluya la función.

## Comprobación local

Desde la raíz:

```sh
npm ci
npm run build
npm test
```

El resultado debe contener frontend/dist/frontend/browser/index.html, sus archivos JS/CSS y favicon.ico.

## Advertencias de npm

Las dependencias de desarrollo del backend incluyen paquetes transitivos antiguos usados por ts-node-dev. Su actualización es independiente del error de carpeta de salida. No se añadieron overrides incompatibles de glob/rimraf ni una aprobación indiscriminada de scripts de instalación.

Si un próximo deploy muestra un error explícito de binarios esbuild o módulos nativos, conserva ese log y revisa los scripts de los paquetes concretos; no confundas ese posible fallo con las advertencias del log actual.

Referencias: [configuración de Vercel](https://vercel.com/docs/project-configuration/vercel-json), [versiones de Node en Vercel](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).
