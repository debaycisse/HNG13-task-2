const mysql = require('mysql2/promise')

const connectionObj = process.env.NODE_ENV === 'development' ?
  {
    host: process.env.DEV_DB_HOST,
    user: process.env.DEV_DB_USER,
    password: process.env.DEV_DB_PASSWORD,
    database: process.env.DEV_DB,
    port: process.env.DEV_DB_PORT
  } : process.env.NODE_ENV === 'test' ?
  {
    host: process.env.DEV_DB_HOST,
    user: process.env.DEV_DB_USER,
    password: process.env.DEV_DB_PASSWORD,
    database: process.env.TEST_DB,
    port: process.env.DEV_DB_PORT
  } : {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB,
    port: process.env.DB_PORT
  }

const db = await mysql.createConnection({...connectionObj})

const is_valid = (name, population, currency_code) => {
  if (!name || typeof name !== 'string')
    return {name: 'is required'}

  if (!population || typeof population !== 'number')
    return {population: 'is required'}

  if (!currency_code || typeof currency_code !== 'string')
    return {currency_code: 'is required'}
  return true
}

module.exports = {
  is_valid,
  db
}
