const axios = require('axios')
const fs = require('fs');
const { createCanvas } = require('canvas');
const mysql = require('mysql2/promise');

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

const connection = async () => await mysql.createConnection({...connectionObj})
// const db = await connection()

const is_valid = (name, population, currency_code) => {
  if (!name || typeof name !== 'string')
    return {name: 'is required'}

  if (!population || typeof population !== 'number')
    return {population: 'is required'}

  if (
      currency_code !== null &&
      typeof currency_code !== 'string'
    )
    return {currency_code: 'is required'}
  return true
}

const calcEstimatedGdp = (population, exchange_rate) => {
  const randNumber = Math.floor(Math.random() * 2000) + 1000

  const result = population * randNumber / exchange_rate

  return parseFloat(result.toFixed(1))
}

const findCountryByName = async (countryName) => {
  try {
    const [rows] = await (await connection()).execute(
      `SELECT * FROM countries WHERE LOWER(name) = ?;`,
      [countryName.toLowerCase()]
    )
    return rows[0]
  } catch (error) {
    throw error
  }
}

const createAndInsertCountry = async (name, population, currency_code) => {
  try {
    // create a country object
    is_valid(name, population, currency_code)

    const exchangeRates = (await axios
      .get(process.env.EXCHANGE_RATE_API), { timeout: 10000 }).data
    
    let exchange_rate = null
    let estimated_gdp = null
    
    if (exchangeRates.rates[`${currency_code}`] !== undefined) {
      exchange_rate = exchangeRates.rates[`${currency_code}`]

      estimated_gdp = calcEstimatedGdp(
        population,
        exchange_rate
      )
    }

    const region = null
    const capital = null
    const flag_url = null
    
    const countryObject = {
      name, capital, region, population, currency_code,
      exchange_rate, estimated_gdp, flag_url
    }

    // insert the properties of the object into the (await connection())
    const [result] = await (await connection()).execute(
      `INSERT INTO countries VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        countryObject.name, countryObject.capital,
        countryObject.region, countryObject.population,
        countryObject.currency_code, countryObject.exchange_rate,
        countryObject.estimated_gdp, countryObject.flag_url
      ]
    )

    return result
  } catch (error) {
    throw error
  }
}

const drawSummaryImage = async (dataObject) => {
  const canvas = createCanvas(600, 250)
  const canvasDraw = canvas.getContext('2d')

  canvasDraw.fillStyle = '#091b4dff'
  canvasDraw.fillRect(0, 0, 600, 250)

  canvasDraw.fillStyle = '#11a2e6ff'
  canvasDraw.font = '14px Arial'
  const textToFillIn =
  `
  Total number of countries : ${dataObject.countryCount}

  Top 5 countries by estimated GDP: ${dataObject.topFive}

  Timestamp of last referesh : ${dataObject.lastRefresh}
  `
  canvasDraw.fillText(textToFillIn, 90, 200)

  const imageFolder = path.join(__dirname, '../cache')
  fs.mkdirSync(imageFolder, { recursive: true })

  // place the created image in the created folder
  const Imagebuffer = canvas.toBuffer('image/png')

  fs.writeFileSync(
    path.join(imageFolder,
    'summary.png'), Imagebuffer
  );
}

const countryCount = async () => {
  const [rows] = await (await connection())
    .execute(
      `
      SELECT COUNT(*) AS total_country
      FROM countries;
      `
    )
  return rows[0].total_country
}

const topFiveCountryByEstimatedGdp = async () => {
  const [rows] = await (await connection())
    .execute(
      `
      SELECT name
      FROM countries
      ORDER BY estimated_gdp DESC
      LIMIT 5;
      `
    )
  return rows.map(row => row.name)
}

const lastRefreshTimestamp = async () => {
  const [rows] = await (await connection())
    .execute(
      `
      SELECT last_refreshed_at AS last_refresh
      FROM countries
      ORDER BY last_refreshed_at DESC
      LIMIT 1;
      `
    )

  if (rows.length < 1)
    return null

  return rows[0].last_refresh
}

const updateCountryData = async (countryObject) => {
    try {
      const [result] = await (await connection()).execute(
        `UPDATE countries SET name = ?, capital = ?, region = ?,
          population = ?, currency_code = ?, exchange_rate = ?,
          estimated_gdp = ?, flag_url = ?
          WHERE id = ?;
        `,
        [
          countryObject.name, parseNullValue(countryObject.capital),
          parseNullValue(countryObject.region), countryObject.population,
          parseNullValue(countryObject.currency_code), parseNullValue(countryObject.exchange_rate),
          parseNullValue(countryObject.estimated_gdp), parseNullValue(countryObject.flag_url),
          countryObject.id
        ]
      )
      return result
    } catch (error) {
      throw error
    }
  }

const parseNullValue = (value) => value === undefined ? null : value

const exchangeRate = async (obj) => {
  const rates = (await axios
    .get(process.env.EXCHANGE_RATE_API, { timeout: 10000 }))
      .data
  obj.rates = rates.rates
  return rates.rates
}

const extractFieldsWithId = (recordObject) => {
  return [
    recordObject.name, recordObject.capital, recordObject.region,
    recordObject.population, recordObject.currency_code,
    recordObject.exchange_rate, recordObject.estimated_gdp,
    recordObject.flag_url
  ]
}

const extractFields = (recordObject) => {
  return [
    recordObject.name, parseNullValue(recordObject.capital),
    parseNullValue(recordObject.region), recordObject.population,
    parseNullValue(recordObject.currency_code),
    parseNullValue(recordObject.exchange_rate),
    parseNullValue(recordObject.estimated_gdp),
    parseNullValue(recordObject.flag_url)
  ]
}

const bulkInsert = async (objectsToInsert) => {
  try {
    await (await connection()).beginTransaction()

    await (await connection()).query(
      `
      INSERT INTO countries (
        name, capital, region, population, currency_code,
        exchange_rate, estimated_gdp, flag_url
        )
      VALUES ?
      `,
      [objectsToInsert]
    )

    await (await connection()).commit()

  } catch (error) {
    await (await connection()).rollback()
    throw error
  }
}

const bulkUpdate = async (objectsToUpdateOrInsert) => {
  try {
    await (await connection()).beginTransaction()

    await (await connection()).query(
      `
      INSERT INTO countries (
        name, capital, region, population, currency_code,
        exchange_rate, estimated_gdp, flag_url
        )
      VALUES ?
      ON DUPLICATE KEY UPDATE
        capital = VALUES(capital),
        region = VALUES(region),
        population = VALUES(population),
        currency_code = VALUES(currency_code),
        exchange_rate = VALUES(exchange_rate),
        estimated_gdp = VALUES(estimated_gdp),
        flag_url = VALUES(flag_url)
      `,
      [objectsToUpdateOrInsert]
    )

    await (await connection()).commit()

  } catch (error) {
    await (await connection()).rollback()
    throw error
  }
}

const findCountryByQueryStrings = async (queryStrings) => {
  try {
    let query = `
    SELECT *
    FROM countries
    `

    let conditions = ''
    let sort = ''
    const columnValues = []

    if (queryStrings.region !== undefined) {
      conditions += ' region = ' + '?'
      columnValues.push(queryStrings.region)
    }


    if (queryStrings.currency !== undefined) {
      conditions += ' currency_code ' + '?'
      columnValues.push(queryStrings.currency)
    }

    if (queryStrings.sort !== undefined) {
      if (
        queryStrings.sort.includes('gdp') &&
        queryStrings.sort.includes('desc')
      ) {
        sort += ' ORDER BY ?'
        columnValues.push(' estimated_gdp DESC')
      }

      if (
        queryStrings.sort.includes('gdp') &&
        queryStrings.sort.includes('asc')
      ) {
        sort += ' ORDER BY ?'
        columnValues.push('estimated_gdp ASC')
      }
    }

    if (conditions.length > 0)
      query += conditions
    if (sort.length > 0)
      query += sort

    query += ';'

    const [rows] = await (await connection()).execute(
      query,
      [columnValues]
    )

    return rows  
  } catch (error) {
    throw error
  }
  
}


module.exports = {
  is_valid,
  connection,
  calcEstimatedGdp,
  findCountryByName,
  createAndInsertCountry,
  drawSummaryImage,
  countryCount,
  topFiveCountryByEstimatedGdp,
  lastRefreshTimestamp,
  updateCountryData,
  parseNullValue,
  exchangeRate,
  extractFields,
  extractFieldsWithId,
  bulkInsert,
  bulkUpdate,
  findCountryByQueryStrings
}
