const express = require('express');
const router = express.Router();
const client = require('../models/BaseDeDatos');

// Middleware para proteger la ruta
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

// Mostrar la planilla
router.get('/:id_proyecto', requireProjectOwner, async (req, res) => {
  const id_proyecto = parseInt(req.params.id_proyecto, 10);
  try {
    // Trae el proyecto y el docente dueño
    const proyectoResult = await client.query(
      `SELECT p.*, d.nombre AS docente_nombre, d.apellido AS docente_apellido
       FROM proyectos p
       JOIN docentes d ON p.id_docente = d.id_docente
       WHERE p.id_proyecto = $1`,
      [id_proyecto]
    );
    const proyecto = proyectoResult.rows[0];

    if (!proyecto) {
      return res.status(404).send("Proyecto no encontrado.");
    }

    // 1. Trae solo los estudiantes que tienen notas o progreso en este proyecto
    const estudiantesBaseResult = await client.query(`
      SELECT DISTINCT e.id_estudiante, e.nombre, e.apellido, e.cedula, e.genero
      FROM estudiantes e
      LEFT JOIN notas n ON n.id_estudiante = e.id_estudiante AND n.id_proyecto = $1
      LEFT JOIN estudiante_proyecto_progreso p ON p.id_estudiante = e.id_estudiante AND p.id_proyecto = $1
      WHERE n.id_proyecto = $1 OR p.id_proyecto = $1
      ORDER BY e.apellido, e.nombre
    `, [id_proyecto]);

    let estudiantes = [];
    let notasResult = { rows: [] };
    let progresoResult = { rows: [] };

    // Traer todas las notas de este proyecto
notasResult = await client.query(
  'SELECT * FROM notas WHERE id_proyecto = $1',
  [id_proyecto]
);

// Traer el progreso de los estudiantes en este proyecto
progresoResult = await client.query(
  'SELECT * FROM estudiante_proyecto_progreso WHERE id_proyecto = $1',
  [id_proyecto]
);

    // 1. Obtener todas las actividades únicas por lapso para la cabecera
    function getActividadesCabecera(lapso) {
      const acts = notasResult.rows.filter(n => Number(n.lapso) === lapso);
      const actividadesUnicas = [];
      acts.forEach(act => {
        if (act.nombre_evaluacion && !actividadesUnicas.some(a => a.nombre_evaluacion === act.nombre_evaluacion)) {
          actividadesUnicas.push(act);
        }
      });
      while (actividadesUnicas.length < 3) {
        actividadesUnicas.push({ nombre_evaluacion: '', porcentaje: '' });
      }
      return actividadesUnicas;
    }

    const [cab1_1, cab1_2, cab1_3] = getActividadesCabecera(1);
    const [cab2_1, cab2_2, cab2_3] = getActividadesCabecera(2);
    const [cab3_1, cab3_2, cab3_3] = getActividadesCabecera(3);

    // 2. Al mapear estudiantes, busca la nota por nombre de actividad y lapso
    estudiantes = estudiantesBaseResult.rows.map(est => {
      const studentNotas = notasResult.rows.filter(n => n.id_estudiante === est.id_estudiante);

      // Lapso 1
      const act1_1 = studentNotas.find(n => Number(n.lapso) === 1 && n.nombre_evaluacion === cab1_1.nombre_evaluacion) || {};
      const act1_2 = studentNotas.find(n => Number(n.lapso) === 1 && n.nombre_evaluacion === cab1_2.nombre_evaluacion) || {};
      const act1_3 = studentNotas.find(n => Number(n.lapso) === 1 && n.nombre_evaluacion === cab1_3.nombre_evaluacion) || {};
      // Lapso 2
      const act2_1 = studentNotas.find(n => Number(n.lapso) === 2 && n.nombre_evaluacion === cab2_1.nombre_evaluacion) || {};
      const act2_2 = studentNotas.find(n => Number(n.lapso) === 2 && n.nombre_evaluacion === cab2_2.nombre_evaluacion) || {};
      const act2_3 = studentNotas.find(n => Number(n.lapso) === 2 && n.nombre_evaluacion === cab2_3.nombre_evaluacion) || {};
      // Lapso 3
      const act3_1 = studentNotas.find(n => Number(n.lapso) === 3 && n.nombre_evaluacion === cab3_1.nombre_evaluacion) || {};
      const act3_2 = studentNotas.find(n => Number(n.lapso) === 3 && n.nombre_evaluacion === cab3_2.nombre_evaluacion) || {};
      const act3_3 = studentNotas.find(n => Number(n.lapso) === 3 && n.nombre_evaluacion === cab3_3.nombre_evaluacion) || {};

      const studentProgreso = progresoResult.rows.find(p => p.id_estudiante === est.id_estudiante);

      return {
        ...est,
        // Lapso 1
        nota1_1: act1_1.nota ?? '',
        porcentaje1_1: act1_1.porcentaje ?? '',
        actividad1_1: act1_1.nombre_evaluacion ?? '',
        nota1_2: act1_2.nota ?? '',
        porcentaje1_2: act1_2.porcentaje ?? '',
        actividad1_2: act1_2.nombre_evaluacion ?? '',
        nota1_3: act1_3.nota ?? '',
        porcentaje1_3: act1_3.porcentaje ?? '',
        actividad1_3: act1_3.nombre_evaluacion ?? '',
        // Lapso 2
        nota2_1: act2_1.nota ?? '',
        porcentaje2_1: act2_1.porcentaje ?? '',
        actividad2_1: act2_1.nombre_evaluacion ?? '',
        nota2_2: act2_2.nota ?? '',
        porcentaje2_2: act2_2.porcentaje ?? '',
        actividad2_2: act2_2.nombre_evaluacion ?? '',
        nota2_3: act2_3.nota ?? '',
        porcentaje2_3: act2_3.porcentaje ?? '',
        actividad2_3: act2_3.nombre_evaluacion ?? '',
        // Lapso 3
        nota3_1: act3_1.nota ?? '',
        porcentaje3_1: act3_1.porcentaje ?? '',
        actividad3_1: act3_1.nombre_evaluacion ?? '',
        nota3_2: act3_2.nota ?? '',
        porcentaje3_2: act3_2.porcentaje ?? '',
        actividad3_2: act3_2.nombre_evaluacion ?? '',
        nota3_3: act3_3.nota ?? '',
        porcentaje3_3: act3_3.porcentaje ?? '',
        actividad3_3: act3_3.nombre_evaluacion ?? '',
        // Progreso
        nota_final_lapso1: studentProgreso?.nota_final_lapso1 ?? '',
        nota_final_lapso2: studentProgreso?.nota_final_lapso2 ?? '',
        nota_final_lapso3: studentProgreso?.nota_final_lapso3 ?? '',
        nota_final: studentProgreso?.nota_final_proyecto ?? '',
        status: studentProgreso?.status_proyecto ?? ''
      };
    });

    // 3. Para la cabecera, usa los nombres y porcentajes de las actividades únicas
    res.render('registro', {
      proyecto,
      estudiantes,
      // Lapso 1
      porcentaje1_1: cab1_1.porcentaje, actividad1_1: cab1_1.nombre_evaluacion,
      porcentaje1_2: cab1_2.porcentaje, actividad1_2: cab1_2.nombre_evaluacion,
      porcentaje1_3: cab1_3.porcentaje, actividad1_3: cab1_3.nombre_evaluacion,
      // Lapso 2
      porcentaje2_1: cab2_1.porcentaje, actividad2_1: cab2_1.nombre_evaluacion,
      porcentaje2_2: cab2_2.porcentaje, actividad2_2: cab2_2.nombre_evaluacion,
      porcentaje2_3: cab2_3.porcentaje, actividad2_3: cab2_3.nombre_evaluacion,
      // Lapso 3
      porcentaje3_1: cab3_1.porcentaje, actividad3_1: cab3_1.nombre_evaluacion,
      porcentaje3_2: cab3_2.porcentaje, actividad3_2: cab3_2.nombre_evaluacion,
      porcentaje3_3: cab3_3.porcentaje, actividad3_3: cab3_3.nombre_evaluacion,
    });
  } catch (error) {
    console.error("❌ Error al cargar proyecto:", error);
    res.status(500).send("Error al cargar el proyecto.");
  }
});







