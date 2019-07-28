function metrics(info) {
  var today = new Date();
  var date =
    today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
  var time =
    today.getHours() +
    ":" +
    today.getMinutes() +
    ":" +
    today.getSeconds() +
    ":" +
    today.getMilliseconds();
  var dateTime = date + " " + time;

  console.log(dateTime + ": " + info);

  return dateTime;
}

module.exports = metrics;
