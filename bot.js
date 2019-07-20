const Discord = require("discord.js");
const textToSpeech = require("@google-cloud/text-to-speech");
const config = require("config");
const fs = require("fs");
const util = require("util");
const process = require("process");
const audioconcat = require("audioconcat");

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
const projectId = config.get("project_id");
const keyFilename = config.get("google_config_path");
const debug = config.get("debug");

// the connection to Google for Text-to-Speech
const ttsClient = new textToSpeech.TextToSpeechClient({
  projectId,
  keyFilename
});

// the arrays of voice types
const australianFemaleVoices = [
  "en-AU-Standard-A",
  "en-AU-Standard-C",
  "en-AU-Wavenet-A",
  "en-AU-Wavenet-C"
];

const australianMaleVoices = [
  "en-AU-Standard-B",
  "en-AU-Standard-D",
  "en-AU-Wavenet-B",
  "en-AU-Wavenet-D"
];

const ukFemaleVoices = [
  "en-GB-Standard-A",
  "en-GB-Standard-C",
  "en-GB-Wavenet-A",
  "en-GB-Wavenet-C"
];

const ukMaleVoices = [
  "en-GB-Standard-B",
  "en-GB-Standard-D",
  "en-GB-Wavenet-B",
  "en-GB-Wavenet-D"
];

const usFemaleVoices = [
  "en-US-Standard-A",
  "en-US-Standard-C",
  "en-US-Wavenet-A",
  "en-US-Wavenet-C"
];

const usMaleVoices = [
  "en-US-Standard-B",
  "en-US-Standard-D",
  "en-US-Wavenet-B",
  "en-US-Wavenet-D"
];

// users who have used the bot since it last booted up
var userList = {};

// messages that need to be sent
const messageQueue = [];

function queueMessage(msg, startsWithSay, startsWithS) {
  /// <summary>Queues a message that will be read out loud</summary>
  if (debug) console.log("Message: " + msg.content);

  var voiceChoice = userList[msg.member.user.id]
    ? userList[msg.member.user.id]
    : { name: australianFemaleVoices[0], gender: "FEMALE" };

  if (debug)
    console.log(
      `Language name: ${voiceChoice.name} Gender: ${voiceChoice.gender}`
    );

  var messageToSend;

  if (startsWithSay) {
    messageToSend = msg.content.substr(5);
  } else if (startsWithS) {
    messageToSend = msg.content.substr(3);
  } else {
    messageToSend = msg.content.substr(2);
  }

  if (debug) console.log(messageQueue.length);

  if (messageQueue.length + 1 > 10) {
    msg.channel.sendMessage("The message queue is full.  Please wait a bit.");
    return;
  }

  messageQueue.push({
    msg: msg,
    messageToSend: messageToSend,
    voiceChoice: voiceChoice
  });
}

async function sendMessage() {
  /// <summary>Loops through the queue of messages and sends them one at a time</summary>
  if (messageQueue.length > 0) {
    const voiceChannel = discordClient.channels.find("name", "VC 2");

    var message = messageQueue.shift();

    var messageToSend = message.messageToSend;
    var msg = message.msg;
    var voiceChoice = message.voiceChoice;

    const request = {
      input: { text: messageToSend },
      // Select the language and SSML Voice Gender (optional)
      voice: {
        languageCode: voiceChoice.name,
        ssmlGender: voiceChoice.gender
      },
      // Select the type of audio encoding
      audioConfig: { audioEncoding: "MP3" }
    };

    const [response] = await ttsClient.synthesizeSpeech(request);
    const writeFile = util.promisify(fs.writeFile);
    await writeFile("./audio/user-text.mp3", response.audioContent, "binary");

    audioconcat(["./audio/user-text.mp3", "./audio/blank.mp3"])
      .concat("./audio/message.mp3")
      .on("end", function(output) {
        voiceChannel
          .join()
          .then(connection => {
            const dispatcher = connection.playFile("./audio/message.mp3");

            dispatcher.on("end", end => {
              voiceChannel.leave();

              sendMessage();
            });
          })
          .catch(err => {
            if (debug) console.log(err);
            sendMessage();
          });
      });
  } else {
    setTimeout(sendMessage, 500);
  }
}

