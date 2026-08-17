// ==========================================================
// FactureAI - Servicio de Registro e Inicio de Sesion
// Evidencia GA7-220501096-AA5-EV01
// Autor: Moises David Florez Olivero
// ----------------------------------------------------------
// Este servicio expone dos endpoints (registro y login) usando
// Firebase Cloud Functions + Express, conectado a Firestore.
//
// Es la base del futuro modulo de autenticacion que usara el
// frontend de FactureAI (React) en la pantalla de Login ya
// disenada en evidencias anteriores (GA7-220501096-AA4).
//
// Por que esta arquitectura:
// - Node.js + Express: tal como lo sugiere el material
//   formativo "Construccion de API".
// - Firestore: es la base de datos ya definida para el
//   proyecto, no se agrega ninguna tecnologia nueva.
// - Cloud Functions: permite exponer el servicio sin necesidad
//   de contratar/mantener un servidor aparte, y ya estaba
//   contemplado desde el informe tecnico inicial del proyecto.
// ==========================================================

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const express = require("express");
const bcrypt = require("bcryptjs");

// Inicializamos el SDK de administracion de Firebase.
// Esto nos da acceso a Firestore desde el backend (no desde
// el navegador, sino desde el servidor, con permisos de admin).
admin.initializeApp();
const db = getFirestore();

// Creamos la aplicacion Express que va a manejar las rutas.
const app = express();
app.use(express.json()); // Permite leer el body de las peticiones en formato JSON

// Referencia a la coleccion "usuarios" en Firestore.
// Usamos el nombre de usuario como ID del documento para poder
// buscarlo directamente sin tener que hacer una consulta (query).
const usersCollection = db.collection("usuarios");

// ----------------------------------------------------------
// POST /register
// Body esperado: { "usuario": "...", "password": "..." }
//
// Crea un nuevo usuario en Firestore. La contrasena NUNCA se
// guarda en texto plano: se guarda un hash generado con bcrypt.
// ----------------------------------------------------------
app.post("/register", async (req, res) => {
  try {
    const { usuario, password } = req.body;

    // Validacion basica: ambos campos son obligatorios.
    if (!usuario || !password) {
      return res.status(400).json({
        estado: "error",
        mensaje: "Usuario y contrasena son obligatorios.",
      });
    }

    // Verificamos que el usuario no exista ya.
    const existingUser = await usersCollection.doc(usuario).get();
    if (existingUser.exists) {
      return res.status(409).json({
        estado: "error",
        mensaje: "El usuario ya esta registrado.",
      });
    }

    // Hasheamos la contrasena antes de guardarla.
    // El numero 10 son las "rondas de sal" (salt rounds): entre
    // mas alto, mas seguro pero mas lento. 10 es un valor estandar.
    const passwordHash = await bcrypt.hash(password, 10);

    // Guardamos el nuevo usuario en Firestore.
    await usersCollection.doc(usuario).set({
      usuario,
      passwordHash,
       creadoEn: FieldValue.serverTimestamp(),
    });

    return res.status(201).json({
      estado: "ok",
      mensaje: "Usuario registrado correctamente.",
    });
  } catch (error) {
    console.error("Error en /register:", error);
    return res.status(500).json({
      estado: "error",
      mensaje: "Error interno al registrar el usuario.",
    });
  }
});

// ----------------------------------------------------------
// POST /login
// Body esperado: { "usuario": "...", "password": "..." }
//
// Valida las credenciales contra Firestore. Responde con los
// mensajes exactos que pide el caso de la evidencia:
// "Autenticacion satisfactoria" o "Error en la autenticacion".
// ----------------------------------------------------------
app.post("/login", async (req, res) => {
  try {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
      return res.status(400).json({
        estado: "error",
        mensaje: "Usuario y contrasena son obligatorios.",
      });
    }

    // Buscamos el usuario en Firestore.
    const userDoc = await usersCollection.doc(usuario).get();

    if (!userDoc.exists) {
      // No especificamos si fallo el usuario o la contrasena.
      // Es una buena practica de seguridad: evita que alguien
      // pueda "adivinar" que usuarios existen en el sistema.
      return res.status(401).json({
        estado: "error",
        mensaje: "Error en la autenticacion.",
      });
    }

    const userData = userDoc.data();

    // Comparamos la contrasena ingresada contra el hash guardado.
    // bcrypt.compare vuelve a hashear "password" con la misma sal
    // y compara el resultado, sin necesidad de desencriptar nada.
    const passwordValida = await bcrypt.compare(
      password,
      userData.passwordHash
    );

    if (!passwordValida) {
      return res.status(401).json({
        estado: "error",
        mensaje: "Error en la autenticacion.",
      });
    }

    // Si el usuario existe y la contrasena coincide: exito.
    return res.status(200).json({
      estado: "ok",
      mensaje: "Autenticacion satisfactoria.",
    });
  } catch (error) {
    console.error("Error en /login:", error);
    return res.status(500).json({
      estado: "error",
      mensaje: "Error interno al iniciar sesion.",
    });
  }
});

// ----------------------------------------------------------
// Exponemos la app de Express como una unica Cloud Function
// HTTPS. Firebase la publica en una URL como:
// https://<region>-<proyecto>.cloudfunctions.net/api/register
// https://<region>-<proyecto>.cloudfunctions.net/api/login
// ----------------------------------------------------------
exports.api = functions.https.onRequest(app);
