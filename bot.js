const Discord = require("discord.js");
const config = require("config");
const voiceChoiceService = require("./services/voiceChoice");
const convertTextToVoice = require("./services/convertTextToVoice");

// required files:
/*
 * // a blank audio file that will be appended to the end of the mp3
 * // this is to fix an issue discord has closing the stream too early
 * ./audio/blank.mp3
 *
 * // { "token": "DISCORD BOT TOKEN", "project_id": "GOOGLE PROJECT ID", "google_config_path": "GOOGLE'S PROJECT JSON" }
 * ./config/default.json
 *
 * // { GOOGLE'S PROJECT JSON }
 * .config/text-to-speech.json
 *
 */

// the client we'll use to connect to discord
const discordClient = new Discord.Client();

// variables specific to this environment
const token = config.get("token");
const debug = config.get("debug");
const channelName = config.get("channel");

// users who have used the bot since it last booted up
var userList = {};

// setup the bot to run as soon as everything is ready
discordClient.on("ready", () => {
  discordClient.on("message", async msg => {
    var lowerMessage = msg.content.toLowerCase();
    var startsWithSay = lowerMessage.startsWith("?say ");
    var startsWithS = lowerMessage.startsWith("?s ");
    var startsWithNothing = lowerMessage.startsWith("? ");

    if (startsWithSay || startsWithS || startsWithNothing) {
      if (debug) console.log("Repeating the message...");
      convertTextToVoice.queueMessage(
        debug,
        userList,
        msg,
        channelName,
        startsWithSay,
        startsWithS
      );
    } else if (
      msg.content.toLowerCase().startsWith("?voice ") ||
      msg.content.toLowerCase().startsWith("?v ")
    ) {
      var voiceText = msg.content.toLowerCase().startsWith("?voice ")
        ? msg.content.substr(7).toLowerCase()
        : msg.content.substr(3).toLowerCase();

      userList[msg.member.user.id] = voiceChoiceService.voiceChoice(voiceText);

      const logMessage = `Changing ${msg.member.user.username}#${
        msg.member.user.discriminator
      }'s voice to ${userList[msg.member.user.id].simpleName} ${userList[
        msg.member.user.id
      ].gender.toLowerCase()}`;

      if (debug) {
        console.log(logMessage);
      }

      msg.channel.sendMessage(logMessage);
    } else if (msg.content.toLowerCase() === "?clear") {
      convertTextToVoice.clearQueue();
    } else if (msg.content.toLowerCase() === "?queued") {
      msg.channel.sendMessage(
        `The number of messages queued is ${convertTextToVoice.count()}`
      );
    } else if (msg.content.toLowerCase() === "?list") {
      msg.channel.sendMessage(
        `The options for languages are: \n${voiceChoiceService
          .languageList()
          .join("\n")}`
      );
    } else if (msg.content.toLowerCase() === "?current") {
      var voiceChoice = userList[msg.member.user.id]
        ? userList[msg.member.user.id]
        : {
            name: "en-AU",
            gender: "FEMALE",
            simpleName: "Australian (Default)"
          };

      msg.channel.sendMessage(
        `The voice of ${msg.member.user.username}#${
          msg.member.user.discriminator
        } is ${voiceChoice.simpleName} ${voiceChoice.gender.toLowerCase()}`
      );
    } else {
      if (debug) console.log("Message is not for me!");
    }
  });

  convertTextToVoice.init(debug, discordClient);
});

console.log("Logging onto Discord");
discordClient.login(token);
