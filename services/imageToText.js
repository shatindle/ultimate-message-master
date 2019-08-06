const vision = require("@google-cloud/vision");
const config = require("config");
const Discord = require("discord.js");
const datastore = require("./datastore");
const fs = require("fs");
const https = require("https");

const projectId = config.get("project_id");
const keyFilename = config.get("google_config_path");

var debug = false;
var discordClient;
var textChannel;

const visionClient = new vision.ImageAnnotatorClient({
  projectId,
  keyFilename
});

function getTextFromFiles(message = new Discord.Message()) {
  if (message.attachments.size === 1) {
    // download a copy of the file
    const url = message.attachments.first().url;

    var request = https
      .get(url, resp => {
        resp.setEncoding("base64");
        var body = "";
        resp.on("data", data => {
          body += data;
        });
        resp.on("end", async () => {
          var requests = [
            {
              image: {
                content: body
              },
              features: [{ type: "TEXT_DETECTION" }]
            }
          ];

          // Make a call to the Vision API to detect text
          const results = await visionClient.batchAnnotateImages({ requests });
          const detections = results[0].responses;
          if (detections.length === 1) {
            const discoveredText = detections[0].textAnnotations;

            const summary = discoveredText[0].description.split(/\r?\n/);

            var matrix = [];
            var mode = "";

            for (var i = 0; i < summary.length; i++) {
              switch (summary[i]) {
                case "Regular Battle":
                  mode = "Regular";
                  break;
                case "League Battle":
                  mode = "League";
                  break;
                case "Ranked Battle":
                  mode = "Ranked";
                  break;
                case "Private Battle":
                  mode = "Private";
                  break;
                default:
                  if (mode !== "") {
                    if (
                      summary.length > i + 2 &&
                      summary[i + 2].endsWith("p") &&
                      (summary[i + 1] === "VICTORY" ||
                        summary[i + 1] === "DEFEAT")
                    ) {
                      matrix.push({
                        level: summary[i],
                        victory: summary[i + 1] === "VICTORY",
                        score: summary[i + 2].substr(
                          0,
                          summary[i + 2].length - 1
                        )
                      });
                    }
                  }
                  break;
              }
            }

            var responseMessage = "Scores:\n";

            matrix.map(
              s =>
                (responseMessage += `${s.victory ? "WIN\t" : "LOSE\t"}${
                  s.score
                }p\t${s.level}\n`)
            );

            message.channel.sendMessage(responseMessage);
          }
        });
      })
      .on("error", e => {
        console.log(`Got error: ${e.message}`);
      });
  } else {
    message.channel.send("Please attach exactly one image and try again.");
  }
}

module.exports = getTextFromFiles;
