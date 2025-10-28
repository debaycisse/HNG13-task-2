const axios = require('axios')
const { is_valid, db } = require('../utils/helpers')


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
      // this.data = []
      return this
    } catch (error) {
      throw error;
    }
  }

  updateCountryFields (fieldsObj) {
    try {
      this.capital = fieldsObj.capital
      this.region = fieldsObj.region
      this.flag_url = fieldsObj.flag_url
      return this
    } catch (error) {
      throw error
    }
  }

  obtainCountryData () {
    try {
      return [
        this.name,
        this.capital,
        this.region,
        this.population,
        this.currency_code,
        this.exchange_rate,
        this.estimated_gdp,
        this.flag_url
      ]
    } catch (error) {
      throw error
    }
  }

  async insertCountryData () {
    try {
      const [result] = await db.execute(
        `INSERT INTO countries VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        this.obtainCountryData()
      )
      return result
      // console.log('result ::::::', result);
      
    } catch (error) {
      throw error
    }
  }

  async updateCountryData (id) {
    try {
      const [result] = await db.execute(
        `UPDATE countries SET name = ?, capital = ?, region = ?,
          population = ?, currency_code = ?, exchange_rate = ?,
          estimated_gdp = ?, flag_url = ?
          WHERE id = ?;
        `,
        [
          this.name, this.capital, this.region, this.population,
          this.currency_code, this.exchange_rate, this.estimated_gdp,
          this.flag_url,
          id
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

// name
// capital
// region
// population
// currency_code
// exchange_rate
// estimated_gdp
// flag_url


// class testing {
//   name;
//   population

//   constructor(name, population) {
//     this.name = name
//     this.population = population
//   }

//   getProps(){
//     return this
//   }

//  }
