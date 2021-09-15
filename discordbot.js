require('dotenv').config();
const appID = process.env.DISCORDAPPID;
const serverID = process.env.DISCORDSERVERID;
const apiToken = process.env.DISCORDAPITOKEN;
const fs = require('fs');
const findStop = require('./src/js/find-stop');
const nextBus = require('./src/js/stop-eta');
const findBuilding = require('./src/js/find-building');
const emoji = require('node-emoji');

const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async message => {
  if (!client.application?.owner) await client.application?.fetch();

  if (message.content.toLowerCase() === '!deploy' && message.author.id === client.application?.owner.id) {
    const data = [
      {
        name: 'stoplookup',
        description: 'Transit Data: Finds bus stop(s) with given name.',
        options: [{
          name: 'name',
          type: 'STRING',
          description: 'Stop name to lookup',
          required: true
        }]
      },
      {
        name: 'nextbus',
        description: 'Transit Data: Finds departues with given stop number.',
        options: [{
          name: 'stopnum',
          type: 'INTEGER',
          description: 'Stop number to lookup',
          required: true
        }]
      },
      {
        name: 'ubcbuildinglookup',
        description: 'UBC Building Data: Finds buildings on campus with given name.',
        options: [{
          name: 'name',
          type: 'SUB_COMMAND',
          description: 'Lookup by building name',
          options: [{
            name: 'search',
            type: 'STRING',
            description: 'Building name to lookup',
            required: true
          }]
        },
        {
          name: 'code',
          type: 'SUB_COMMAND',
          description: 'Lookup by building code',
          options: [{
            name: 'search',
            type: 'STRING',
            description: 'Building code to lookup',
            required: true
          }]
        }]
      }
    ]

    const command = await client.guilds.cache.get(serverID)?.commands.set(data);
    const commandGlobal = await client.application?.commands.set(data);
    console.log(command);
  }
});

client.on('interaction', async interaction => {
  if (!interaction.isCommand()) return;
  // console.log(interaction);
  // writeJson(JSON.stringify(interaction, null, 2), String(Date.now()) + "-interaction");
  if (interaction.commandName === 'ping') await interaction.reply('Pong!');
  if (interaction.commandName === 'stoplookup') await interaction.reply(await createStopList(interaction.options[0].value));
  if (interaction.commandName === 'nextbus') await interaction.reply(await createDepartureList(interaction.options[0].value));
  if (interaction.commandName === 'ubcbuildinglookup') {
    if (interaction.options[0].name === 'name') {
      await interaction.reply(await buildingNameSearch(interaction.options[0].options[0].value));
    } else if (interaction.options[0].name === 'code') {
      await interaction.reply(await buildingCodeSearch(interaction.options[0].options[0].value));
    } else {
      await interaction.reply("Unknown Error");
    }
  }
});

const warnEmoji = emoji.get('warning');
const buildingEmoji = emoji.get('office');
const busStopEmoji = emoji.get ('busstop');
const busEmoji = emoji.get('bus');

// Translink Stop Lookup
async function createStopList(searchQuery) {
  if (searchQuery.length < 3) return warnEmoji + " Too shot! Minimum of three characters required."
  const listOfStops = await findStop.search(searchQuery);
  if ((typeof listOfStops) == "string") {
    return listOfStops;
  }
  var arrayLength = listOfStops.length;
  if (listOfStops.length > 20) arrayLength = 20;
  var resultsHidden = listOfStops.length - arrayLength;
  var response = busStopEmoji + "Showing first 20 results for **" + searchQuery + "**\n```";

  for (var i = 0; i < arrayLength; i++) {
    const currentStopName = listOfStops[i].stop_name;
    const currentStopNum = listOfStops[i].stop_code;
    response = response.concat(currentStopNum + " " + currentStopName + "\n");
  }
  return response + "\n" + String(resultsHidden) + " extra results hidden.```";
}

// Translink ETA Lookup
async function createDepartureList(stopNum) {
  return warnEmoji + " This command is under maintenance."; //!!!
  if (String(stopNum).length != 5) return warnEmoji + " Stop numbers must consist of 5 digits."
  const stopInfo = await nextBus.stop(stopNum);
  const listOfDepartures = stopInfo[0].Schedules;
  const routeNo = stopInfo[0].RouteNo;
  const arrayLength = listOfDepartures.length;
  var response = busStopEmoji + " Showing departures for **" + stopNum + "** \n```";

  for (var i = 0; i < arrayLength; i++) {
    const currentDest = listOfDepartures[i].Destination;
    const currentLeaveTime = listOfDepartures[i].ExpectedLeaveTime;
    const currentCD = listOfDepartures[i].ExpectedCountdown;
    const currentCancelled = listOfDepartures[i].CancelledTrip;

    if (!currentCancelled) response = response.concat(routeNo + " " + currentDest + " " + currentLeaveTime + " (" + currentCD + "mins)" + "\n");
  }
  return response + "```";
}

//UBC Building Lookup by Name
async function buildingNameSearch(searchQuery) {
  if (searchQuery.length < 3) return warnEmoji + " Too shot! Minimum of three characters required."
  const listofBuilding = await findBuilding.searchName(searchQuery)
  if ((typeof listofBuilding) == "string") return listofBuilding;
  const arrayLength = listofBuilding.length;
  var response = buildingEmoji + ' Name search results for: **' + searchQuery + '**\n```';

  for (var i = 0; i < arrayLength; i++) {
    const current = listofBuilding[i];
    const currentName = current.NAME;
    const currentCode = current.BLDG_CODE;
    const currentAdd = current.PRIMARY_ADDRESS;
    const currentPC = current.POSTAL_CODE;
    response = response.concat(currentCode + " - " + currentName + "\n" + currentAdd + " " + currentPC + "\n\n");
  }

  return response + "```";
}

//UBC Building Lookup by Code
async function buildingCodeSearch(searchQuery) {
  if (searchQuery.length < 3) return warnEmoji + " Too shot! Minimum of three characters required."
  const listofBuilding = await findBuilding.searchCode(searchQuery)
  if ((typeof listofBuilding) == "string") return listofBuilding;
  const arrayLength = listofBuilding.length;
  var response = buildingEmoji + ' Code search results for: **' + searchQuery + '**\n```';

  for (var i = 0; i < arrayLength; i++) {
    const current = listofBuilding[i];
    const currentName = current.NAME;
    const currentCode = current.BLDG_CODE;
    const currentAdd = current.PRIMARY_ADDRESS;
    const currentPC = current.POSTAL_CODE;
    response = response.concat(currentCode + " - " + currentName + "\n" + currentAdd + " " + currentPC + "\n\n");
  }

  return response + "```";
}

// Log interaction for debugging
function writeJson(fBody, fName) {
  fs.writeFile("dclogs/" + fName + ".json", fBody, function (err) {
    if (err) throw err;
    console.log("Saved!");
  });
};


client.login(apiToken);
