# dog-retriever

A utility for downloading metric data from your DataDog account and saving it in csv format.

##### Why?
The DataDog UI has some great features but from time to time it may be missing a way to give you
back the data that you need.  This utility provides a simple way to get that data out by simply
specifying query strings and a time range.


##### Getting started

1. Save a copy of config.example.json as config.json
2. Add your API and Application keys to the config file.  They can created / found in the DataDog
UI under Integrations -> APIs.
3. Try it out.

If you run ./index.js you will quickly be told that you are missing required options.  Example:


```
Options:
  -d, --dateRange  Date range to report on
       [required] [choices: "today", "yesterday", "current_month", "last_month",
                                              "current_quarter", "last_quarter"]
  -q, --query      The set of queries do you want run
               [required] [choices: "hello_dog"]
```

Try again like so:

```
./index.js -d today -q hello_dog
```

This will result in a csv file being created in the results directory named hello_dog-today.csv
containing the data that DataDog returned.  Inside you will see three columns.  First are "millis"
and "time."  These are always included.  Last is "free_memory."  This is the name specified for the
query within the "hello_dog" query group definition and it contains all of the datapoints that were
returned.

More information about query strings can be found
[here in the DataDog docs](http://docs.datadoghq.com/graphing/).

##### Config options

The queries list provides a way to give sets of named query sets that can be specified via the
command line.  In the example the query set is "hello_dog" and it contains a single query string.
But what if you wanted both free and used memory?  Try changing your config file to look like this:


```
  "queries": {
    "hello_dog": {
      "free_memory": "avg:system.mem.free{*}",
      "used_memory": "avg:system.mem.used{*}"
    }
  }
```

When you run it again you will get a new csv file containg the columns: millis, time, free_memory
and used_memory.

### Warning

DataDog currently imposes a limit of 300 API requests per hour.  This is important to note because
in order to get reasonable granularity of data this tool makes one request per query **for each 24
hour period** as recommended
[here in the DataDog API docs](http://docs.datadoghq.com/api/#metrics-query).  As a result if you
request data for a query for a quarter the result will be 90 requests.  This adds up quickly.

Once the quota is exhausted then DataDog API calls start returning this error message:

```Rate limit of 300 requests in 3600 seconds reached. Please try again later.```

Once this error is detected the script will abort.