// setup the bot to run as soon as everything is ready
discordClient.on("ready", () => {
  discordClient.on("message", async msg => {
    var lowerMessage = msg.content.toLowerCase();
    var startsWithSay = lowerMessage.startsWith("?say ");
    var startsWithS = lowerMessage.startsWith("?s ");
    var startsWithNothing = lowerMessage.startsWith("? ");

    if (startsWithSay || startsWithS || startsWithNothing) {
      if (debug) console.log("Repeating the message...");
      queueMessage(msg, startsWithSay, startsWithS);
    } else if (
      msg.content.toLowerCase().startsWith("?voice ") ||
      msg.content.toLowerCase().startsWith("?v ")
    ) {
      var randomNumber = Math.floor(Math.random() * 4);

      var voiceChoice;

      var voiceText = msg.content.toLowerCase().startsWith("?voice ")
        ? msg.content.substr(7).toLowerCase()
        : msg.content.substr(3).toLowerCase();

      switch (voiceText) {
        case "au":
        case "australia":
        case "australian":
        case "male au":
        case "male australia":
        case "male australian":
        case "au male":
        case "australia male":
        case "australian male":
          userList[msg.member.user.id] = {
            name: australianMaleVoices[randomNumber],
            gender: "MALE"
          };
          voiceChoice = "Australian Male";
          break;
        case "female au":
        case "female australia":
        case "female australian":
        case "au female":
        case "australia female":
        case "australian female":
          userList[msg.member.user.id] = {
            name: australianFemaleVoices[randomNumber],
            gender: "FEMALE"
          };
          voiceChoice = "Australian Female";
          break;
        case "us":
        case "united states":
        case "usa":
        case "america":
        case "american":
        case "male us":
        case "male united states":
        case "male usa":
        case "male america":
        case "male american":
        case "us male":
        case "united states male":
        case "usa male":
        case "america male":
        case "american male":
          userList[msg.member.user.id] = {
            name: usMaleVoices[randomNumber],
            gender: "MALE"
          };
          voiceChoice = "American Male";
          break;
        case "female us":
        case "female united states":
        case "female usa":
        case "female america":
        case "female american":
        case "us female":
        case "united states female":
        case "usa female":
        case "america female":
        case "american female":
          userList[msg.member.user.id] = {
            name: usFemaleVoices[randomNumber],
            gender: "FEMALE"
          };
          voiceChoice = "American Female";
          break;
        case "eu":
        case "uk":
        case "europe":
        case "united kingdom":
        case "male eu":
        case "male uk":
        case "male europe":
        case "male european":
        case "male united kingdom":
        case "eu male":
        case "uk male":
        case "europe male":
        case "european male":
        case "united kingdom male":
          userList[msg.member.user.id] = {
            name: ukMaleVoices[randomNumber],
            gender: "MALE"
          };
          voiceChoice = "European Male";
          break;
        case "female eu":
        case "female uk":
        case "female europe":
        case "female european":
        case "female united kingdom":
        case "eu female":
        case "uk female":
        case "europe female":
        case "european female":
        case "united kingdom female":
          userList[msg.member.user.id] = {
            name: ukFemaleVoices[randomNumber],
            gender: "FEMALE"
          };
          voiceChoice = "European Female";
          break;
        default:
          userList[msg.member.user.id] = {
            name: australianFemaleVoices[randomNumber],
            gender: "FEMALE"
          };
          voiceChoice = "Australian Female";
          break;
      }
      if (debug)
        console.log(
          `Changing ${msg.member.user.username}'s voice to ${voiceChoice}`
        );

      msg.channel.sendMessage(
        `Changing ${msg.member.user.username}'s voice to ${voiceChoice}`
      );
    } else if (msg.content.toLowerCase() === "?clear") {
      while (messageQueue.length > 0) messageQueue.pop();
    } else if (msg.content.toLowerCase() === "?queued") {
      msg.channel.sendMessage(
        `The number of messages queued is ${messageQueue.length}`
      );
    } else {
      if (debug) console.log("Message is not for me!");
    }
  });

  sendMessage();
});

discordClient.login(token);
