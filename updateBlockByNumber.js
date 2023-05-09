const path = require("path");
const fs = require("fs");
const https = require("https");

const directoryPath = path.join(__dirname, "appchains");

fs.readdir(directoryPath, (err, files) => {
  if (err) {
    throw new Error("Unable to scan directory: " + files);
  }

  files.forEach(async (file) => {
    const tmpAppChain = readFile(directoryPath + "/" + file);

    updateHeight(tmpAppChain);
  });
});

const readFile = (fileDir) => {
  let rawdata = fs.readFileSync(fileDir);
  return JSON.parse(rawdata);
};

const updateHeight = (chain) => {
  if (chain.jsonRPC) {
    try {
      chain.ecosystem.toLowerCase() === "cosmos"
        ? handleCosmos(chain)
        : handleEth(chain);
    } catch (error) {
      console.log("Error fetching block height for " + chain.shortName + ": ", error);
    }
  } else {
    console.log("RPC is not provided for " + chain.shortName);
  }
};

const handleCosmos = (chain) => {
  options = {
    hostname: chain.jsonRPC.split("/")[2],
    path: "/status",
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const request = https
    .request(options, (res) => {
      let data = "";
      res
        .on("data", (chunk) => {
          data += chunk;
        })
        .on("end", () => handleCosmosResponse(data, chain));
    })
    .on("error", (err) => {
      throw new Error("No data is provided: " + err);
    });

  request.end();
};

const handleCosmosResponse = (data, chain) => {
  console.log("Response fetched: ", chain.shortName);

  try {
    const result = getResult(data, chain.shortName);

    chain.blockNumber = result.sync_info?.latest_block_height;
    chain.blockNumberUpdated = result.sync_info?.latest_block_time;
    writeJSONFile(chain);
  } catch (error) {
    console.log("Error fetching block height for " + chain.shortName + ": ", error);
  }
};

const handleEth = (chain) => {
  body = JSON.stringify({
    jsonrpc: "2.0",
    method: "eth_getBlockByNumber",
    params: ["latest", false],
    id: 0,
  });

  options = {
    hostname: chain.jsonRPC.split("/")[2],
    path: chain.jsonRPC.substring(chain.jsonRPC.indexOf("/", 8)),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const request = https
    .request(options, (res) => {
      let data = "";
      res
        .on("data", (chunk) => {
          data += chunk;
        })
        .on("end", () => handleEthResponse(data, chain));
    })
    .on("error", (err) => {
      throw new Error("No data is provided: " + err);
    });

  request.end(body);
};

const handleEthResponse = (data, chain) => {
  console.log("Response ended: ", chain.shortName);
  
  try {
    const result = getResult(data, chain.shortName);

    chain.blockNumber = parseInt(result.number, 16);
    chain.blockNumberUpdated = new Date(result.timestamp * 1000).toISOString();
    writeJSONFile(chain);
  } catch (error) {
    console.log("Error fetching block height for " + chain.shortName + ": ", error);
  }
};

const getResult = (data, chainName) => {
  const response = JSON.parse(data);
  const result = response.result;
  if (!result) {
    throw new Error("No data is provided for" + chainName);
  }
  return result;
};

const writeJSONFile = (data) => {
  const path = __dirname + "/appchains/" + data.name.toLowerCase() + ".json";

  fs.writeFile(path, JSON.stringify(data), (err) => {
    if (err) {
      throw new Error("Unable to crate file: " + err);
    }

    console.log("JSON file for " + data.shortName + " generated successfully.");
  });
};
