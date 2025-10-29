const axios = require('axios')
const path = require('path')
const fs = require('fs')
const Country = require('../models/countries')
const {
  calcEstimatedGdp,
  findCountryByName,
  countryCount,
  topFiveCountryByEstimatedGdp,
  lastRefreshTimestamp,
  drawSummaryImage,
  updateCountryData,
  extractFields,
  extractFieldsWithId,
  is_valid,
  bulkInsert,
  bulkUpdate,
  findCountryByQueryStrings,
  findCountryByNameAndDelete
} = require('../utils/helpers')

const countryRouter = require('express').Router()

countryRouter.post('/refresh', async (req, res) => {
  try {
    let apiName = "restcountries.com"
    const countries = await axios
    .get(process.env.COUNTRIES_API, { timeout: 10000 })

    //  console.log('total number of countries : ', countries.data.length);

    apiName = "https://open.er-api.com/"

    const cache = {
      rates: null
    }

    if (cache.rates === null) {
        cache.rates = (await axios
          .get(process.env.EXCHANGE_RATE_API, { timeout: 10000 }))
            .data.rates
    }


    const countriesData = countries.data

    const countriesToInsert = []
    const countriesToUpdate = []

    for (const country of countriesData) {

      let {
        name, capital, region, population,
        currencies, flag
      } = country


      const foundRecord = await findCountryByName(name)

      if (foundRecord) {

        foundRecord.capital = capital
        foundRecord.region = region
        foundRecord.population = population
        foundRecord.flag_url = flag
        foundRecord.name = name
        foundRecord.population = population

        if (currencies && currencies.length > 0) {
          foundRecord.currency_code = currencies[0].code

          foundRecord.exchange_rate = cache
            .rates[`${foundRecord.currency_code}`]

          foundRecord.estimated_gdp = foundRecord.exchange_rate === undefined ?
            null : calcEstimatedGdp(population, foundRecord.exchange_rate)

        } else {
          foundRecord.currency_code = null
          foundRecord.exchange_rate = null
          foundRecord.estimated_gdp = 0
        }

        if (
          is_valid(
            foundRecord.name,
            foundRecord.population,
            foundRecord.currency_code
          ) !== true
        ) {
          throw Error(JSON.stringify(
            is_valid(
              foundRecord.name,
              foundRecord.population,
              foundRecord.currency_code
            )
          ))
        }

        countriesToUpdate.push(extractFieldsWithId(foundRecord))
      } else {

        let currency_code = null
        let exchange_rate = null
        let estimated_gdp = 0
        const flag_url = flag || null

        if (currencies && currencies.length > 0) {

          currency_code = currencies[0].code

          exchange_rate = cache.rates[`${currency_code}`]

          estimated_gdp = exchange_rate === undefined ? null :
            calcEstimatedGdp(population, exchange_rate)
        }

        if (is_valid(name, population, currency_code) !== true) {

          throw Error(JSON.stringify(
            is_valid(name, population, currency_code)
          ))
        }

        countriesToInsert.push([
          name, capital, region, population,
          currency_code, exchange_rate, estimated_gdp,
          flag_url
        ])
      }

    }

    // bulk insert and bulk update here
    if (countriesToInsert.length > 0)
      await bulkInsert(countriesToInsert)

    if (countriesToUpdate.length > 0)
      await bulkUpdate(countriesToUpdate)

    // Draw the statistics image
    const dataObject = {
      countryCount: await countryCount(),
      topFive: await topFiveCountryByEstimatedGdp(),
      lastRefresh: await lastRefreshTimestamp()
    }

    await drawSummaryImage(dataObject)

    const lastRefreshed = await lastRefreshTimestamp()

    return res.status(200).json({
      message: "Refresh successful",
      last_refreshed_at: lastRefreshed
    })

  } catch (error) {
    if (error.message.includes('is required'))
      return res.status(400).json({
        error: "Validation failed",
        details: JSON.parse(error.message)
      })

    if (
      error.message.includes('timeout') ||
      error.message.includes('fail')
     ) {
      return res.status(503).json({
        error: "External data source unavailable",
        details: `Could not fetch data from ${apiName}`
      })
     }

     if (
      error.message.includes('Country record update failed')
     ) {
        return res.status(500).json({
          error: 'Internal server error',
          details: 'Could not update country record'
        })
     }

     console.error(error.message);
  }
})

