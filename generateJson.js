const path = require("path");
const fs = require("fs");

const directoryPath = path.join(__dirname, "appchains");
var mainJson = [];

fs.readdir(directoryPath, (err, files) => {
  if (err) {
    throw new Error("Unable to scan directory: " + err);
  }

  files.forEach((file) => {
    console.log("Reading file: " + file);
    mainJson.push(readFile(directoryPath + "/" + file));
  });

  writeJSONFile(mainJson);
});

const readFile = (fileDir) => {
  let rawdata = fs.readFileSync(fileDir);
  return JSON.parse(rawdata);
};

const writeJSONFile = (data) => {
  const path = __dirname + "/data.json";

  fs.writeFile(path, JSON.stringify({ data }), (err) => {
    if (err) {
      throw new Error("Unable to create file: " + err);
    }

    console.log("JSON file generated successfully.");
  });
};
