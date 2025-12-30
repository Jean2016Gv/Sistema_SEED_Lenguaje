var express = require('express');
var router = express.Router();
const client = require('../models/BaseDeDatos'); // Agrega esto arriba si no está

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/login', function(req, res, next) {
  res.render('login.ejs');
});

function requireLogin(req, res, next) {
  // Solo permite acceso si el usuario está autenticado y el id coincide
  if (req.session.id_docente && req.session.id_docente == req.params.id_docente) {
    return next();
  }
  // Si no está autenticado, redirige al login
  res.redirect('/login');
}

router.get('/loby/:id_docente', requireLogin, async function(req, res, next) {
  const id = req.params.id_docente;
  try {
    // Consulta el usuario por su ID
    const result = await client.query('SELECT usuario FROM docentes WHERE id_docente = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).send("Docente no encontrado");
    }
    const usuario = result.rows[0].usuario;
    res.render('loby.ejs', { usuario }); // Pasa el nombre de usuario a la vista
  } catch (error) {
    res.status(500).send("Error cargando el loby.");
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error al cerrar sesión:', err);
      return res.status(500).send('No se pudo cerrar la sesión');
    }
    res.clearCookie('connect.sid'); // Limpia la cookie de sesión
    res.redirect('/login');
  });
});

router.get('/*',(req,res)=>{
  res.render('notfound.ejs');
});

module.exports = router;
