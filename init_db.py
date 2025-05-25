// init_db.js
const sqlite3 = require('sqlite3').verbose();
const db_path = 'users_node.db';
const db = new sqlite3.Database(db_path);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      profile_pic TEXT
    )
  `);
});

db.close();
