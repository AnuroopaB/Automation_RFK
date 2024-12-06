const axios = require("axios");
const https = require("https");
const jwt = require("jsonwebtoken");
// const rfk1_ip = "172.16.121.22";
// const rfk2_ip = "172.17.166.34";
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});
let currentToken = "";
let urlToHeaderMap = {};
const headers = [];
const headerTemplate = {
  "Content-Type": "application/json",
  Accept: "application/json",
  "authentication-type": "DB",
};

let UDPinBT,
  RTPinBT,
  SRToutBT,
  RISTSoutBT,
  RISTMoutBT = 0;

async function initialize(RFKs) {
  const loginPromises = RFKs.map(async (RFK) => {
    const loginHeader = await login(`http://${RFK}:5000/api/v1/login`);
    urlToHeaderMap[RFK] = loginHeader;
  });
  await Promise.all(loginPromises);
  return urlToHeaderMap;
}

async function login(URL) {
  const loginPayload = {
    username: "admin",
    password: "admin",
  };
  try {
    const response = await axiosInstance.post(URL, loginPayload, {
      headers: headerTemplate,
    });
    currentToken = response.data;
    const header = { ...headerTemplate, Authorization: currentToken };
    headers.push(header);
    return header;
  } catch (error) {
    console.error("Error during login:", error);
  }
}

function isTokenExpired(token) {
  try {
    const decoded = jwt.decode(token);
    console.log("Decoded: " + decoded.exp);
    console.log(`Date Now: ${Date.now() / 1000}`);
    return decoded.exp < Date.now() / 1000;
  } catch (error) {
    console.error("Error decoding token:", error);
    return true;
  }
}

function extractIpAddress(fullUrl) {
  const match = fullUrl.match(/^http?:\/\/([^\/:]+)(:\d+)?\/?/); // Matches "http://ipaddress" or "https://ipaddress"
  return match ? match[1] : fullUrl; // Return the IP address part of the URL
}

async function postCall(URL, payload) {
  try {
    console.log(URL);
    console.log(JSON.stringify(payload, null, 2));

    const ipAddress = extractIpAddress(URL);
    let header = urlToHeaderMap[ipAddress];
    // if (!header && isTokenExpired(header.Authorization)) {
    //   console.log("Token expired, re-authenticating...");
    //   header = await login(
    //     URL.replace(/(inputs|outputs|flows)(\/.*)?$/, "login")
    //   ); // Re-login to get a new token
    //   urlToHeaderMap[ipAddress] = header;
    // }
    // Determine resource type from URL
    const resourceType = URL.includes("/inputs")
      ? "input"
      : URL.includes("/outputs")
      ? "output"
      : URL.includes("/flows")
      ? "flow"
      : "resource";
    // Get the appropriate ID based on resource type
    const resourceId =
      resourceType === "input"
        ? payload.inputId
        : resourceType === "output"
        ? payload.outputId
        : resourceType === "flow"
        ? payload.flowId
        : "";
    const response = await axiosInstance.post(URL, payload, {
      headers: header,
    });
    console.log(response.data);

    // Log success message with appropriate resource type and ID
    console.log(
      `Successfully created ${resourceType} resource with ${resourceType}Id: ${resourceId}`
    );

    return response;
  } catch (error) {
    console.error(
      `Error creating ${resourceType}: ${error}, ${
        error.response?.data?.error || "Unknown error"
      }`
    );
    throw error;
  }
}