// Guardar estudiantes y notas (todos los campos manuales)
router.post('/:id_proyecto', requireProjectOwner, async (req, res) => {
  const id_proyecto = parseInt(req.params.id_proyecto, 10);
  let {
    'apellido[]': apellido,
    'nombre[]': nombre,
    'cedula[]': cedula,
    'genero[]': genero,
    // Notas por actividad y lapso
    'nota1_1[]': nota1_1,
    'nota1_2[]': nota1_2,
    'nota2_1[]': nota2_1,
    'nota2_2[]': nota2_2,
    'nota3_1[]': nota3_1,
    'nota3_2[]': nota3_2,
    // Otros campos
    'notaFinal[]': notaFinal,
    'status[]': status,
    // Porcentajes y actividades por lapso y actividad (cabecera)
    porcentaje1_1, porcentaje1_2,
    porcentaje2_1, porcentaje2_2,
    porcentaje3_1, porcentaje3_2,
    actividad1_1, actividad1_2,
    actividad2_1, actividad2_2,
    actividad3_1, actividad3_2,
    // Nuevas notas, porcentajes y actividades (tercer intento)
    'nota1_3[]': nota1_3,
    'nota2_3[]': nota2_3,
    'nota3_3[]': nota3_3,
    porcentaje1_3, porcentaje2_3, porcentaje3_3,
    actividad1_3, actividad2_3, actividad3_3
  } = req.body;

  // Convierte a array los campos de porcentaje y actividad por estudiante
  function toArray(val) {
    if (Array.isArray(val)) return val;
    if (typeof val === 'undefined') return [];
    return [val];
  }



  function toArray(val) {
    if (Array.isArray(val)) return val;
    if (typeof val === 'undefined') return [];
    return [val];
  }
  apellido = toArray(apellido);
  nombre = toArray(nombre);
  cedula = toArray(cedula);
  genero = toArray(genero);
  nota1_1 = toArray(nota1_1);
  nota1_2 = toArray(nota1_2);
  nota2_1 = toArray(nota2_1);
  nota2_2 = toArray(nota2_2);
  nota3_1 = toArray(nota3_1);
  nota3_2 = toArray(nota3_2);
  notaFinal = toArray(notaFinal);
  status = toArray(status);
  nota1_3 = toArray(nota1_3);
  nota2_3 = toArray(nota2_3);
  nota3_3 = toArray(nota3_3);

  try {
    const proyectoResult = await client.query(
      'SELECT id_docente FROM proyectos WHERE id_proyecto = $1',
      [id_proyecto]
    );
    if (proyectoResult.rows.length === 0) {
      return res.status(404).send("Proyecto no encontrado.");
    }
    const id_docente = proyectoResult.rows[0].id_docente;

    for (let i = 0; i < nombre.length; i++) {
      if (!cedula[i] || !nombre[i] || !apellido[i]) continue;

      let estudianteResult = await client.query(
        'SELECT id_estudiante FROM estudiantes WHERE cedula = $1 AND id_docente = $2',
        [cedula[i], id_docente]
      );
      let id_estudiante;

      if (estudianteResult.rows.length === 0) {
        const insertEst = await client.query(
          'INSERT INTO estudiantes (nombre, apellido, genero, id_docente, cedula) VALUES ($1, $2, $3, $4, $5) RETURNING id_estudiante',
          [nombre[i], apellido[i], genero[i], id_docente, cedula[i]]
        );
        id_estudiante = insertEst.rows[0].id_estudiante;
      } else {
        id_estudiante = estudianteResult.rows[0].id_estudiante;
        await client.query(
          'UPDATE estudiantes SET nombre = $1, apellido = $2, cedula = $3, genero = $4 WHERE id_estudiante = $5',
          [nombre[i], apellido[i], cedula[i], genero[i], id_estudiante]
        );
      }

      // Procesar las dos actividades por cada lapso
     const actividades = [
  { lapso: 1, nota: nota1_1[i], porcentaje: porcentaje1_1, actividad: actividad1_1 },
  { lapso: 1, nota: nota1_2[i], porcentaje: porcentaje1_2, actividad: actividad1_2 },
  { lapso: 1, nota: nota1_3[i], porcentaje: porcentaje1_3, actividad: actividad1_3 },
  { lapso: 2, nota: nota2_1[i], porcentaje: porcentaje2_1, actividad: actividad2_1 },
  { lapso: 2, nota: nota2_2[i], porcentaje: porcentaje2_2, actividad: actividad2_2 },
  { lapso: 2, nota: nota2_3[i], porcentaje: porcentaje2_3, actividad: actividad2_3 },
  { lapso: 3, nota: nota3_1[i], porcentaje: porcentaje3_1, actividad: actividad3_1 },
  { lapso: 3, nota: nota3_2[i], porcentaje: porcentaje3_2, actividad: actividad3_2 },
  { lapso: 3, nota: nota3_3[i], porcentaje: porcentaje3_3, actividad: actividad3_3 }
];

      // Cálculo de notas finales por lapso
      let sumaNotasLapso = { 1: 0, 2: 0, 3: 0 };
      let sumaPuntajeMaxLapso = { 1: 0, 2: 0, 3: 0 }; // Agrega esto antes del ciclo

      for (const act of actividades) {
        const nVal = act.nota && act.nota.toString().trim() !== '' ? parseFloat(act.nota) : null;
        const pVal = act.porcentaje && act.porcentaje.toString().trim() !== '' ? parseFloat(act.porcentaje) : null;
        const aVal = act.actividad ? act.actividad.trim() : '';

        if (nVal !== null && pVal !== null && aVal !== '') {
          const notaTotalLapso = (nVal * pVal) / 100;
          sumaNotasLapso[act.lapso] += notaTotalLapso;
          sumaPuntajeMaxLapso[act.lapso] += pVal; // Suma el puntaje máximo posible
          await client.query(
            `INSERT INTO notas (id_estudiante, id_proyecto, lapso, nota, porcentaje, nombre_evaluacion, nota_total)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id_estudiante, id_proyecto, lapso, nombre_evaluacion)
             DO UPDATE SET
                nota = EXCLUDED.nota,
                porcentaje = EXCLUDED.porcentaje,
                nombre_evaluacion = EXCLUDED.nombre_evaluacion,
                nota_total = EXCLUDED.nota_total`,
            [id_estudiante, id_proyecto, act.lapso, nVal, pVal, aVal, notaTotalLapso]
          );
        } else {
          await client.query(
            'DELETE FROM notas WHERE id_estudiante = $1 AND id_proyecto = $2 AND lapso = $3 AND nombre_evaluacion = $4',
            [id_estudiante, id_proyecto, act.lapso, aVal]
          );
        }
      }

      // Elimina notas antiguas que ya no existen en la cabecera
const actividadesCabecera = [
  { lapso: 1, actividad: actividad1_1 },
  { lapso: 1, actividad: actividad1_2 },
  { lapso: 2, actividad: actividad2_1 },
  { lapso: 2, actividad: actividad2_2 },
  { lapso: 3, actividad: actividad3_1 },
  { lapso: 3, actividad: actividad3_2 }
];

// Borra todas las notas de este estudiante/proyecto que no estén en las actividades actuales de la cabecera
await client.query(
  `DELETE FROM notas
   WHERE id_estudiante = $1 AND id_proyecto = $2
   AND NOT (
     (lapso = 1 AND nombre_evaluacion = $3) OR
     (lapso = 1 AND nombre_evaluacion = $4) OR
     (lapso = 1 AND nombre_evaluacion = $5) OR
     (lapso = 2 AND nombre_evaluacion = $6) OR
     (lapso = 2 AND nombre_evaluacion = $7) OR
     (lapso = 2 AND nombre_evaluacion = $8) OR
     (lapso = 3 AND nombre_evaluacion = $9) OR
     (lapso = 3 AND nombre_evaluacion = $10) OR
     (lapso = 3 AND nombre_evaluacion = $11)
   )`,
  [
    id_estudiante, id_proyecto,
    actividad1_1, actividad1_2, actividad1_3,
    actividad2_1, actividad2_2, actividad2_3,
    actividad3_1, actividad3_2, actividad3_3
  ]
);

      // Guardar nota final de cada lapso y nota definitiva
      let nota_final_lapso1 = Math.round(sumaNotasLapso[1] * 100) / 100;
      let nota_final_lapso2 = Math.round(sumaNotasLapso[2] * 100) / 100;
      let nota_final_lapso3 = Math.round(sumaNotasLapso[3] * 100) / 100;

      // Porcentaje obtenido por lapso
      let porcentaje_obtenido_lapso1 = sumaPuntajeMaxLapso[1] > 0 ? Math.round((sumaNotasLapso[1] / sumaPuntajeMaxLapso[1]) * 10000) / 100 : 0;
      let porcentaje_obtenido_lapso2 = sumaPuntajeMaxLapso[2] > 0 ? Math.round((sumaNotasLapso[2] / sumaPuntajeMaxLapso[2]) * 10000) / 100 : 0;
      let porcentaje_obtenido_lapso3 = sumaPuntajeMaxLapso[3] > 0 ? Math.round((sumaNotasLapso[3] / sumaPuntajeMaxLapso[3]) * 10000) / 100 : 0;

      // Suma directa de los tres lapsos (aunque alguno sea 0)
      let notaFinal10 = 
          (isNaN(nota_final_lapso1) ? 0 : nota_final_lapso1) +
          (isNaN(nota_final_lapso2) ? 0 : nota_final_lapso2) +
          (isNaN(nota_final_lapso3) ? 0 : nota_final_lapso3);

      // Ajuste de redondeo para casos como 5.99
      if (notaFinal10 >= 5.5 && notaFinal10 < 6) {
        notaFinal10 = 6;
      }

      let studentStatus = notaFinal10 >= 6 ? 'Aprobado' : 'Reprobado';

      await client.query(
        `INSERT INTO estudiante_proyecto_progreso (id_estudiante, id_proyecto, nota_final_proyecto, status_proyecto, nota_final_lapso1, nota_final_lapso2, nota_final_lapso3, porcentaje_obtenido_lapso1, porcentaje_obtenido_lapso2, porcentaje_obtenido_lapso3)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id_estudiante, id_proyecto) DO UPDATE SET
            nota_final_proyecto = EXCLUDED.nota_final_proyecto,
            status_proyecto = EXCLUDED.status_proyecto,
            nota_final_lapso1 = EXCLUDED.nota_final_lapso1,
            nota_final_lapso2 = EXCLUDED.nota_final_lapso2,
            nota_final_lapso3 = EXCLUDED.nota_final_lapso3,
            porcentaje_obtenido_lapso1 = EXCLUDED.porcentaje_obtenido_lapso1,
            porcentaje_obtenido_lapso2 = EXCLUDED.porcentaje_obtenido_lapso2,
            porcentaje_obtenido_lapso3 = EXCLUDED.porcentaje_obtenido_lapso3`,
        [id_estudiante, id_proyecto, notaFinal10, studentStatus, nota_final_lapso1, nota_final_lapso2, nota_final_lapso3, porcentaje_obtenido_lapso1, porcentaje_obtenido_lapso2, porcentaje_obtenido_lapso3]
      );
    }
    res.redirect(`/registro/${id_proyecto}`);
  } catch (error) {
    console.error("❌ Error al guardar estudiantes y notas:", error);
    res.status(500).send("Error al guardar los datos.");
  }
});

