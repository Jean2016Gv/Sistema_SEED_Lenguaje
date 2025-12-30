const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const client = require('../models/BaseDeDatos'); // Conexión a PostgreSQL

router.post('/agregar-docente', async (req, res) => {
  try {
    const { nombre, apellido, usuario, correo, programa, password } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);

    await client.query(
      'INSERT INTO docentes (nombre, apellido, usuario, correo, programa, contraseña) VALUES ($1, $2, $3, $4, $5, $6)',
      [nombre, apellido, usuario, correo, programa, passwordHash]
    );

    console.log(`✅ Docente registrado: usuario=${usuario}, nombre=${nombre}, apellido=${apellido}, correo=${correo}, programa=${programa}`);
    res.redirect('/login'); // Redirige después de agregar el docente
  } catch (error) {
    console.error("❌ Error al agregar docente", error);
    res.status(500).send("Error al guardar el docente.");
  }
});

module.exports = router;