# HNG13-task-2
This repository holds the task 2, given to me as a backend develeoper, during an internship program with the HNG, cohort 13.

This task implements the following routes

* POST /countries/refresh → Fetch all countries and exchange rates, then cache them in the database
* GET /countries → Get all countries from the DB (support filters and sorting) - ?region=Africa | ?currency=NGN | ?sort=gdp_desc
* GET /countries/:name → Get one country by name
* DELETE /countries/:name → Delete a country record
* GET /status → Show total countries and last refresh timestamp
* GET /countries/image → serve summary image


### Setup Instructiona

1. Install Node.js of at least version 22
2. Install the dependencies of this application by changing to the root directory of this application and runnning the below command

    `npm install`
3. Install MySQL of at least version 8
4. Create a database, named `countries_currency_exchange`
5. Inside this database, create a table using the below schema

    `
        CREATE TABLE IF NOT EXISTS countries (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL,
            capital VARCHAR(100),
            region VARCHAR(100),
            population BIGINT NOT NULL,
            currency_code VARCHAR(3),
            exchange_rate DOUBLE,
            estimated_gdp DOUBLE,
            flag_url VARCHAR(2048),
            last_refreshed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
    `
6. Then, run the below command

    `npm run start`

7. Create and provide value to the following environment variables:

`
DB_HOST
DB_USER
DB_PASSWORD
DB
DB_PORT

PORT
COUNTRIES_API="https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies"
EXCHANGE_RATE_API="https://open.er-api.com/v6/latest/USD"
`

I provided the values of the two external APIs that are used in ths application for ease of use purposes.

8. You can then run the application by running `npm start`, whil you are in the root directory of the application.
You can start sending requests to the url of the running application.
