const axios = require('axios')
const Country = require('../models/countries')
const { 
  calcEstimatedGdp, 
  findCountryByName,
  countryCount,
  topFiveCountryByEstimatedGdp,
  lastRefreshTimestamp,
  drawSummaryImage,
  updateCountryData
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
    const cache = {
      rates: null
    }

    if (cache.rates === null) {
        cache.rates = (await axios
          .get(process.env.EXCHANGE_RATE_API, { timeout: 10000 }))
            .data.rates
    }
    
    const countriesData = countries.data
    
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

        console.log('currencies :', currencies);
        
        if (currencies && currencies.length > 0) {
          foundRecord.currency_code = currencies[0].code
          
          foundRecord.exchange_rate = foundRecord.currency_code === undefined ?
            null : cache.rates[`${foundRecord.currency_code}`]
  
          foundRecord.estimated_gdp = foundRecord.currency_code === undefined ?
            null : calcEstimatedGdp(population, foundRecord.exchange_rate)
          // console.log('Here foundRecord');
          
        } else {
          foundRecord.currency_code = null
          foundRecord.exchange_rate = null
          foundRecord.estimated_gdp = 0
        }

        await updateCountryData(foundRecord)
      } else {
        
        let currency_code = null
        let exchange_rate = null
        let estimated_gdp = 0
        
        console.log('Another currencies :', currencies);
        
        if (currencies && currencies.length > 0) {
          // console.log('If currencies are available');
          
          currency_code = currencies[0].code
          
          exchange_rate = currency_code === undefined ? null :
            cache.rates[`${currency_code}`]
            
          estimated_gdp = currency_code === undefined ? null :
            calcEstimatedGdp(population, exchange_rate)
        }
  
        const eachCountry = new Country(
          name, population, currency_code
        )
  
        // capital, region, and flag
        const fieldsObj = {capital, region, flag}
        eachCountry.updateCountryFields(fieldsObj)
  
        // obtain exchange rate from the external api
        eachCountry.exchange_rate = exchange_rate
        
        // compute estimated_gdp based on population and exchange rate
        eachCountry.estimated_gdp = estimated_gdp
        
        await eachCountry.insertCountryData()
        console.log('Now Here...');

      }

    }

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

module.exports = countryRouter
