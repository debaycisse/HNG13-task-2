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

const db = async () => await mysql.createConnection({...connectionObj})

const is_valid = (name, population, currency_code) => {
  if (!name || typeof name !== 'string')
    return {name: 'is required'}

  if (!population || typeof population !== 'number')
    return {population: 'is required'}

  if (!currency_code || typeof currency_code !== 'string')
    return {currency_code: 'is required'}
  return true
}

const calcEstimatedGdp = (population, exchange_rate) => {
  const randNumber = Math.floor(Math.random() * 2000) + 1000

  return population * randNumber / exchange_rate
}

const findCountryByName = async (countryName) => {
  try {
    const [rows] = await db().execute(
      `SELECT * FROM countries WHERE LOWER(name) = ?`,
      [countryName.toLowerCase()]
    )
    return rows
  } catch (error) {
    throw error
  }
}

const createAndInsertCountry = async (name, population, currency_code) {
  // Implement it here...
  
}

module.exports = {
  is_valid,
  db,
  calcEstimatedGdp,
  findCountryByName,
  createAndInsertCountry
}
