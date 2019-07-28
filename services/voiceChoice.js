const datastore = require("./datastore");

const australianVoice = "en-AU";
const britishVoice = "en-GB";
const americanVoice = "en-US";
const frenchVoice = "fr-FR";
const germanVoice = "de-DE";
const spanishVoice = "es-ES";

const voices = {
  australian: australianVoice,
  au: australianVoice,
  aussie: australianVoice,
  australia: australianVoice,

  british: britishVoice,
  english: britishVoice,
  uk: britishVoice,
  "united kingdom": britishVoice,
  european: britishVoice,
  europe: britishVoice,
  britain: britishVoice,

  american: americanVoice,
  "united states": americanVoice,
  us: americanVoice,
  usa: americanVoice,
  "united states of america": americanVoice,
  "united states america": americanVoice,

  french: frenchVoice,
  france: frenchVoice,

  german: germanVoice,
  germany: germanVoice,

  spanish: spanishVoice
};

function languageList() {
  return ["American", "European", "Australian", "French", "German", "Spanish"];
}

function subOutString(baseString = "", subString = "") {
  return baseString
    .replace(subString, "")
    .replace(/\s\s+/g, " ")
    .trim();
}

async function voiceChoiceService(userId = "", message = "") {
  let lowercaseMessage = message.toLowerCase();
  let languageMessage;
  let gender;
  let languageChoice;

  const male = "male";
  const guy = "guy";
  const boy = "boy";
  const dude = "dude";

  const female = "female";
  const girl = "girl";
  const dudette = "dudette";

  if (lowercaseMessage.indexOf(female) > -1) {
    gender = female;
    languageMessage = subOutString(lowercaseMessage, female);
  } else if (lowercaseMessage.indexOf(girl) > -1) {
    gender = female;
    languageMessage = subOutString(lowercaseMessage, girl);
  } else if (lowercaseMessage.indexOf(dudette) > -1) {
    gender = female;
    languageMessage = subOutString(lowercaseMessage, dudette);
  } else if (lowercaseMessage.indexOf(male) > -1) {
    gender = male;
    languageMessage = subOutString(lowercaseMessage, male);
  } else if (lowercaseMessage.indexOf(guy) > -1) {
    gender = male;
    languageMessage = subOutString(lowercaseMessage, guy);
  } else if (lowercaseMessage.indexOf(boy) > -1) {
    gender = male;
    languageMessage = subOutString(lowercaseMessage, boy);
  } else if (lowercaseMessage.indexOf(dude) > -1) {
    gender = male;
    languageMessage = subOutString(lowercaseMessage, dude);
  } else {
    gender = female;
    languageMessage = lowercaseMessage;
  }

  if (voices.hasOwnProperty(languageMessage)) {
    languageChoice = voices[languageMessage];
  } else {
    languageChoice = australianVoice;
  }

  // save the user's preferences
  await datastore.updateUserPreference(userId, "language", languageChoice);
  await datastore.updateUserPreference(userId, "gender", gender.toUpperCase());
  await datastore.updateUserPreference(
    userId,
    "simpleLanguageName",
    simpleName(languageChoice)
  );

  return {
    name: languageChoice,
    gender: gender.toUpperCase(),
    simpleName: simpleName(languageChoice)
  };
}

function simpleName(languageChoice = "") {
  return languageChoice === australianVoice
    ? "Australian"
    : languageChoice === americanVoice
    ? "American"
    : languageChoice === britishVoice
    ? "British"
    : languageChoice === frenchVoice
    ? "French"
    : languageChoice === germanVoice
    ? "German"
    : languageChoice === spanishVoice
    ? "Spanish"
    : "Unspecified (Australian)";
}

module.exports = {
  voiceChoice: voiceChoiceService,
  languageList: languageList,
  simpleName: simpleName
};
