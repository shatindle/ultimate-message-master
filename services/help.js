function help(channel) {
  const helpMessage = [
    "**How to use Uma**",
    "All commands must be prefixed with {0}",
    "",
    "**General Commands**",
    "`{0}rejoin`",
    "The bot will leave and reconnect to the voice chat connected to this text chat.",
    "",
    "**Text-to-Speech Commands**",
    "`{0}v <country> <gender>`",
    "Set your voice to a specific country and gender.",
    "",
    "`{0}list`",
    "List all of the supported country accents.",
    "",
    "`{0}clear`",
    "Remove any queued up Text-to-Speech requests except the one currently playing.",
    "",
    "`{0}stop`",
    "Remove any queued up Text-to-Speech requests and stop the currently playing request.",
    "",
    "`{0}queue`",
    "Show the number of Text-to-Speech requests in the queue.",
    "",
    "`{0}current`",
    "Display your current country and gender selection for Text-to-Speech.",
    "",
    "",
    "**Speech-to-Text Commands**",
    "`{0}follow`",
    "Tell the bot to transcribe everything you say in the voice chat the bot monitors.",
    "",
    "`{0}unfollow`",
    "Tell the bot to stop transcribing everything you say in the voice chat the bot monitors."
  ];

  const helpText = helpMessage.map(t => t.replace("{0}", "?")).join("\n");

  channel.send(helpText);
}

module.exports = help;
