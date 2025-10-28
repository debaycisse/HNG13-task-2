require('dotenv').config()
const countryRouter = require('./controllers/country')
const express = require('express')

const app = express()
app.use(express.json())

app.use('/countries', countryRouter)

// app.post('/here', async (req, res) => {
//     console.log('req.body', req.body);
//     return res.status(201).end()
// })

// APP.USE FOR THE ROUTER
// REQUEST LOGGER
// UNKNOW ENDPOINT HANDLER
// ERROR HANDLER

module.exports = app
