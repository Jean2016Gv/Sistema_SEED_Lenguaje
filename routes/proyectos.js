const express = require('express');
const router = express.Router();
const client = require('../models/BaseDeDatos');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

// Configuración de multer para guardar archivos temporalmente
const upload = multer({ dest: 'uploads/' });

// Middleware para proteger rutas 
function requireLogin(req, res, next) {
  if (req.session && req.session.id_docente) {
    next();
  } else {
    res.redirect('/login');
  }
}

// Crear un nuevo proyecto
router.post('/:id_docente', requireLogin, async (req, res) => {
  const { programa, materia, seccion } = req.body;
  const id_docente = parseInt(req.params.id_docente, 10);

  try {
    const result = await client.query(
      'INSERT INTO proyectos (programa, materia, seccion, id_docente) VALUES ($1, $2, $3, $4) RETURNING id_proyecto',
      [programa, materia, seccion, id_docente]
    );
    // Redirige al registro de notas del nuevo proyecto
    res.redirect(`/registro/${result.rows[0].id_proyecto}`);
  } catch (error) {
    console.error("❌ Error al crear proyecto:", error);
    res.status(500).send("Error al crear el proyecto.");
  }
});

router.post('/upload/:id_docente', requireLogin, upload.single('archivo'), async (req, res) => {
  console.log('Entró a la ruta de carga de PDF');
  const id_docente = parseInt(req.params.id_docente, 10);
  if (!req.file) {
    console.log('No se subió ningún archivo.');
    return res.status(400).send('No se subió ningún archivo.');
  }

  try {
    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(dataBuffer);

    console.log('Texto extraído del PDF:\n', pdfData.text);

    // Extraer solo las líneas que parecen datos de estudiantes
    const lineas = pdfData.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    console.log('Líneas extraídas:', lineas);

    // Buscar el índice donde empiezan los datos (después de la cabecera)
    const idxInicio = lineas.findIndex(l => l.startsWith('NRO')) + 1;
    console.log('Índice de inicio de datos:', idxInicio);

    // Procesar solo las líneas de estudiantes (hasta que termine la tabla)
    const estudiantes = [];
    for (let i = idxInicio; i < lineas.length; i++) {
      const linea = lineas[i];
      // Salta pies de página, pero no rompas el ciclo
      if (linea.startsWith('D.A.C.E') || linea.startsWith('Página')) continue;

      const match = linea.match(/^(\d+\s+)?(\d+)([A-ZÁÉÍÓÚÑ].+)$/i);
      if (match) {
        let cedula = match[2];
        const resto = match[3].trim();
        const partes = resto.split(/\s+/);
        let apellido = '';
        let nombre = '';
        if (partes.length >= 3) {
          apellido = partes.slice(0, 2).join(' ');
          nombre = partes.slice(2).join(' ');
        } else if (partes.length === 2) {
          apellido = partes[0];
          nombre = partes[1];
        } else {
          apellido = partes[0] || '';
          nombre = '';
        }

        cedula = limpiarCedula(cedula, estudiantes.length);

        estudiantes.push({
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          cedula
        });
        console.log(`Estudiante extraído: cedula=${cedula}, apellido=${apellido}, nombre=${nombre}`);
      } else {
        console.log(`Línea ignorada (no válida):`, linea);
      }
    }

    console.log('Estudiantes a insertar:', estudiantes);

    // Guardar estudiantes en la base de datos
    for (const est of estudiantes) {
      const existe = await client.query(
        'SELECT id_estudiante FROM estudiantes WHERE cedula = $1 AND id_docente = $2',
        [est.cedula, id_docente]
      );
      console.log(`¿Existe estudiante ${est.cedula}?`, existe.rows.length > 0);
      if (existe.rows.length === 0) {
        await client.query(
          'INSERT INTO estudiantes (nombre, apellido, cedula, id_docente, genero) VALUES ($1, $2, $3, $4, $5)',
          [est.nombre, est.apellido, est.cedula, id_docente, 'N/D']
        );
        console.log(`Insertado estudiante:`, est);
      } else {
        console.log(`Estudiante ya existe, no insertado:`, est);
      }
    }

    fs.unlinkSync(req.file.path);

    const proyecto = await client.query(
      'SELECT id_proyecto FROM proyectos WHERE id_docente = $1 ORDER BY id_proyecto DESC LIMIT 1',
      [id_docente]
    );
    console.log('Proyecto encontrado para redirigir:', proyecto.rows);

    if (proyecto.rows.length > 0) {
      res.redirect(`/registro/${proyecto.rows[0].id_proyecto}`);
    } else {
      res.redirect(`/loby/${id_docente}`);
    }
  } catch (error) {
    console.error('Error procesando el PDF:', error);
    res.status(500).send('Error procesando el PDF.');
  }
});