countryRouter.get('/:name', async (req, res) => {
  try {
    const countryName = req.params.name

    if (!countryName) {
      throw Error(
        JSON.stringify({
          name: 'is required'
        })
      )
    }

    const foundCountry = await findCountryByName(countryName)

    if (!foundCountry)
      throw Error('Country not found')

    res.status(200).json(foundCountry)

  } catch (error) {
    if (error.message.includes('is required'))
      return res.status(400).json({
        error: "Validation failed",
        details: JSON.parse(error.message)
      })
    
    if (error.message.includes('not found'))
      return res.status(404).json({
        error: JSON.parse(error.message),
        details: 'Could not find the given country'
      })

    if (
      error.message.includes('timeout') ||
      error.message.includes('fail')
     ) {
      return res.status(503).json({
        error: "External data source unavailable",
        details: `Could not fetch data from ${apiName}`
      })
     }

     if (
      error.message.includes('Country record update failed')
     ) {
        return res.status(500).json({
          error: 'Internal server error',
          details: 'Could not update country record'
        })
     }

     console.error(error.message);
  }
})

countryRouter.get('', async (req, res) => {
  try {
    const {
      region, currency, sort
    } = req.query

    
    
    const queryStrings = {region, currency, sort}
    console.log('queryStrings ::: ', queryStrings)
    
    const results = await findCountryByQueryStrings(queryStrings)

    res.status(200).json(results)

  } catch (error) {
    if (error.message.includes('is required'))
      return res.status(400).json({
        error: "Validation failed",
        details: JSON.parse(error.message)
      })
    
    if (error.message.includes('not found'))
      return res.status(404).json({
        error: JSON.parse(error.message),
        details: 'Could not find the given country'
      })

    if (
      error.message.includes('timeout') ||
      error.message.includes('fail')
     ) {
      return res.status(503).json({
        error: "External data source unavailable",
        details: `Could not fetch data from ${apiName}`
      })
     }

     if (
      error.message.includes('Country record update failed')
     ) {
        return res.status(500).json({
          error: 'Internal server error',
          details: 'Could not update country record'
        })
     }

     console.error(error.message);
  }
})

countryRouter.delete('/:name', async (req, res) => {
  try {
    const countryName = req.params.name

    if (!countryName) {
      throw Error(
        JSON.stringify({
          name: 'is required'
        })
      )
    }

    const foundCountry = await findCountryByName(countryName)

    if (!foundCountry)
      throw Error('Country not found')

    const deleteCountry = await findCountryByNameAndDelete(countryName)

    if (!deleteCountry)
      throw Error('Country record deletion failed')

    res.status(204).end()

    // Check if the deletion was successful and return 204 in status of the reponse
  } catch (error) {
    if (error.message.includes('is required'))
      return res.status(400).json({
        error: "Validation failed",
        details: JSON.parse(error.message)
      })
    
    if (error.message.includes('not found'))
      return res.status(404).json({
        error: JSON.parse(error.message),
        details: 'Could not find the given country'
      })

    if (
      error.message.includes('timeout') ||
      error.message.includes('fail')
     ) {
      return res.status(503).json({
        error: "External data source unavailable",
        details: `Could not fetch data from ${apiName}`
      })
     }

     if (
      error.message.includes('Country record update failed') ||
      error.message.includes('Country record deletion failed')
     ) {
        return res.status(500).json({
          error: 'Internal server error',
          details: 'Could not update or delete country record'
        })
     }

     console.error(error.message);
  }
})

countryRouter.get('/status', async (req, res) => {
  const totalCountries = await countryCount()
  const lastRefreshedTimeStamp = await lastRefreshTimestamp()

  res.status(200).json({
    "total_countries": totalCountries,
    "last_refreshed_at": lastRefreshedTimeStamp
  })
})

countryRouter.get('/image', async (req, res) => {
  try {
    const summaryImagePath = path
      .join(__dirname, '../cache/summary.png')

    if (!fs.existsSync(summaryImagePath))
      throw Error('Summary image not found')

    res.status(200).sendFile(summaryImagePath)

  } catch (error) {
    if (error.message.includes('image not found'))
      res.status(404).json({
        "error": "Summary image not found"
    })
  }
})



module.exports = countryRouter