async function sourceUp(URL, header) {
  try {
    // const ipAddress = extractIpAddress(URL);
    // let header = urlToHeaderMap[ipAddress];
    // if (isTokenExpired(header.Authorization)) {
    //   console.log("Token expired, re-authenticating...");
    //   header = await login(
    //     URL.replace(/(inputs|outputs|flows)(\/.*)?$/, "login")
    //   ); // Re-login to get a new token
    //   urlToHeaderMap[ipAddress] = header;
    // }
    const urlParts = URL.split("/");
    const action = urlParts[urlParts.length - 1]; // e.g., 'enable' or 'start'
    const resourceId = urlParts[urlParts.length - 2]; // e.g., inputId or flowId

    const response = await axiosInstance.post(URL, {}, { headers: header });
    console.log(response.data);
    console.log(`Successfully ${action}ed resource ID: ${resourceId}`);
    return response;
  } catch (error) {
    console.log(
      "Error: " +
        error +
        ", " +
        (error.response ? error.response.data.error : "Unknown error")
    );
    return false;
  }
}
async function statusCheck(URL, ID, int, header) {
  try {
    const ipAddress = extractIpAddress(URL);
    let header = urlToHeaderMap[ipAddress];
    console.log(JSON.stringify(header, null, 2));
    const response = await axiosInstance.get(URL, { headers: header });
    let check = false;
    let stat = "";
    if (ID.includes("UDP")) {
      if (int == 1) {
        stat = response.data.statistics.udpStatistics.inputPresent;
        if (
          stat == true &&
          Object.keys(response.data.statistics.tsStatistics).length > 0
        ) {
          UDPinBT = response.data.statistics.tsStatistics.bitrate;
          RTPinBT = UDPinBT;
        } else {
          UDPinBT = -1;
          stat = false;
        }
      } else {
        stat = response.data.statistics.udpStatistics.outputPresent;
        if (stat == true) {
          if (
            UDPinBT != -1 &&
            Object.keys(response.data.statistics.tsStatistics).length > 0 &&
            response.data.statistics.tsStatistics.bitrate >= UDPinBT * 0.5
          ) {
            stat = true;
          } else {
            stat = false;
          }
        }
      }
    }
    if (ID.includes("RTP")) {
      if (int == 1) {
        stat = response.data.statistics.udpStatistics.inputPresent;
        if (
          stat == true &&
          Object.keys(response.data.statistics.tsStatistics).length > 0
        ) {
          RTPinBT = response.data.statistics.tsStatistics.bitrate;
        } else {
          RTPinBT = -1;
          stat = false;
        }
      } else {
        stat = response.data.statistics.rtpStatistics.outputPresent;
        if (stat == true) {
          if (
            RTPinBT != -1 &&
            Object.keys(response.data.statistics.tsStatistics).length > 0 &&
            response.data.statistics.tsStatistics.bitrate >= RTPinBT * 0.5
          ) {
            stat = true;
          } else {
            stat = false;
          }
        }
      }
    }
    if (ID.includes("SRT")) {
      stat = response.data.statistics.srtStatistics.status;
      if (int == 1 && stat == "CONNECTED") {
        if (
          SRToutBT != -1 &&
          Object.keys(response.data.statistics.tsStatistics).length > 0 &&
          response.data.statistics.tsStatistics.bitrate >= SRToutBT * 0.5
        ) {
          stat = "CONNECTED";
        } else {
          stat = "DISCONNECTED";
        }
      }
      if (int != 1 && stat == "CONNECTED") {
        if (Object.keys(response.data.statistics.tsStatistics).length > 0) {
          SRToutBT = response.data.statistics.tsStatistics.bitrate;
        } else {
          SRToutBT = -1;
          stat = "DISCONNECTED";
        }
      }
    }
    if (ID.includes("RIST")) {
      stat = response.data.statistics.ristStatistics.connectionStatus;
      if (ID.includes("MAIN")) {
        if (int == 1 && stat == "CONNECTED") {
          if (
            RISTMoutBT != -1 &&
            Object.keys(response.data.statistics.tsStatistics).length > 0 &&
            response.data.statistics.tsStatistics.bitrate >= RISTMoutBT * 0.5
          ) {
            stat = "CONNECTED";
          } else {
            stat = "DISCONNECTED";
          }
        }
        if (int != 1 && stat == "CONNECTED") {
          if (Object.keys(response.data.statistics.tsStatistics).length > 0) {
            RISTMoutBT = response.data.statistics.tsStatistics.bitrate;
          } else {
            RISTMoutBT = -1;
            stat = "DISCONNECTED";
          }
        }
      } else {
        if (int == 1 && stat == "CONNECTED") {
          if (
            RISTSoutBT != -1 &&
            Object.keys(response.data.statistics.tsStatistics).length > 0 &&
            response.data.statistics.tsStatistics.bitrate >= RISTSoutBT * 0.5
          ) {
            stat = "CONNECTED";
          } else {
            stat = "DISCONNECTED";
          }
        }
        if (int != 1 && stat == "CONNECTED") {
          if (Object.keys(response.data.statistics.tsStatistics).length > 0) {
            RISTSoutBT = response.data.statistics.tsStatistics.bitrate;
          } else {
            RISTSoutBT = -1;
            stat = "DISCONNECTED";
          }
        }
      }
    }
    if (stat === true || stat === "CONNECTED") {
      check = true;
    }
    //CCR
    return check;
  } catch (error) {
    console.log("Error: " + error + ", " + error.response.data.error);
    return false;
  }
}

async function resourceExists(Id, URL, indicator, header) {
  try {
    // if (isTokenExpired(header.Authorization)) {
    //   console.log("Token expired, re-authenticating...");
    //   header = await login(
    //     URL.replace(/(inputs|outputs|flows)(\/.*)?$/, "login")
    //   ); // Re-login to get a new token
    //   urlToHeaderMap[ipAddress] = header;
    // }
    const response = await axiosInstance.get(URL, { headers: header });
    if (indicator == 0) {
      const inputs = response.data.inputs;
      return inputs.some((input) => input.inputInfo.inputId === Id);
    }
    if (indicator == 1) {
      const flows = response.data;
      return flows.some((flow) => flow.flowId === Id);
    }
    if (indicator == 2) {
      const dests = response.data.outputs;
      return dests.some((output) => output.outputInfo.outputId === Id);
    }
  } catch (error) {
    console.log(
      "Error fetching resource: " +
        Id +
        " " +
        error +
        ", " +
        error.response.data.error
    );
    return false;
  }
}

async function getId(baseId, URL, indicator, header) {
  let Id = baseId;
  let counter = 2;
  while (await resourceExists(Id, URL, indicator, header)) {
    Id = baseId.replace(/_\d+$/, "");
    Id = `${Id}_${counter}`;
    counter++;
  }
  return Id;
}

async function deleteCall(URL, header) {
  try {
    const ipAddress = extractIpAddress(URL);
    let header = urlToHeaderMap[ipAddress];
    // if (isTokenExpired(header.Authorization)) {
    //   console.log("Token expired, re-authenticating...");
    //   header = await login(
    //     URL.replace(/(inputs|outputs|flows)(\/.*)?$/, "login")
    //   ); // Re-login to get a new token
    // }
    const response = await axiosInstance.delete(URL, { headers: header });
    return response;
  } catch (error) {
    console.log("Error: " + error + ", " + error.response.data.error);
    throw error;
  }
}
module.exports = {
  initialize,
  postCall,
  headers,
  sourceUp,
  statusCheck,
  getId,
  deleteCall,
};
