const Discord = require("discord.js");
const config = require("config");
const voiceChoiceService = require("./services/voiceChoice");
const convertTextToVoice = require("./services/convertTextToVoice");
const commandFilter = require("./services/commandFilter");

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
const textChannelName = config.get("text_channel");

// users who have used the bot since it last booted up
var userList = {};

// setup the bot to run as soon as everything is ready
discordClient.on("ready", () => {
  discordClient.on("message", async msg => {
    if (
      msg.channel.name !== textChannelName ||
      msg.member.id === discordClient.user.id
    )
      return;

    var commandDetails = commandFilter(msg.content);

    if (debug) console.log(`Executing command ${commandDetails.command}`);

    switch (commandDetails.command) {
      // the user would like to talk to the voice chat
      case "say":
        convertTextToVoice.queueMessage(
          debug,
          userList,
          msg,
          commandDetails.message,
          discordClient.voiceConnections.first()
        );
        break;
      // the user wants to set their voice
      case "setVoice":
        userList[msg.member.user.id] = voiceChoiceService.voiceChoice(
          commandDetails.message
        );

        const logMessage = `Changing ${msg.member.user.username}#${
          msg.member.user.discriminator
        }'s voice to ${userList[msg.member.user.id].simpleName} ${userList[
          msg.member.user.id
        ].gender.toLowerCase()}`;

        if (debug) {
          console.log(logMessage);
        }

        msg.channel.sendMessage(logMessage);
        break;
      // the user wants to know what languages are supported
      case "list":
        msg.channel.sendMessage(
          `The options for languages are: \n${voiceChoiceService
            .languageList()
            .join("\n")}`
        );
        break;
      // clear all the messages currently queued up (this will not stop the current one)
      case "clear":
        convertTextToVoice.clearQueue();
        break;
      // cancel the current message and clear the queue
      case "stop":
        // TODO: cancel the current message
        convertTextToVoice.clearQueue();
        break;
      case "queue":
        msg.channel.sendMessage(
          `The number of messages queued is ${convertTextToVoice.count()}`
        );
        break;
      // tell the user what their current voice and gender is
      case "current":
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
        break;
      case "rejoin":
        convertTextToVoice.joinVoice(channelName);
        break;
      // display help info for how to use this bot
      case "help":

      // meow at the listeners
      case "meow":

      // bark at the users
      case "bark":

      default:
        if (debug) console.log("Message is not for me!");
        break;
    }
  });

  convertTextToVoice.init(debug, discordClient, channelName);
});

console.log("Logging onto Discord");
discordClient.login(token);
