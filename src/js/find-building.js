const csvFilePath = 'static_data/ubc/ubcv/locations/csv/ubcv_buildings_simple.csv';
const csv = require('csvtojson');

async function createJsonFromCsv() {
  try {
    const jsonObj = await csv().fromFile(csvFilePath);
    return jsonObj;
  } catch (err) {
    console.error(err);
  }
}

function filterBuildingNames(buildings, target) {
  const buildingArray = buildings;
  const arrayLength = buildingArray.length;
  var returnArray = [];

  for (var i = 0; i < arrayLength; i++) {
    const current = buildingArray[i];
    const currentName = current.NAME;
    // const currentCode = current.BLDG_CODE;
    // const currentAdd = current.PRIMARY_ADDRESS;
    // const currentPC = current.POSTAL_CODE;

    if (currentName.toUpperCase().includes(target.toUpperCase())) returnArray.push(buildingArray[i]);
  }
  if (returnArray.length == 0) return "No buildings found.";
  return returnArray;
}

function findCodeMatch(buildings, target) {
  const buildingArray = buildings;
  const arrayLength = buildingArray.length;
  var returnArray = [];

  for (var i = 0; i < arrayLength; i++) {
    const current = buildingArray[i];
    // const currentName = current.NAME;
    const currentCode = current.BLDG_CODE;
    // const currentAdd = current.PRIMARY_ADDRESS;
    // const currentPC = current.POSTAL_CODE;

    if (currentCode.toUpperCase().includes(target.toUpperCase())) returnArray.push(buildingArray[i]);
  }
  if (returnArray.length == 0) return "No buildings found.";
  return returnArray;
}

module.exports = {
  searchName: function (targetName) {
    async function mainFunction(targetName1) {
      const buildingJson = await createJsonFromCsv();
      const result = filterBuildingNames(buildingJson, targetName1);
      return result;
    }
    return mainFunction(targetName);
  },
  searchCode: function (targetCode) {
    async function mainFunction(targetCode1) {
      const buildingJson = await createJsonFromCsv();
      const result = findCodeMatch(buildingJson, targetCode1);
      return result;
    }
    return mainFunction(targetCode)
  }
}