router.post('/crear-con-pdf/:id_docente', requireLogin, upload.single('archivo'), async (req, res) => {
  const id_docente = parseInt(req.params.id_docente, 10);
  const { programa, materia, seccion } = req.body;

  try {
    // 1. Crear el proyecto
    const result = await client.query(
      'INSERT INTO proyectos (programa, materia, seccion, id_docente) VALUES ($1, $2, $3, $4) RETURNING id_proyecto',
      [programa, materia, seccion, id_docente]
    );
    const id_proyecto = result.rows[0].id_proyecto;

    // 2. Procesar el PDF
    if (req.file) {
      console.log('PDF recibido, procesando...');
      const dataBuffer = fs.readFileSync(req.file.path);
      const pdfData = await pdfParse(dataBuffer);
      console.log('Texto extraído del PDF:\n', pdfData.text);
      const lineas = pdfData.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      console.log('Líneas extraídas:', lineas);
      const idxInicio = lineas.findIndex(l => l.startsWith('NRO')) + 1;
      console.log('Índice de inicio de datos:', idxInicio);

      const estudiantes = [];
      for (let i = idxInicio; i < lineas.length; i++) {
        const linea = lineas[i];
        // Salta pies de página, pero no rompas el ciclo
        if (linea.startsWith('D.A.C.E') || linea.startsWith('Página')) continue;

        // Regex: NRO opcional, cédula, resto
        const match = linea.match(/^(\d+\s+)?(\d+)([A-ZÁÉÍÓÚÑ].+)$/i);
        if (match) {
          // const nro = match[1] ? match[1].trim() : null; // Si quieres el NRO, pero no lo uses
          let cedula = match[2]; // <-- usa let, no const
          const resto = match[3].trim();
          const partes = resto.split(/\s+/);
          let apellido = '';
          let nombre = '';
          if (partes.length >= 3) {
            apellido = partes.slice(0, 2).join(' ');
            nombre = partes.slice(2).join(' ');
          } else if (partes.length === 2) {
            apellido = partes[0];
            nombre = partes[1];
          } else {
            apellido = partes[0] || '';
            nombre = '';
          }

           // Aplica la limpieza de cédula según el índice
        cedula = limpiarCedula(cedula, estudiantes.length);
        
          estudiantes.push({
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            cedula
          });
          console.log(`Estudiante extraído: cedula=${cedula}, apellido=${apellido}, nombre=${nombre}`);
        } else {
          console.log(`Línea ignorada (no válida):`, linea);
        }
      }

      for (const est of estudiantes) {
        const existe = await client.query(
          'SELECT id_estudiante FROM estudiantes WHERE cedula = $1 AND id_docente = $2',
          [est.cedula, id_docente]
        );
        let id_estudiante;
        if (existe.rows.length === 0) {
          const insertado = await client.query(
            'INSERT INTO estudiantes (nombre, apellido, cedula, id_docente, genero) VALUES ($1, $2, $3, $4, $5) RETURNING id_estudiante',
            [est.nombre, est.apellido, est.cedula, id_docente, 'N/D']
          );
          id_estudiante = insertado.rows[0].id_estudiante;
        } else {
          id_estudiante = existe.rows[0].id_estudiante;
        }

        // Relacionar estudiante con el proyecto (aunque no tenga notas)
        await client.query(
          `INSERT INTO estudiante_proyecto_progreso (id_estudiante, id_proyecto)
           VALUES ($1, $2)
           ON CONFLICT (id_estudiante, id_proyecto) DO NOTHING`,
          [id_estudiante, id_proyecto]
        );
      }
    } else {
      console.log('No se recibió archivo PDF');
    }

    res.redirect(`/registro/${id_proyecto}`);
  } catch (error) {
    console.error('Error al crear proyecto y/o cargar PDF:', error);
    res.status(500).send('Error al crear proyecto y/o cargar PDF.');
  } finally {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

router.delete('/eliminar/:id_proyecto', requireLogin, async (req, res) => {
  const id_proyecto = parseInt(req.params.id_proyecto, 10);
  try {
    // 1. Elimina el proyecto (esto elimina en cascada en estudiante_proyecto_progreso y notas)
    await client.query('DELETE FROM proyectos WHERE id_proyecto = $1', [id_proyecto]);

    // 2. Elimina estudiantes que ya no estén enlazados a ningún proyecto
    await client.query(`
      DELETE FROM estudiantes
      WHERE id_estudiante NOT IN (
        SELECT id_estudiante FROM estudiante_proyecto_progreso
      )
    `);

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error al eliminar proyecto:", error);
    res.status(500).send("Error al eliminar el proyecto.");
  }
});

function limpiarCedula(cedula, index) {
  if (typeof cedula !== 'string') cedula = String(cedula);
  if (index < 9) {
    // Elimina el primer dígito
    return cedula.slice(1);
  } else {
    // Elimina los primeros dos dígitos
    return cedula.slice(2);
  }
}

module.exports = router;