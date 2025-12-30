const express = require('express');
const router = express.Router();
const client = require('../models/BaseDeDatos');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Almacén temporal de tokens en memoria
const resetTokens = new Map();

// Mostrar formulario para solicitar el correo
router.get('/', (req, res) => {
    res.render('forgot-password', { error: null, mensaje: null });
});

// Procesar el formulario y enviar el correo
router.post('/', async (req, res) => {
    const { correo } = req.body;
    try {
        // Buscar docente por correo
        const result = await client.query('SELECT * FROM docentes WHERE correo = $1', [correo]);
        if (result.rows.length === 0) {
            return res.render('forgot-password', { error: 'Correo no registrado.', mensaje: null });
        }
        const docente = result.rows[0];

        // Generar token seguro y guardar en memoria (expira en 1 hora)
        const token = crypto.randomBytes(32).toString('hex');
        resetTokens.set(token, { id_docente: docente.id_docente, expira: Date.now() + 60 * 60 * 1000 });

        // Configura tu transportador de correo (ajusta con tus credenciales)
      const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
  });

        // Enlace de recuperación
        const resetUrl = `${req.protocol}://${req.get('host')}/forgot-password/reset-password/${token}`;

        // Envía el correo
        await transporter.sendMail({
            from: 'programacion950@gmail.com',
            to: correo,
            subject: 'Recuperación de contraseña SEED',
            html: `<p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
                   <a href="${resetUrl}">${resetUrl}</a>
                   <p>Este enlace expirará en 1 hora.</p>`
        });

        res.render('forgot-password', { mensaje: 'Se ha enviado un enlace de recuperación a tu correo.', error: null });
    } catch (error) {
        console.error('Error en recuperación de contraseña:', error);
        res.render('forgot-password', { error: 'Error enviando el correo. Intenta más tarde.', mensaje: null });
    }
});

// Mostrar formulario para cambiar la contraseña
router.get('/reset-password/:token', (req, res) => {
    const { token } = req.params;
    const data = resetTokens.get(token);
    if (!data || data.expira < Date.now()) {
        return res.send('El enlace ha expirado o no es válido.');
    }
    res.render('reset-password', { token, error: null });
});

// Procesar el cambio de contraseña
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    const data = resetTokens.get(token);
    if (!data || data.expira < Date.now()) {
        return res.send('El enlace ha expirado o no es válido.');
    }
    try {
        const hash = await bcrypt.hash(password, 10);
        await client.query('UPDATE docentes SET contraseña = $1 WHERE id_docente = $2', [hash, data.id_docente]);
        resetTokens.delete(token);
        res.send('Contraseña actualizada correctamente. <a href="/login">Iniciar sesión</a>');
    } catch (error) {
        res.render('reset-password', { token, error: 'Error actualizando la contraseña.' });
    }
});

module.exports = router;