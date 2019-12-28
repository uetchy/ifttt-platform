const googlehome = require("google-home-notifier");

const googleHomeDeviceName = process.env.GOOGLE_HOME_DEVICE_NAME;
const googleHomeDeviceIP = process.env.GOOGLE_HOME_DEVICE_IP;

exports.chromeCast = async function(text, language = "ja") {
  return new Promise((resolve, reject) => {
    console.log("Searching ChromeCast devices", googleHomeDeviceIP);
    console.log(language);

    try {
      googlehome.ip(googleHomeDeviceIP, language);
    } catch (err) {
      return reject("cannot find Google Home device");
    }
    //googlehome.device(googleHomeDeviceName, language)

    if (!text) {
      return reject("specify text param");
    }

    if (text.startsWith("http")) {
      const mp3_url = text;
      googlehome.play(mp3_url, notifyRes => {
        console.log(notifyRes);
        if (notifyRes === "error") {
          return reject(new Error("failed to cast"));
        }
        resolve(`Google Home will play sound from url "${mp3_url}"\n`);
      });
    } else {
      googlehome.notify(text, notifyRes => {
        console.log(notifyRes);
        if (notifyRes === "error") {
          return reject(new Error("failed to cast"));
        }
        resolve(`Google Home will say "${text}" in ${language}\n`);
      });
    }
  });
};
