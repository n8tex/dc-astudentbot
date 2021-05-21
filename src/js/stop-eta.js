require('dotenv').config();
const got = require('got');
const apikey = process.env.TRANSLINKAPI
const myArgs = process.argv.slice(2);
const fs = require("fs");
const promiseFs = require('mz/fs');

async function nextBus(stopNum, replyCount) {
  if (stopNum === 00000) {
    try {
      const file = await promiseFs.readFile("responses/sample.json");
      return JSON.parse(file);
    }
    catch (err) { console.error( err ) }
  }

  try {
    const response = await got('https://api.translink.ca/rttiapi/v1/stops/' + String(stopNum) + '/estimates',
    {
      headers: {Accept: "application/JSON"},
      searchParams: {apikey: apikey, count: replyCount},
      responseType: "json"
    });
    const respObj = response.body;
    const respStr = JSON.stringify(respObj, null, 2);
    // console.log(respObj);
    writeJson(respStr, String(stopNum) + "-" + String(Date.now()))
    return respObj;
  } catch (error) {
    console.log(error.response.body);
    //=> 'Internal server error ...'
  }
};

function writeJson(fBody, fName) {
  fs.writeFile("responses/" + fName + ".json", fBody, function (err) {
    if (err) throw err;
    console.log("Saved!");
  });
};

if ((typeof myArgs[0] == "string") &&  (typeof myArgs[0] == "string")) {
  nextBus(myArgs[0], myArgs[1]);
} else {
  nextBus(00000, 3);
}

module.exports = {
  stop: function (stopNum) {
    const expectedReplies = 3

    async function mainFunction(stopNum1) {
      const nextBusData = await nextBus(stopNum1, expectedReplies);
      return nextBusData;
    }

    return mainFunction(stopNum);
  }
}
