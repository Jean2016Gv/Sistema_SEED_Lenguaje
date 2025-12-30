const express = require('express');
const router = express.Router();
const client = require('../models/BaseDeDatos');


function requireProjectOwner(req, res, next) {
  const sessionDocenteId = req.session.id_docente;
  const id_proyecto = parseInt(req.params.id_proyecto, 10);

  if (!sessionDocenteId) {
    return res.redirect('/login');
  }

  client.query('SELECT id_docente FROM proyectos WHERE id_proyecto = $1', [id_proyecto])
    .then(result => {
      if (result.rows.length === 0) {
        return res.status(404).send("Proyecto no encontrado.");
      }
      const projectOwnerId = result.rows[0].id_docente;
      if (projectOwnerId !== sessionDocenteId) {
        return res.redirect('/login');
      }
      next();
    })
    .catch(error => {
      console.error("❌ Error verificando propietario del proyecto:", error);
      res.status(500).send("Error interno.");
    });
}

router.get('/:id_proyecto/imprimir', requireProjectOwner, async (req, res) => {
  const id_proyecto = parseInt(req.params.id_proyecto, 10);
  try {
    // Trae el proyecto
    const proyectoResult = await client.query(
      `SELECT p.*, d.nombre AS docente_nombre, d.apellido AS docente_apellido
       FROM proyectos p
       JOIN docentes d ON p.id_docente = d.id_docente
       WHERE p.id_proyecto = $1`,
      [id_proyecto]
    );
    const proyecto = proyectoResult.rows[0];

    // Trae solo los estudiantes asociados a este proyecto y sus notas finales
    const estudiantesBaseResult = await client.query(`
      SELECT 
        e.id_estudiante, 
        e.nombre, 
        e.apellido, 
        e.cedula, 
        e.genero,
        ep.nota_final_lapso1,
        ep.nota_final_lapso2,
        ep.nota_final_lapso3,
        ep.nota_final_proyecto AS nota_final,
        ep.status_proyecto AS status
      FROM estudiante_proyecto_progreso ep
      JOIN estudiantes e ON ep.id_estudiante = e.id_estudiante
      WHERE ep.id_proyecto = $1
      ORDER BY e.apellido, e.nombre
    `, [id_proyecto]);

    let estudiantes = estudiantesBaseResult.rows;

    // Trae las actividades y notas de cada estudiante por lapso
    const actividadesResult = await client.query(`
      SELECT 
        n.id_estudiante,
        n.lapso,
        n.nombre_evaluacion,
        n.nota
      FROM notas n
      WHERE n.id_proyecto = $1
      ORDER BY n.lapso, n.nombre_evaluacion, n.id_estudiante
    `, [id_proyecto]);

    // Organiza las notas por estudiante y lapso
    const actividadesPorEstudiante = {};
    actividadesResult.rows.forEach(row => {
      if (!actividadesPorEstudiante[row.id_estudiante]) actividadesPorEstudiante[row.id_estudiante] = {};
      if (!actividadesPorEstudiante[row.id_estudiante][row.lapso]) actividadesPorEstudiante[row.id_estudiante][row.lapso] = {};
      actividadesPorEstudiante[row.id_estudiante][row.lapso][row.nombre_evaluacion] = row.nota;
    });

    // Extrae los nombres de actividades únicos por lapso (en orden)
    const nombresActividades = [[], [], []];
    actividadesResult.rows.forEach(row => {
      const lapsoIdx = row.lapso - 1;
      if (lapsoIdx >= 0 && lapsoIdx < 3 && row.nombre_evaluacion && !nombresActividades[lapsoIdx].includes(row.nombre_evaluacion)) {
        nombresActividades[lapsoIdx].push(row.nombre_evaluacion);
      }
    });
    // Rellena hasta 3 actividades por lapso para mantener la tabla
    for (let i = 0; i < 3; i++) {
      while (nombresActividades[i].length < 3) {
        nombresActividades[i].push('');
      }
    }

    res.render('imprimir', { proyecto, estudiantes, actividadesPorEstudiante, nombresActividades });
  } catch (error) {
    console.error("❌ Error al cargar impresión:", error);
    res.status(500).send("Error al cargar la impresión.");
  }
});

module.exports = router;