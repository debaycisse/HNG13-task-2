const axios = require('axios')
const Country = require('../models/countries')
const { 
  calcEstimatedGdp, 
  findCountryByName,
  createAndInsertCountry,
  countryCount,
  topFiveCountryByEstimatedGdp,
  lastRefreshTimestamp,
  drawSummaryImage
} = require('../utils/helpers')

const countryRouter = require('express').Router()

countryRouter.post('/refresh', async (req, res) => {
  try {
    // all country api to obtain
    let apiName = "restcountries.com"
    const countries = await axios
      .get(process.env.COUNTRIES_API, { timeout: 10000 })

    apiName = "https://open.er-api.com/"
    let exchangeRates = null
    
    const countriesData = countries.data
    
    for (const country of countriesData) {
      let currency_code = null
      let exchange_rate = null
      let estimated_gdp = 0
      
      if (country.currencies.length > 0) {
        currency_code = country.currencies[0].code

        exchangeRates = (await axios
          .get(process.env.EXCHANGE_RATE_API, { timeout: 10000 })).data
        
        exchange_rate = exchangeRates.rates[`${currency_code}`]

        estimated_gdp = calcEstimatedGdp(
          country.population,
          exchange_rate
        )
      }

      if (currency_code === undefined) {
        exchange_rate = null
        estimated_gdp = null
      }


      const eachCountry = new Country(
        country.name, country.population, currency_code
      )

      // capital, region, and flag
      eachCountry.updateCountryFields(country)

      // obtain exchange rate from the external api
      eachCountry.exchange_rate = exchange_rate
      
      // compute estimated_gdp based on population and exchange rate
      eachCountry.estimated_gdp = estimated_gdp
      
      await eachCountry.insertCountryData()
    }
    

    const { name, population, currency_code } = req.body
    
    const foundRecord = await findCountryByName(name)

    if (foundRecord.length === 0) {
      // create and insert a new country record
      const result = await createAndInsertCountry(name, population, currency_code)
      return res.status(201).json({
        message: "Refresh successful",
        operation_result: result
      })
    } 

    const country = new Country(name, population, currency_code)

    exchangeRates = (await axios
      .get(process.env.EXCHANGE_RATE_API, { timeout: 10000 })).data
    // update exchange_rate and estimated_gdp 
    if (exchangeRates.rates[`${currency_code}`] !== undefined) {
      country.exchange_rate = exchangeRates
        .rates[`${currency_code}`]

      country.estimated_gdp = calcEstimatedGdp(
        country.population,
        country.exchange_rate
      )
    }

    // Then execute updateCountryData
    const result = await country.updateCountryData(foundRecord[0].id)

    if (result.changedRows !== 1)
      throw Error('Country record update failed')

    const dataObject = {
      countryCount: await countryCount(),
      topFive: await topFiveCountryByEstimatedGdp(),
      lastRefresh: await lastRefreshTimestamp()
    }

    // Draw the statistics image
    await drawSummaryImage(dataObject)
      
    return res.status(201).json({
      message: "Refresh successful",
      operation_result: result

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

module.exports = countryRouter
