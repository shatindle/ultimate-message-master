const Discord = require("discord.js");
const textToSpeech = require("@google-cloud/text-to-speech");
const config = require("config");
const fs = require("fs");
const util = require("util");
const process = require("process");
const audioconcat = require("audioconcat");
const discordClient = new Discord.Client();
const token = config.get("token");
const projectId = "ultimate-message-master";
const keyFilename = "./config/text-to-speech.json";

const ttsClient = new textToSpeech.TextToSpeechClient({
  projectId,
  keyFilename
});

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

var userList = {};

const messageQueue = [];

function queueMessage(msg, startsWithSay, startsWithS) {
  console.log("Message: " + msg.content);

  var voiceChoice = userList[msg.member.user.id]
    ? userList[msg.member.user.id]
    : { name: australianFemaleVoices[0], gender: "FEMALE" };

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

  console.log(messageQueue.length);

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
            console.log(err);
            sendMessage();
          });
      });
  } else {
    setTimeout(sendMessage, 500);
  }
}

discordClient.on("ready", () => {
  discordClient.on("message", async msg => {
    var lowerMessage = msg.content.toLowerCase();
    var startsWithSay = lowerMessage.startsWith("?say ");
    var startsWithS = lowerMessage.startsWith("?s ");
    var startsWithNothing = lowerMessage.startsWith("? ");

    if (startsWithSay || startsWithS || startsWithNothing) {
      console.log("Repeating the message...");
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
      console.log("Not for me!");
    }
  });

  sendMessage();
});

discordClient.login(token);

// https://discordapp.com/api/oauth2/authorize?client_id=601859499829231677&scope=bot&permissions=1117248

// // cleanup:
// process.stdin.resume();//so the program will not close instantly

// function exitHandler(options, exitCode) {
//     if (options.cleanup) {
//       console.log('clean');

//     }

//     if (exitCode || exitCode === 0) console.log(exitCode);
//     if (options.exit) process.exit();
// }

// //do something when app is closing
// process.on('exit', exitHandler.bind(null,{cleanup:true}));

// //catches ctrl+c event
// process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// // catches "kill pid" (for example: nodemon restart)
// process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
// process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

// //catches uncaught exceptions
// process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
