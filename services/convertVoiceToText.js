const speech = require("@google-cloud/speech");
const config = require("config");
const fs = require("fs");
const path = require("path");
const Discord = require("discord.js");
const { Transform } = require("stream");

const projectId = config.get("project_id");
const keyFilename = config.get("google_config_path");

var debug = false;
var discordClient;
var textChannel;

// Creates a client
const client = new speech.SpeechClient({
  projectId,
  keyFilename
});

function convertBufferTo1Channel(buffer) {
  /// <summary>Helper function required to translate discord audio to Google's input format</summary>
  const convertedBuffer = Buffer.alloc(buffer.length / 2);

  for (let i = 0; i < convertedBuffer.length / 2; i++) {
    const uint16 = buffer.readUInt16LE(i * 4);
    convertedBuffer.writeUInt16LE(uint16, i * 2);
  }

  return convertedBuffer;
}

class ConvertTo1ChannelStream extends Transform {
  /// <summary>Helper function required to translate discord audio to Google's input format</summary>
  constructor(source, options) {
    super(options);
  }

  _transform(data, encoding, next) {
    next(null, convertBufferTo1Channel(data));
  }
}

var users = [];

function followUser(userId = "") {
  if (!users.includes(userId)) users.push(userId);
}

function unFollowUser(userId = "") {
  if (users.includes(userId)) users.splice(users.indexOf(userId), 1);
}

function updateConnection(connection = new Discord.VoiceConnection()) {
  const receiver = connection.createReceiver();

  connection.on("speaking", (user, speaking) => {
    if (users.includes(user.id) && speaking) {
      if (debug)
        console.log(`${user.username}#${user.discriminator} is talking...`);

      const audioStream = receiver.createPCMStream(user);
      const requestConfig = {
        encoding: "LINEAR16",
        sampleRateHertz: 48000,
        languageCode: "en-US"
      };
      const request = {
        config: requestConfig
      };
      const recognizeStream = client
        .streamingRecognize(request)
        .on("error", console.error)
        .on("data", response => {
          const transcription = response.results
            .map(result => result.alternatives[0].transcript)
            .join("\n");

          if (debug) console.log(`Transcription: ${transcription}`);

          var username = `**${user.username}#${user.discriminator}**`;

          discordClient.channels
            .find(c => c.name === textChannel)
            .send(username + ": \n> " + transcription);
        });

      const convertTo1ChannelStream = new ConvertTo1ChannelStream();

      audioStream.pipe(convertTo1ChannelStream).pipe(recognizeStream);

      audioStream.on("end", async () => {
        if (debug) console.log("audioStream end");
      });
    }
  });
}

module.exports = {
  init: function(useDebug, useDiscordClient, channelName) {
    debug = useDebug;
    discordClient = useDiscordClient;
    textChannel = channelName;
  },
  followUser: followUser,
  unFollowUser: unFollowUser,
  updateConnection: updateConnection
};
