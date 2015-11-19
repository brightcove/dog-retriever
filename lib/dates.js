/**
 * A collection of functions that return arrays of dates for a requested range.
 */
const
  TODAY = 'Today',
  YESTERDAY = 'Yesterday',
  CURRENT_MONTH = 'CurrentMonth',
  LAST_MONTH = 'LastMonth',
  CURRENT_QUARTER = 'CurrentQuarter',
  LAST_QUARTER = 'LastQuarter',

  /**
   * Returns a Date for today with time 00:00:00
   */
  today = function() {
    var today = new Date();
    today.setHours(0,0,0,0);
    return today;
  },

  /**
   * Returns an array with a single date (today) in it.
   */
  getToday = function() {
    return [ today() ];
  },

  /**
   * Returns an array with a single date (yesterday) in it.
   */
  getYesterday = function() {
    var yesterday = today();
    yesterday.setDate(yesterday.getDate() -1);
    return [ yesterday ];
  },

  /**
   * Returns an array of Dates for each day in the specified month.
   * @param targetMonth int month representation as returned from Date.getMonth().
   */
  getMonth = function(targetMonth) {
    var result = [],
      currentDay,
      // If the number passed is negative adjust it to a positive equivalent for checking.
      adjustedTargetMonth = targetMonth >= 0 ?
        targetMonth : 12 + targetMonth;

    for (var i = 1; i <= 31; i++) {
      currentDay = today();
      currentDay.setMonth(targetMonth);
      currentDay.setDate(i);
      if (currentDay.getMonth() > adjustedTargetMonth) {
        break;
      }
      result.push(currentDay);
    }

    return result;
  },

  /**
   * Returns an array of Dates for each day in the current month.
   */
  getCurrentMonth = function() {
    return getMonth(today().getMonth());
  },


  /**
   * Returns an array of Dates for each day in last month.
   */
  getLastMonth = function() {
    return getMonth(today().getMonth() -1);
  },

  /**
   * Returns an array of Dates for each day in the quarter starting with the specified month.
   * @param monthStart int month representation as returned from Date.getMonth().
   */
  getQuarter = function(monthStart) {
    var result = getMonth(monthStart);
    result = result.concat(getMonth(monthStart + 1));
    result = result.concat(getMonth(monthStart + 2));
    return result;
  },

  /**
   * Returns an array of Dates for each day in the current quarter.
   */
  getCurrentQuarter = function() {
    return getQuarter(Math.floor(today().getMonth()/3) * 3);
  },

  /**
   * Returns an array of Dates for each day in the previous quarter.
   */
  getLastQuarter = function() {
    return getQuarter(Math.floor((today().getMonth() -3)/3) * 3)
  };


module.exports = {
  // Options that can be passed into the getDates() function.
  constants: {
    TODAY: TODAY,
    YESTERDAY: YESTERDAY,
    CURRENT_MONTH: CURRENT_MONTH,
    LAST_MONTH: LAST_MONTH,
    CURRENT_QUARTER: CURRENT_QUARTER,
    LAST_QUARTER: LAST_QUARTER
  },

  /**
   * Returns an array of Dates for the specified date range.
   * @param dateRangeConstant One of the date range constantsl
   */
  getDates: function(dateRangeConstant) {
    return eval('get' + dateRangeConstant)();
  }
}
