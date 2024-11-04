const sqlite3 = require('sqlite3')
const { open } = require('sqlite')

const initDb = async () => {
  const db = await open({
    filename: './shopping.db',
    driver: sqlite3.Database
  });
  
  // Enable foreign keys
  await db.run('PRAGMA foreign_keys = ON');
  
  return db;
}

module.exports = {
  initDb
}; 