const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const client = require('../models/BaseDeDatos'); // Conexión a PostgreSQL

router.post('/login', async (req, res) => {
  try {
    const { usuario, password, programa } = req.body;

    // Buscar el usuario y el programa en la base de datos
    const result = await client.query(
      'SELECT * FROM docentes WHERE usuario = $1 AND programa = $2',
      [usuario, programa]
    );

    if (result.rows.length === 0) {
      return res.status(401).send("❌ Usuario o programa incorrecto.");
    }

    const docente = result.rows[0];

    // Comparar la contraseña ingresada con la almacenada (hasheada)
    const esValida = await bcrypt.compare(password, docente.contraseña);

    if (!esValida) {
      return res.status(401).send("❌ Contraseña incorrecta.");
    }

    // Guarda el objeto completo en la sesión:
    req.session.id_docente = docente.id_docente;
    req.session.docente = {
      id_docente: docente.id_docente,
      nombre: docente.nombre,
      apellido: docente.apellido,
      usuario: docente.usuario,
      correo: docente.correo
    };

    console.log(`✅ Acceso al lobby: usuario=${usuario}, programa=${programa}, id_docente=${docente.id_docente}`);
    return res.redirect(`/loby/${docente.id_docente}`);
  } catch (error) {
    console.error("❌ Error en el login", error);
    return res.status(500).send("Error interno en el servidor.");
  }
});

module.exports = router;