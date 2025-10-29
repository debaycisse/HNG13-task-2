require('dotenv').config()
const countryRouter = require('./controllers/country')
const countryStatusRouter = require('./controllers/country_status')
const express = require('express')

const app = express()
app.use(express.json())

app.use('/countries', countryRouter)
app.use('/status', countryStatusRouter)

// APP.USE FOR THE ROUTER
// REQUEST LOGGER
// UNKNOW ENDPOINT HANDLER
// ERROR HANDLER

module.exports = app
