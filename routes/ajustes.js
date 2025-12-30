const express = require('express');
const router = express.Router();
const client = require('../models/BaseDeDatos'); // Ajusta la ruta si es necesario
const bcrypt = require('bcrypt');

// Middleware para asegurar que el usuario esté autenticado
function asegurarAutenticado(req, res, next) {
    if (req.session && req.session.docente) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Mostrar formulario de ajustes
router.get('/', asegurarAutenticado, async (req, res) => {
    const docente = req.session.docente;
    res.render('ajustes', { docente });
});

// Procesar actualización de datos
router.post('/:id/editar', asegurarAutenticado, async (req, res) => {
    const { nombre, apellido, usuario, correo, contraseña } = req.body;
    const id_docente = req.params.id;

    try {
        // Verificar si el correo ya existe para otro docente
        const correoQuery = `
            SELECT id_docente FROM docentes WHERE correo = $1 AND id_docente <> $2
        `;
        const correoResult = await client.query(correoQuery, [correo, id_docente]);
        if (correoResult.rows.length > 0) {
            // Correo ya registrado por otro docente
            return res.render('ajustes', { 
                docente: { ...req.session.docente, nombre, apellido, usuario, correo },
                error: 'El correo ya está registrado por otro usuario.'
            });
        }

        let query, params;
        if (contraseña && contraseña.trim() !== '') {
            const hash = await bcrypt.hash(contraseña, 10);
            query = `
                UPDATE docentes
                SET nombre = $1, apellido = $2, usuario = $3, correo = $4, contraseña = $5
                WHERE id_docente = $6
            `;
            params = [nombre, apellido, usuario, correo, hash, id_docente];
        } else {
            query = `
                UPDATE docentes
                SET nombre = $1, apellido = $2, usuario = $3, correo = $4
                WHERE id_docente = $5
            `;
            params = [nombre, apellido, usuario, correo, id_docente];
        }

        await client.query(query, params);

        // Actualiza los datos en sesión
        req.session.docente = {
            ...req.session.docente,
            nombre,
            apellido,
            usuario,
            correo
        };

        res.redirect('/ajustes?exito=1');
    } catch (error) {
        console.error('Error actualizando docente:', error);
        res.render('ajustes', { docente: req.session.docente, error: 'Error actualizando los datos.' });
    }
});

// Eliminar cuenta y datos relacionados
router.post('/:id/eliminar', asegurarAutenticado, async (req, res) => {
    const id_docente = req.params.id;
    try {
        // Solo necesitas eliminar el docente, el resto se borra en cascada
        await client.query(`
            DELETE FROM docentes WHERE id_docente = $1
        `, [id_docente]);

        // Cierra la sesión
        req.session.destroy(() => {
            res.redirect('/login?eliminado=1');
        });
    } catch (error) {
        console.error('Error eliminando cuenta:', error);
        res.render('ajustes', { docente: req.session.docente, error: 'Error eliminando la cuenta.' });
    }
});

module.exports = router;