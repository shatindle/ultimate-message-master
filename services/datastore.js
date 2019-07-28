const { Datastore } = require("@google-cloud/datastore");
const config = require("config");
const metrics = require("./metrics");

const projectId = config.get("project_id");
const keyFilename = config.get("google_config_path");

const datastore = new Datastore({
  projectId,
  keyFilename
});

var debug = false;

async function listUserPreferences() {
  console.log("LISTING");
  const query = datastore.createQuery("UserPreferences");

  const [userPreferences] = await datastore.runQuery(query);

  return userPreferences;
}

async function updateUserPreference(userId = "", key = "", value = "") {
  const transaction = datastore.transaction();
  const userKey = datastore.key(["UserPreferences", userId]);

  try {
    await transaction.run();
    var [pref] = await transaction.get(userKey);

    if (!pref) {
      transaction.save({
        key: userKey,
        data: [
          {
            name: "UserId",
            value: userId
          },
          {
            name: key,
            value: value
          }
        ]
      });

      pref = {};
      pref["UserId"] = userId;
      pref[key] = value;
    } else {
      pref[key] = value;
      transaction.save({
        key: userKey,
        data: pref
      });
    }

    await transaction.commit();

    if (debug) metrics(`Task ${userId} updated successfully.`);

    return pref;
  } catch (err) {
    transaction.rollback();
    throw err;
  }
}

module.exports = {
  init: function(useDebug) {
    debug = useDebug;
  },
  listUserPreferences: listUserPreferences,
  updateUserPreference: updateUserPreference
};
