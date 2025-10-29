const axios = require('axios')
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
  findCountryByQueryStrings
} = require('../utils/helpers')

const countryRouter = require('express').Router()

countryRouter.post('/refresh', async (req, res) => {
  try {
    let apiName = "restcountries.com"
    const countries = await axios
    .get(process.env.COUNTRIES_API, { timeout: 10000 })
    
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
    await bulkUpdate(countriesToInsert)
    await bulkUpdate(countriesToUpdate)

    // Draw the statistics image
    const dataObject = {
      countryCount: await countryCount(),
      topFive: await topFiveCountryByEstimatedGdp(),
      lastRefresh: await lastRefreshTimestamp()
    }
    await drawSummaryImage(dataObject)

    
    const lastRefreshed = await lastRefreshTimestamp()

    return res.status(201).json({
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

countryRouter.get('', async (req, res) => {
  try {
    const {
      region, currency, sort
    } = req.query
  
    const queryStrings = {region, currency, sort}
  
    const results = await findCountryByQueryStrings(queryStrings)
  
    res.status(200).json(results)
    
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

module.exports = countryRouter
