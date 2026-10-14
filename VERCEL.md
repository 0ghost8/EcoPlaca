# EcoPlaca: Angular en Vercel y API/MySQL en Railway

El frontend se publica en Vercel. `vercel.json` dirige `/api` y `/api/*` al backend
`https://ecoplaca-production.up.railway.app`, conservando el prefijo `/api`.
Angular sigue usando `/api` bajo el mismo dominio, sin cambiar su código ni su
proxy de desarrollo. Express y MySQL permanecen en Railway.

## Ajustes en Vercel

| Ajuste | Valor |
| --- | --- |
| Root Directory | Raíz del repositorio, no frontend ni backend |
| Framework Preset | Other |
| Install Command | npm ci |
| Build Command | npm run build:frontend |
| Output Directory | frontend/dist/frontend/browser |
| Node.js Version | 22.x |

No ejecutar `npm run deploy` del backend en Vercel. No configurar credenciales
MySQL ni JWT en Angular. Vercel solo sirve el frontend y reenvía las peticiones
API; no necesita una función Express adicional ni acceso directo a MySQL.

## Ajustes en Railway

El servicio EcoPlaca ejecuta el backend mediante `npm run deploy` en backend/,
con el backend compilado previamente. Su dominio público debe apuntar al puerto
que imprime el servidor (actualmente 8080), suministrado por Railway en PORT.

En Variables del servicio EcoPlaca, conservar la conexión interna a MySQL y
configurar:

- NODE_ENV=production.
- JWT_SECRET: clave privada aleatoria de al menos 32 caracteres, estable entre despliegues.
- CORS_ORIGINS=https://ecoplaca.vercel.app. Si se necesitan dominios de preview,
  agregar sus orígenes HTTPS exactos separados por comas, sin barra final.
- MYSQL_URL o DATABASE_URL, o bien DB_HOST, DB_PORT, DB_USER, DB_PASSWORD y DB_NAME.
  La URI tiene prioridad sobre las variables separadas.

`mysql.railway.internal` es válido para el backend alojado en Railway. No es
accesible directamente desde Vercel, que utiliza el dominio HTTP público del
backend. Guardar las credenciales únicamente en variables privadas.

Las migraciones y el seed preservan datos existentes. No usar
DB/ecoplaca_DB.sql sobre una base que deba conservarse: contiene DROP DATABASE.
El seed no cambia la contraseña de un administrador que ya existe.

## Publicar la conexión

Incorporar esta configuración en main, la rama conectada a Vercel, y esperar el
despliegue automático o ejecutar Redeploy. Si la configuración anterior sigue
activa, desactivar Use existing Build Cache en ese despliegue.

## Comprobar

1. Abrir https://ecoplaca-production.up.railway.app/api/health: debe devolver
   JSON con status "ok". No consulta MySQL.
2. Abrir https://ecoplaca-production.up.railway.app/api/categorias: debe devolver
   success true y las categorías del seed. Sí comprueba MySQL.
3. Tras desplegar Vercel, abrir https://ecoplaca.vercel.app/api/health y
   https://ecoplaca.vercel.app/api/categorias: deben mostrar las mismas respuestas.
4. Probar registro, login, catálogo y las operaciones de transferencia.

Si funciona Railway pero Vercel devuelve 404 o HTML en /api, comprobar que el
despliegue incorpora este vercel.json. Si devuelve 403 por CORS, revisar que el
origen del frontend esté incluido en CORS_ORIGINS del servicio EcoPlaca.

Los archivos estáticos se sirven normalmente; las rutas Angular como /catalogo
reciben index.html al recargarse. Las rutas /api se resuelven antes de ese fallback.

## Validación local

```sh
npm run build:frontend
```

La salida debe estar en frontend/dist/frontend/browser. `frontend/proxy.conf.json`
solo se utiliza en desarrollo local; no controla las peticiones de Vercel.
