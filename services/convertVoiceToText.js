const speech = require("@google-cloud/speech");
const config = require("config");
const fs = require("fs");
const path = require("path");
const Discord = require("discord.js");
const { Transform } = require("stream");
const datastore = require("./datastore");

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

const follows = [
  "Talk dirty to me, {0}, you sexy, sexy beast...",
  "Go ahead, {0}, I'm listening...",
  "I'm a bot, {0}, not a doctor.  But go ahead...",
  "Yes... That's it, {0}... Go on..."
];

const unfollows = [
  "Now ignoring whatever {0} says.  Screw them.",
  "{0} only says NSFW things, so I'm going to stop listening to them now.",
  "I HAVE EVALUATED {0}, AND I HAVE FOUND YOU UNWORTHY.",
  "Quite frankly, {0}, I don't give a damn."
];

function followUser(msg = new Discord.Message()) {
  if (!users.includes(msg.member.id)) {
    users.push(msg.member.id);

    datastore.updateUserPreference(msg.member.id, "follow", true);

    var reply = follows[Math.floor(Math.random() * follows.length)].replace(
      "{0}",
      `${msg.member.user.username}#${msg.member.user.discriminator}`
    );

    msg.channel.sendMessage(reply);
  }
}

function unFollowUser(msg = new Discord.Message()) {
  if (users.includes(msg.member.id)) {
    users.splice(users.indexOf(msg.member.id), 1);

    datastore.updateUserPreference(msg.member.id, "follow", false);

    var reply = unfollows[Math.floor(Math.random() * unfollows.length)].replace(
      "{0}",
      `${msg.member.user.username}#${msg.member.user.discriminator}`
    );

    msg.channel.sendMessage(reply);
  }
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
  init: function(useDebug, useDiscordClient, channelName, userList) {
    debug = useDebug;
    discordClient = useDiscordClient;
    textChannel = channelName;

    userList.forEach((l) => users.push(l));
    console.dir(users);
  },
  followUser: followUser,
  unFollowUser: unFollowUser,
  updateConnection: updateConnection
};
