# FactureAI - Servicio de Registro e Inicio de Sesion

**Evidencia:** GA7-220501096-AA5-EV01 - Diseno y desarrollo de servicios web - caso
**Autor:** Moises David Florez Olivero
**Programa:** Tecnologo en Analisis y Desarrollo de Software - SENA (ficha 3235900)

## Que es esto

Servicio web con dos endpoints (registro e inicio de sesion), construido
sobre **Firebase Cloud Functions + Express**, conectado a **Firestore**
(la misma base de datos ya definida para el proyecto FactureAI).

Es el primer paso de codificacion del backend real del MVP: mas adelante
se conectara con la pantalla de Login que ya se justifico en la evidencia
GA7-220501096-AA4 (componentes React del frontend).

## Por que esta arquitectura

- **Node.js + Express**: tecnologia sugerida por el material formativo
  "Construccion de API".
- **Firestore**: ya es la base de datos definida para FactureAI, no se
  agrega tecnologia nueva.
- **Cloud Functions**: ya estaba contemplado como backend en el informe
  tecnico inicial del proyecto (GA7-220501096-AA1). No requiere contratar
  ni mantener un servidor aparte, y se despliega directamente sobre el
  mismo proyecto de Firebase que usa el resto del sistema.
- **n8n** (parte del stack MVP) no se toca: sigue encargandose de la
  automatizacion de facturas por WhatsApp. Este servicio cubre un ambito
  distinto: la autenticacion de usuarios del panel web.

## Seguridad implementada

- Las contrasenas **nunca** se guardan en texto plano: se guardan con
  hash usando `bcryptjs` (10 rondas de sal).
- El login no distingue en su respuesta si fallo el usuario o la
  contrasena (mensaje generico "Error en la autenticacion"), para no dar
  pistas a quien intente adivinar usuarios validos.

## Estructura del proyecto

```
factureai-auth-service/
├── firebase.json          # Configuracion de Firebase (functions + emuladores)
├── postman_collection.json # Coleccion lista para probar con Postman
├── README.md
└── functions/
    ├── index.js           # Codigo del servicio (register + login)
    ├── package.json
    └── .gitignore
```

## Como probarlo localmente (emulador, sin necesidad de desplegar)

Requisitos: tener Node.js 18+ y una cuenta de Firebase (gratis).

```bash
# 1. Instalar Firebase CLI (una sola vez)
npm install -g firebase-tools

# 2. Iniciar sesion en Firebase
firebase login

# 3. Asociar este proyecto a tu proyecto de Firebase existente
firebase use --add

# 4. Instalar dependencias del servicio
cd functions
npm install
cd ..

# 5. Levantar el emulador (no gasta cuota real de Firebase)
firebase emulators:start --only functions,firestore
```

El emulador mostrara una URL parecida a:
`http://127.0.0.1:5001/TU-PROYECTO/us-central1/api`

## Como probar con Postman

1. Importa `postman_collection.json` en Postman.
2. Ajusta la variable `base_url` con la URL que te dio el emulador (o la
   URL real si ya lo desplegaste con `firebase deploy --only functions`).
3. Ejecuta en orden:
   - **Registrar usuario** → deberia responder `201` y "Usuario registrado correctamente."
   - **Login correcto** → deberia responder `200` y "Autenticacion satisfactoria."
   - **Login con contrasena incorrecta** → deberia responder `401` y "Error en la autenticacion."
   - **Login con usuario inexistente** → deberia responder `401` y "Error en la autenticacion."

## Endpoints

| Metodo | Ruta        | Body                                  | Respuesta exitosa                       |
|--------|-------------|----------------------------------------|------------------------------------------|
| POST   | `/register` | `{ "usuario": "...", "password": "..." }` | `201` - "Usuario registrado correctamente." |
| POST   | `/login`    | `{ "usuario": "...", "password": "..." }` | `200` - "Autenticacion satisfactoria."     |

## Version de control

Este proyecto esta listo para inicializarse como repositorio Git y subirse
a GitHub:

```bash
git init
git add .
git commit -m "Servicio de registro e inicio de sesion - GA7-220501096-AA5-EV01"
git branch -M main
git remote add origin <URL-de-tu-repositorio>
git push -u origin main
```

Alternativamente, este mismo folder puede comprimirse en WinRAR y
entregarse directamente, tal como lo permitio el instructor.
