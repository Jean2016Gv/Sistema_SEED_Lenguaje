const express = require('express');
const router = express.Router();
const client = require('../models/BaseDeDatos');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/login', function(req, res, next) {
  res.render('login.ejs');
});


// asegura que el usuario esté logueado y acceda a su propio lobby.
function requireLogin(req, res, next) {
  const sessionDocenteId = req.session.id_docente;
  const paramsDocenteIdStr = req.params.id_docente;

  // 1. Verificar que el usuario esté logueado
  if (!sessionDocenteId) {
    return res.redirect('/login');
  }

  // 2. Validar que el ID en la URL sea numérico
  if (!paramsDocenteIdStr || !/^\d+$/.test(paramsDocenteIdStr)) {
   
    return res.redirect('/login');
  }

  const paramsDocenteIdNum = parseInt(paramsDocenteIdStr, 10);

  // 3. Comparar ID de sesión con ID de URL
  if (sessionDocenteId === paramsDocenteIdNum) {
    next(); 
  } else {
    
    return res.redirect('/login');
  }
}

router.get('/loby/:id_docente', requireLogin, async function(req, res, next) {
  const docenteIdForQuery = req.session.id_docente;
  try {
    const result = await client.query('SELECT usuario FROM docentes WHERE id_docente = $1', [docenteIdForQuery]);
    if (result.rows.length === 0) {
      return res.status(404).send("Docente no encontrado.");
    }
    const usuario = result.rows[0].usuario;
    const id_docente = docenteIdForQuery;
    // Consulta los proyectos del docente
    const proyectosResult = await client.query('SELECT * FROM proyectos WHERE id_docente = $1', [id_docente]);
    const proyectos = proyectosResult.rows;
    res.render('loby.ejs', { usuario, id_docente, proyectos });
  } catch (error) {
    res.status(500).send("Error cargando el loby.");
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('❌ Error al cerrar sesión:', err);
      return res.status(500).send('No se pudo cerrar la sesión');
    }
    res.clearCookie('connect.sid'); 
    res.redirect('/login');
  });
});

// Middleware de protección ya definido arriba: requireLogin

router.get('/creacion/:id_docente', requireLogin, (req, res) => {
 
  const id_docente = req.session.id_docente || req.params.id_docente;
  res.render('creacion.ejs', { id_docente });
});
/*
// Ruta catch-all para GET requests no encontrados 
router.get('/*',(req,res)=>{
  res.render('notfound.ejs');
});
*/
module.exports = router;
