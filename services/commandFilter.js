function commandFilter(message = "") {
  /// <summary>Figure out what the user wants to do and separate that from the message</summary>
  var lowercaseMessage = message.toLowerCase();

  // if (lowercaseMessage.startsWith("? "))
  //   return {
  //     command: "say",
  //     message: message.substr("? ".length)
  //   };

  if (lowercaseMessage.startsWith("?v "))
    return {
      command: "setVoice",
      message: message
        .substr("?v ".length)
        .toLowerCase()
        .trim()
    };

  if (lowercaseMessage.startsWith("?list"))
    return {
      command: "list"
    };

  if (lowercaseMessage.startsWith("?clear"))
    return {
      command: "clear"
    };

  if (lowercaseMessage.startsWith("?queue"))
    return {
      command: "queue"
    };

  if (lowercaseMessage.startsWith("?current"))
    return {
      command: "current"
    };

  if (lowercaseMessage.startsWith("?rejoin"))
    return {
      command: "rejoin"
    };

  if (lowercaseMessage.startsWith("?follow"))
    return {
      command: "follow"
    };

  if (lowercaseMessage.startsWith("?unfollow"))
    return {
      command: "unfollow"
    };

  // TODO: implement
  if (lowercaseMessage.startsWith("?help"))
    return {
      command: "help"
    };

  // TODO: implement
  if (lowercaseMessage.startsWith("?meow"))
    return {
      command: "meow"
    };

  // TODO: implement
  if (lowercaseMessage.startsWith("?bark"))
    return {
      command: "bark"
    };

  // TODO: implement
  if (lowercaseMessage.startsWith("?stop"))
    return {
      command: "stop"
    };

  if (lowercaseMessage.startsWith("?score"))
    return {
      command: "score"
    };

  return {
    command: "say",
    message: message
  };
}

module.exports = commandFilter;
