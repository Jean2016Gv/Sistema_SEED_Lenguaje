require('dotenv').config(); 

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');

// Limpieza automática de la carpeta uploads al iniciar el servidor
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
fs.readdir(uploadsDir, (err, files) => {
  if (err) return;
  files.forEach(file => {
    fs.unlink(path.join(uploadsDir, file), () => {});
  });
});

const isProduction = !!process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgres://${process.env.LOCAL_DB_USER}:${process.env.LOCAL_DB_PASSWORD}@localhost:5432/registro_notas`,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

var app = express(); 

app.use(session({
  store: new PgSession({
    pool,
    createTableIfMissing: true // 
  }),
  secret: process.env.SESSION_SECRET || "clave_segura",
  resave: false,
  saveUninitialized: false,
  cookie: {
  //  maxAge: 30 * 60 * 1000 // 30 minutos en milisegundos
  }
}));

require('./models/InicializarDB'); 

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const docentesRouter = require('./routes/docentes');
const loginRouter = require('./routes/login');
const proyectosRouter = require('./routes/proyectos');
const registroRouter = require('./routes/registro');
const imprimirRouter = require('./routes/imprimir');
const ajustesRouter = require('./routes/ajustes');
const forgotPasswordRouter = require('./routes/forgot-password');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false, parameterLimit: 10000, limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/', docentesRouter); 
app.use('/', loginRouter);
app.use('/proyectos', proyectosRouter);
app.use('/registro', registroRouter);
app.use('/registro', imprimirRouter);
app.use('/ajustes', ajustesRouter);
app.use('/forgot-password', forgotPasswordRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
