const
  TODAY = 'Today',
  YESTERDAY = 'Yesterday',
  CURRENT_MONTH = 'CurrentMonth',
  LAST_MONTH = 'LastMonth',
  CURRENT_QUARTER = 'CurrentQuarter',
  LAST_QUARTER = 'LastQuarter',

  today = function() {
    //return new Date(1421038800000); // 1/12/2015
    //return new Date(1426132800000); // 3/12/2015
    var today = new Date();
    today.setHours(0,0,0,0);
    return today;
  },

  getToday = function() {
    return [ today() ];
  },

  getYesterday = function() {
    var yesterday = today();
    yesterday.setDate(yesterday.getDate() -1);
    return [ yesterday ];
  },

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

  getCurrentMonth = function() {
    return getMonth(today().getMonth());
  },

  getLastMonth = function() {
    return getMonth(today().getMonth() -1);
  },

  getQuarter = function(monthStart) {
    var result = getMonth(monthStart);
    result = result.concat(getMonth(monthStart + 1));
    result = result.concat(getMonth(monthStart + 2));
    return result;
  },

  getCurrentQuarter = function() {
    return getQuarter(Math.floor(today().getMonth()/3) * 3);
  },

  getLastQuarter = function() {
    return getQuarter(Math.floor((today().getMonth() -3)/3) * 3)
  };



module.exports = {
  constants: {
    TODAY: TODAY,
    YESTERDAY: YESTERDAY,
    CURRENT_MONTH: CURRENT_MONTH,
    LAST_MONTH: LAST_MONTH,
    CURRENT_QUARTER: CURRENT_QUARTER,
    LAST_QUARTER: LAST_QUARTER
  },
  getDates: function(period) {
    return eval('get' + period)();
  }
}


//console.log('today', module.exports.getDate(TODAY));
//console.log('yesterday', module.exports.getDate(YESTERDAY));
//console.log('this month', module.exports.getDate(CURRENT_MONTH));
//console.log('last month', module.exports.getDate(LAST_MONTH));
//console.log('this quarter', module.exports.getDate(CURRENT_QUARTER));
//console.log('last quarter', module.exports.getDate(LAST_QUARTER));