// Eliminar estudiante
router.delete('/eliminar-estudiante/:id_estudiante/:id_proyecto', async (req, res) => {
  const id_estudiante = parseInt(req.params.id_estudiante, 10);
  const id_proyecto = parseInt(req.params.id_proyecto, 10);
  try {
    // Elimina las notas del estudiante solo en este proyecto
    await client.query('DELETE FROM notas WHERE id_estudiante = $1 AND id_proyecto = $2', [id_estudiante, id_proyecto]);
    // Elimina el progreso del estudiante solo en este proyecto
    await client.query('DELETE FROM estudiante_proyecto_progreso WHERE id_estudiante = $1 AND id_proyecto = $2', [id_estudiante, id_proyecto]);
    res.sendStatus(200);
  } catch (error) {
    res.status(500).send("Error al eliminar el estudiante del proyecto.");
  }
});

// Vaciar todas las notas de un estudiante en un proyecto (sin eliminarlo del proyecto)
router.delete('/vaciar-notas-estudiante/:id_estudiante/:id_proyecto', async (req, res) => {
  const id_estudiante = parseInt(req.params.id_estudiante, 10);
  const id_proyecto = parseInt(req.params.id_proyecto, 10);
  try {
    // Elimina todas las notas del estudiante solo en este proyecto
    await client.query(
      'DELETE FROM notas WHERE id_estudiante = $1 AND id_proyecto = $2',
      [id_estudiante, id_proyecto]
    );
    // Opcional: también puedes poner en blanco las notas finales y status en estudiante_proyecto_progreso
    await client.query(
      `UPDATE estudiante_proyecto_progreso
       SET nota_final_proyecto = NULL,
           status_proyecto = NULL,
           nota_final_lapso1 = NULL,
           nota_final_lapso2 = NULL,
           nota_final_lapso3 = NULL,
           porcentaje_obtenido_lapso1 = NULL,
           porcentaje_obtenido_lapso2 = NULL,
           porcentaje_obtenido_lapso3 = NULL
       WHERE id_estudiante = $1 AND id_proyecto = $2`,
      [id_estudiante, id_proyecto]
    );
    res.sendStatus(200);
  } catch (error) {
    res.status(500).send("Error al vaciar las notas del estudiante en este proyecto.");
  }
});



module.exports = router;