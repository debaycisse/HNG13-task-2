const countryStatusRouter = require('express').Router()

const {
  countryCount,
  lastRefreshTimestamp,
} = require('../utils/helpers')

countryStatusRouter.get('', async (req, res) => {
  const totalCountries = await countryCount()
  const lastRefreshedTimeStamp = await lastRefreshTimestamp()

  res.status(200).json({
    "total_countries": totalCountries,
    "last_refreshed_at": lastRefreshedTimeStamp
  })
})

module.exports = countryStatusRouter
