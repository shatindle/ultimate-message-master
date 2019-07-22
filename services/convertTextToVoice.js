const textToSpeech = require("@google-cloud/text-to-speech");
const config = require("config");
const fs = require("fs");
const util = require("util");
const audioconcat = require("audioconcat");

const projectId = config.get("project_id");
const keyFilename = config.get("google_config_path");

var debug = false;
var discordClient;

// the connection to Google for Text-to-Speech
const ttsClient = new textToSpeech.TextToSpeechClient({
  projectId,
  keyFilename
});

// messages that need to be sent
const messageQueue = [];

function queueMessage(
  debug,
  userList,
  msg,
  channelName,
  startsWithSay,
  startsWithS
) {
  /// <summary>Queues a message that will be read out loud</summary>
  if (debug) console.log("Message: " + msg.content);

  var voiceChoice = userList[msg.member.user.id]
    ? userList[msg.member.user.id]
    : { name: "en-AU", gender: "FEMALE" };

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

  if (debug) console.log(`Messages ahead of this one: ${messageQueue.length}`);

  if (messageQueue.length + 1 > 10) {
    msg.channel.sendMessage("The message queue is full.  Please wait a bit.");
    return;
  }

  messageQueue.push({
    msg: msg,
    messageToSend: messageToSend,
    voiceChoice: voiceChoice,
    channelName: channelName
  });
}

async function sendMessage() {
  /// <summary>Loops through the queue of messages and sends them one at a time</summary>
  if (messageQueue.length > 0) {
    var message = messageQueue.shift();

    const voiceChannel = discordClient.channels.find(
      c => c.name === message.channelName
    );

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

function clearQueue() {
  while (messageQueue.length > 0) messageQueue.pop();
}

function queuedMessages() {
  return messageQueue.length;
}

module.exports = {
  queueMessage: queueMessage,
  init: function(useDebug, useDiscordClient) {
    debug = useDebug;
    discordClient = useDiscordClient;
    sendMessage();
  },
  clearQueue: clearQueue,
  count: queuedMessages
};
