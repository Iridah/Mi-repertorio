// Definicion de Variables
const express = require('express');
const chalk = require('chalk');
const { Pool } = require('pg');

// Conexion a Postgresql
const pool = new Pool({
  user: 'planta',
  password: 'macetero',
  host: 'localhost',
  database: 'repertorio',
  port: 5432
});

// Crea la BD 'repertorio'
const createDatabase = async () => {
    const query = `
      CREATE DATABASE IF NOT EXISTS repertorio
    `;
    await pool.query(query);
    console.log(chalk.green('Database ' + chalk.bold('repertorio') + ' creada'));
  };

// Crear la tabla 'canciones' 
const createTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS canciones (
      id SERIAL PRIMARY KEY,
      titulo VARCHAR(50) NOT NULL,
      artista VARCHAR(50) NOT NULL,
      tono VARCHAR(10) NOT NULL
    )
  `;
  await pool.query(query);
  console.log(chalk.green('Tabla ' + chalk.bold('canciones') + ' creada'));
};

// Select * from
const getSongs = async () => {
    const query = 'SELECT * FROM repertorio.canciones';
    const result = await pool.query(query);
    const songs = result.rows;
    return songs;
  };

// Actualizar registro
const updateSong = async (id, songData) => {
    const { titulo, artista, tono } = songData;
  
    const query = `
      UPDATE repertorio.canciones
      SET titulo = $1, artista = $2, tono = $3
      WHERE id = $4
    `;
    const values = [titulo, artista, tono, id];
  
    await pool.query(query, values);
  };


// Elimina Registro
const deleteSong = async (id) => {
    const query = `
      DELETE FROM repertorio.canciones
      WHERE id = $1
    `;
    const values = [id];
  
    await pool.query(query, values);
  };

// Definicion de Express
const app = express();

// Ruta POST para insertar canciones
app.post('/cancion', async (req, res) => {
  // Extraccion de datos de la cancion desde el BODY
  const { titulo, artista, tono } = req.body;

  // Validacion de Datos
  if (!titulo || !artista || !tono) {
    res.status(400).send('Faltan campos obligatorios: titulo, artista, tono');
    return;
  }

  // SQL Query
  const query = `
    INSERT INTO canciones (titulo, artista, tono) VALUES ($1, $2, $3)
  `;
  const values = [titulo, artista, tono];

  try {
    // Query Asincrona
    await pool.query(query, values);

    // Todo bien
    res.status(201).send('Cancion ingresada');

  } catch (error) {
    // Todo mal
    console.error(chalk.red('Error al ingresar la cancion:', error));
    res.status(500).send('Error Interno');
  }
});

// Ruta GET para recuperar la lista de canciones
app.get('/canciones', async (req, res) => {
    const songs = await getSongs();
    if (songs.length === 0) {
      res.status(404).send('No hay canciones');
      return;
    }
  
    res.json(songs);
  });


// Ruta PUT para actualizaciones
app.put('/cancion/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const songData = req.body;
  
    if (!id || isNaN(id)) {
      res.status(400).send('ID de registro invalido');
      return;
    }
  
    if (!songData || !songData.titulo || !songData.artista || !songData.tono) {
      res.status(400).send('Faltan campos obligatorios: titulo, artista, tono');
      return;
    }
  
    await updateSong(id, songData);
    res.status(200).send('Cancion actualizada');
  });

// Ruta DELETE para eliminar registros
app.delete('/cancion', async (req, res) => {
    const id = parseInt(req.query.id, 10);
  
    if (!id || isNaN(id)) {
      res.status(400).send('ID de registro invalido');
      return;
    }
  
    await deleteSong(id);
    res.status(200).send('Cancion eliminada');
  });

// Servidor encendido
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  // Crea la BD y la tabla, de no existir y las credenciales esten correctas
  await createDatabase();
  await createTable();

  // Status del server
  console.log(chalk.green('Servidor conectado en el puerto ' + chalk.bold(PORT)));
});
