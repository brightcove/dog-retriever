#!/usr/bin/env node
// TODO / FIXME 'Rate limit of 300 requests in 3600 seconds reached. Please try again later.'

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
  totals = { pass:0, fail:0},
  dateRangeOptions = [],
  queryOptions = [];

Object.keys(dates.constants).forEach(function(item) {
  dateRangeOptions.push(changeCase.snake(item));
});

Object.keys(config.queries).forEach(function(item) {
  queryOptions.push(changeCase.snake(item));
});

var
  argv = require('yargs')
    .usage('FIXME')
    .option('d', {
      alias: 'dateRange',
      demand: true,
      description: 'Date range to report on',
      //default: 'current_month',
      choices: dateRangeOptions
    })
    .option('q', {
      alias: 'query',
      demand: true,
      description: 'The set of queries do you want run',
      choices: queryOptions
    })
    // FIXME - add an option to confirm large ranges to avoid rate limiting.
    .argv,
  dateRange = dates.getDates(dates.constants[argv.dateRange.toUpperCase()]),

  makeDataDogRequest = function(from, to, query, callback) {
    var url =
        'https://app.datadoghq.com/api/v1/query?api_key=' + config.dataDogApiKey +
        '&application_key=' + config.dataDogAppKey +
        '&from=' + from +
        '&to=' + to +
        '&query=' + query;
    request(url, callback);
  },

  handleResult = function(status, response, body, callback) {
    var json = JSON.parse(body);
    if (json && json.series && json.series.length > 0 && json.series[0].pointlist) {

      json.series[0].pointlist.forEach(function (item, index, all) {
        var newResult = allResults[item[0]] || {};
        newResult.millis = item[0];
        newResult.time = new Date(item[0]);
        newResult[status] = item[1];
        allResults[item[0]] = newResult;
        totals[status] += item[1];
      });
      console.log(json.series[0].pointlist.length + ' datapoints received.');
    } else if (json && json.errors && JSON.stringify(json.errors).indexOf('Rate limit') > -1) {
      console.log('Aborting because we have been rate limited.', json);
      process.exit();
    } else if (json && json.status !== 'ok') {
      console.log('Unexpected response', json);
    } else {
      console.log('Really unexpected response', body)
    }
    callback();
  },


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


  getData = function(dateRange, callback) {
    async.each(dateRange,
      function (date, nextDate) {
        console.log('Requesting ', date);


        async.each(Object.keys(config.queries[changeCase.camelCase(argv.query)]),
          function(item, nextQuery) {
            makeSingleQuery(config.queries[changeCase.camelCase(argv.query)][item], item, date, nextQuery);
          },
          nextDate
        );

      },
      function (error) {
        if (error) {
          console.log('Error: ', error);
          return;
        }
        console.log('Totals', JSON.stringify(totals));
        console.log('Pass Percentage', 100 * totals.pass / (totals.pass + totals.fail) + '%',
          'Passed: ', totals.pass, 'Failed: ', totals.fail);
        callback(error, allResults);
      }
    );
  },

  convertResultsToCsv = function(results, callback) {
    var fields = ['millis', 'time'].concat(Object.keys(config.queries[changeCase.camelCase(argv.query)])),
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
