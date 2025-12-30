const client = require('./BaseDeDatos'); // Importamos la conexión

const crearTablas = async () => {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS docentes (
        id_docente SERIAL PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL,
        apellido VARCHAR(50) NOT NULL,
        usuario VARCHAR(50) NOT NULL UNIQUE,
        programa TEXT NOT NULL,
        correo VARCHAR(100) UNIQUE NOT NULL,
        contraseña VARCHAR(255) NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS proyectos (
        id_proyecto SERIAL PRIMARY KEY,
        programa VARCHAR(100) NOT NULL,
        materia VARCHAR(100) NOT NULL,
        seccion VARCHAR(50) NOT NULL,
        id_docente INTEGER NOT NULL,
        CONSTRAINT fk_docente_proyecto
          FOREIGN KEY(id_docente)
            REFERENCES docentes(id_docente)
            ON DELETE CASCADE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS estudiantes (
        id_estudiante SERIAL PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL,
        apellido VARCHAR(50) NOT NULL,
        cedula VARCHAR(20) NOT NULL,
        genero VARCHAR(20), -- Made nullable to allow empty string or NULL if not provided
        id_docente INTEGER NOT NULL,
        CONSTRAINT fk_docente
          FOREIGN KEY(id_docente)
            REFERENCES docentes(id_docente)
            ON DELETE CASCADE,
        CONSTRAINT estudiantes_cedula_docente_unique UNIQUE (cedula, id_docente)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notas (
        id_nota SERIAL PRIMARY KEY,
        nota NUMERIC(5,2) NOT NULL,
        porcentaje NUMERIC(5,2) NOT NULL,
        lapso INTEGER NOT NULL,
        nota_total NUMERIC(5,2) NOT NULL,
        nombre_evaluacion VARCHAR(100) NOT NULL,
        porcentaje_obtenido NUMERIC(5,2),
        id_estudiante INTEGER NOT NULL,
        id_proyecto INTEGER NOT NULL,
        CONSTRAINT fk_estudiante
          FOREIGN KEY(id_estudiante)
            REFERENCES estudiantes(id_estudiante)
            ON DELETE CASCADE,
        CONSTRAINT fk_proyecto
          FOREIGN KEY(id_proyecto)
            REFERENCES proyectos(id_proyecto)
            ON DELETE CASCADE,
        CONSTRAINT notas_unica UNIQUE (id_estudiante, id_proyecto, lapso, nombre_evaluacion)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS estudiante_proyecto_progreso (
        id_estudiante_proyecto SERIAL PRIMARY KEY,
        id_estudiante INTEGER NOT NULL,
        id_proyecto INTEGER NOT NULL,
        nota_final_proyecto NUMERIC(5,2),
        status_proyecto VARCHAR(50),
        nota_final_lapso1 NUMERIC(5,2), -- Nuevo campo
        nota_final_lapso2 NUMERIC(5,2), -- Nuevo campo
        nota_final_lapso3 NUMERIC(5,2), -- Nuevo campo
        porcentaje_obtenido_lapso1 NUMERIC(5,2), -- Nuevo campo
        porcentaje_obtenido_lapso2 NUMERIC(5,2), -- Nuevo campo
        porcentaje_obtenido_lapso3 NUMERIC(5,2), -- Nuevo campo
        CONSTRAINT fk_estudiante_progreso FOREIGN KEY(id_estudiante) REFERENCES estudiantes(id_estudiante) ON DELETE CASCADE,
        CONSTRAINT fk_proyecto_progreso FOREIGN KEY(id_proyecto) REFERENCES proyectos(id_proyecto) ON DELETE CASCADE,
        CONSTRAINT estudiante_proyecto_progreso_unica UNIQUE (id_estudiante, id_proyecto)
      );
    `);

    console.log("✅ Tablas creadas correctamente");
  } catch (error) {
    console.error("❌ Error creando tablas", error);
  } finally {
    // client.end(); // NO volver a cerrar la conexión global, fui pendejo y rompi todo
  }
};

crearTablas();