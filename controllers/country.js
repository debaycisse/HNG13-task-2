const countryRouter = require('express').Router()

countryRouter.post('/refresh', async (req, res) => {
  try {
    
  } catch (error) {
    if (error.message.includes('required'))
      res.status(400).json
  }
})

module.exports = countryRouter
