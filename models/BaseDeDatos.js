const { Client } = require('pg');
require('dotenv').config();

// Definir la URL de conexión con Render y fallback a configuración local
const connectionString = process.env.DATABASE_URL || `postgres://${process.env.LOCAL_DB_USER}:${process.env.LOCAL_DB_PASSWORD}@localhost:5432/registro_notas`;

const client = new Client({
  connectionString,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false, // Solo Render necesita SSL
});

client.connect()
  .then(() => console.log("✅ Conexión exitosa a PostgreSQL 🚀"))
  .catch(err => {
    console.error("❌ Error de conexión a PostgreSQL:", err);
    process.exit(1); // Finaliza el proceso si la conexión falla
  });

module.exports = client;