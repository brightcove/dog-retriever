#!/usr/bin/env node
/**
 * This is a tool for downloading data from DataDog and saving it as a csv file.  See README.md.
 */
var
  async = require('async'),
  changeCase = require('change-case'),
  fs = require('fs-extra'),
  json2csv = require('json2csv'),
  path = require('path'),
  request = require('request'),

  config = require('./config.json'),
  dates = require('./lib/dates.js'),

  allResults = {},
  dateRangeOptions = [];

// Use the contants list from dates.js to populate the date range options on the command line.
Object.keys(dates.constants).forEach(function(item) {
  dateRangeOptions.push(changeCase.snake(item));
});

var
  argv = require('yargs')
    .option('d', {
      alias: 'dateRange',
      demand: true,
      description: 'Date range to report on',
      choices: dateRangeOptions
    })
    .option('q', {
      alias: 'query',
      demand: true,
      description: 'The set of queries do you want run',
      choices: Object.keys(config.queries)
    })
    // FIXME - add an option to confirm large ranges to avoid rate limiting.
    .argv,
  dateRange = dates.getDates(dates.constants[argv.dateRange.toUpperCase()]),

  /**
   * Calls the DataDog metric query API.
   * @param from Start date
   * @param to End date
   * @param query Query string used to get metrics
   * @param callback Function receiving error, response and body params.
   */
  makeDataDogRequest = function(from, to, query, callback) {
    var url =
        'https://app.datadoghq.com/api/v1/query?api_key=' + config.datadog_api_key +
        '&application_key=' + config.datadog_app_key +
        '&from=' + from +
        '&to=' + to +
        '&query=' + query;
    request(url, callback);
  },

  /**
   * Parses the response from a DataDog API call and adds it to the allResults object.
   * @param resultName Name that the query results should be assigned.
   * @param response Request response.
   * @param body Body of request response.
   * @param callback
   */
  handleResult = function(resultName, response, body, callback) {
    var json = JSON.parse(body);
    if (json && json.series && json.series.length > 0 && json.series[0].pointlist) {

      json.series[0].pointlist.forEach(function (item, index, all) {
        var newResult = allResults[item[0]] || {};
        newResult.millis = item[0];
        newResult.time = new Date(item[0]);
        newResult[resultName] = item[1];
        allResults[item[0]] = newResult;
      });
      console.log(json.series[0].pointlist.length + ' datapoints received.');

    } else if (json && json.errors && JSON.stringify(json.errors).indexOf('Rate limit') > -1) {
      console.log('Aborting because we have been rate limited.', json);
      process.exit(1);

    } else if (json && json.status !== 'ok') {
      console.log('Unexpected response', json);

    } else {
      console.log('Really unexpected response', body)
    }
    callback();
  },

  /**
   * Makes a DataDog API call for a single day range.
   * @param query DataDog query string
   * @param name Name to be assigned to the results
   * @param date Date to get data for
   * @param callback
   */
  makeSingleQuery = function(query, name, date, callback) {
    var endDate = new Date(date);
    endDate.setHours(24, 0, 0, 0);
    console.log('makeSingleQuery ', name, query, date);

    async.waterfall(
      [
        async.apply(makeDataDogRequest, date / 1000, endDate / 1000, query),
        async.apply(handleResult, name)
      ],
      callback
    );
  },


  /**
   * Make DataDog requests for all days in the range.
   * @param dateRange Date range as defined in dates.js
   * @param callback Function receiving error, allResults.
   */
  getData = function(dateRange, callback) {
    async.each(dateRange,
      function (date, nextDate) {
        console.log('Requesting ', date);


        async.each(Object.keys(config.queries[argv.query]),
          function(item, nextQuery) {
            makeSingleQuery(config.queries[argv.query][item], item, date, nextQuery);
          },
          nextDate
        );

      },
      function (error) {
        if (error) {
          console.log('Error: ', error);
          return;
        }
        callback(error, allResults);
      }
    );
  },

  /**
   * Converts the results object to csv representation.
   * @param results Object containing results.
   * @param callback Function receiving error, csv representation of data.
   */
  convertResultsToCsv = function(results, callback) {
    var fields = ['millis', 'time'].concat(Object.keys(config.queries[argv.query])),
      allResultsArray = Object.keys(results).map(function (key) { return results[key]; });

    allResultsArray = allResultsArray.sort(function(a, b) {
      return a.millis - b.millis;
    });

    json2csv({ data: allResultsArray, fields: fields }, function(err, csv) {
      if (err) {
        console.log(err);
      }
      callback(null, csv);
    });
  },

  /**
   * Writes the data passed in to a file in the results directory with the file name in the format
   * {query name}-{date range}.csv.
   * @param csvResults Results to write to file
   * @param callback
   */
  writeResultsToFile = function(csvResults, callback) {
    async.waterfall(
      [
        async.apply(fs.mkdirs, 'results'),
        async.apply(fs.writeFile,
          path.join(__dirname, 'results', argv.query + '-' + argv.dateRange + '.csv'),
          csvResults,
          'utf8')
      ],
      callback
    );
  };


// Start doing it.
async.waterfall(
  [
    async.apply(getData, dateRange),
    convertResultsToCsv,
    writeResultsToFile
  ],
  function(error, result) {
    console.log('Done. Error: ', error, 'Result: ', result);
  }
);
