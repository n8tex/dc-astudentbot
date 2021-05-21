const csvFilePath = 'static_data/transit/stops.csv';
const csv = require('csvtojson');

async function createJsonFromCsv() {
  try {
    const jsonObj = await csv().fromFile(csvFilePath);
    return jsonObj;
  } catch (err) {
    console.error(err);
  }
}

function filterStopNames(stops, target) {
  const stopArray = stops;
  const arrayLength = stopArray.length;
  const returnArray = [];

  for (var i = 0; i < arrayLength; i++) {
    const currentStopName = stopArray[i].stop_name;
    if (currentStopName.toUpperCase().includes(target.toUpperCase())) {
      returnArray.push(stopArray[i]);
    }
  }
  if (returnArray.length == 0) return "No buildings found.";
  return returnArray;
}

module.exports = {
  search: function (stopName) {
    async function mainFunction(targetName) {
      const stopsJson = await createJsonFromCsv();
      const result = filterStopNames(stopsJson, targetName);
      return result; //returns a promise
    }
    return mainFunction(stopName);
  }
}
