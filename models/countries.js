// const { is_valid, db, connection } = require('../utils/helpers')
const { is_valid, connection, parseNullValue } = require('../utils/helpers')


class Country {
  name
  population
  currency_code

  constructor(name, population, currency_code) {
    try {
      if (is_valid(name, population, currency_code) !== true) {
        throw Error(
          JSON.stringify(
            is_valid(name, population, currency_code)
          )
        )
      }
      this.name = name
      this.capital = null
      this.region = null
      this.population = population
      this.currency_code = currency_code
      this.exchange_rate = 0.0
      this.estimated_gdp = 0.0
      this.flag_url = null
      return this
    } catch (error) {
      throw error;
    }
  }

  updateCountryFields (fieldsObj) {
    try {
      this.capital = fieldsObj.capital || null
      this.region = fieldsObj.region || null
      this.flag_url = fieldsObj.flag || null
      return this
    } catch (error) {
      throw error
    }
  }

  obtainCountryData () {
    try {
      return [
        this.name,
        parseNullValue(this.capital),
        parseNullValue(this.region),
        this.population,
        parseNullValue(this.currency_code),
        parseNullValue(this.exchange_rate),
        parseNullValue(this.estimated_gdp),
        parseNullValue(this.flag_url)
      ]
    } catch (error) {
      throw error
    }
  }

  async insertCountryData () {
    
    try {
      const [result] = await (await connection()).execute(
        `INSERT INTO countries (
          name, capital, region, population,
          currency_code, exchange_rate, estimated_gdp,
          flag_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        this.obtainCountryData()
      )
      return result
      
    } catch (error) {
      throw error
    }
  }

  async updateCountryData (id) {
    try {
      const [result] = await (await connection()).execute(
        `UPDATE countries SET name = ?, capital = ?, region = ?,
          population = ?, currency_code = ?, exchange_rate = ?,
          estimated_gdp = ?, flag_url = ?
          WHERE id = ?;
        `,
        [
          this.name, parseNullValue(this.capital), parseNullValue(this.region), this.population,
          parseNullValue(this.currency_code), parseNullValue(this.exchange_rate), parseNullValue(this.estimated_gdp),
          parseNullValue(this.flag_url), id
        ]
      )
      return result
    } catch (error) {
      throw error
    }
  }

  // TODO: async updateCountryData () {}

  // TODO: async deleteCountryData () {}


}

module.exports = Country
