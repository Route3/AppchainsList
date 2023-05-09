const path = require("path");
const fs = require("fs");
const https = require("https");

const directoryPath = path.join(__dirname, "appchains");

fs.readdir(directoryPath, (err, files) => {
  if (err) {
    throw new Error("Unable to scan directory: " + err);
  }

  files.forEach((file) => {
    console.log("Reading file: " + file);
    const tmpAppChain = readFile(directoryPath + "/" + file);
    const tmpShortName = tmpAppChain.shortName;

    getQuote(tmpShortName)
      .then((data) => {
        tmpAppChain.value = data.price;
        tmpAppChain.valueUpdated = data.last_updated;
        writeJSONFile(tmpAppChain);
      })
      .catch((err) => {
        console.log("Error geting data for " + tmpShortName + ":", err);
      });
  });
});

const readFile = (fileDir) => {
  let rawdata = fs.readFileSync(fileDir);
  return JSON.parse(rawdata);
};

const getQuote = (symbol) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: process.env.API_URL,
      path: "/v1/cryptocurrency/quotes/latest?symbol=" + symbol,
      headers: {
        "X-CMC_PRO_API_KEY": process.env.API_KEY,
      },
    };

    https
      .get(options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          console.log("Response ended: ", symbol);
          const response = JSON.parse(data);
          const quote = response?.data[symbol]?.quote?.USD;

          if (!quote) {
            reject("No data is provided");
          }
          resolve(quote);
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
};

const writeJSONFile = (data) => {
  const path = __dirname + "/appchains/" + data.name.toLowerCase() + ".json";

  fs.writeFile(path, JSON.stringify(data), (err) => {
    if (err) {
      throw new Error("Unable to crate file: " + err);
    }

    console.log("JSON file for " + data.name + " generated successfully.");
  });
};
