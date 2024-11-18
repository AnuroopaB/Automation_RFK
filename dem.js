const axios = require('axios');
const https = require('https');
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false 
  })
});
const headers = [];
const headerTemplate = {
  'Accept': 'application/json',
  'Authentication-Type': 'DB',
  'Authorization': ''
}
let UDPinBT = 0;
let RTPinBT = 0;
async function login(URL){
    const loginPayload = {
      username: 'admin',
      password: 'admin'
    };
    try {
      const response = await axiosInstance.post(URL, loginPayload, {headers: headerTemplate});
      const header = { ...headerTemplate, Authorization: response.data };
      headers.push(header);
    } catch (error) {
      console.error('Error during login:', error);
    }
  }

async function postCall(URL, payload, header) {
  try {
    const response = await axiosInstance.post(URL, payload, {headers: header});
    return response;
  } catch (error) {
    console.log('Error: ' + error +', ' + error.response.data.error);
    throw error;
  }
}
async function sourceUp(URL, header) {
    try {
        const response = await axiosInstance.post(URL, {}, {headers: header});
        return response;
    } catch (error) {
        console.log('Error: ' + error +', ' + error.response.data.error);
        return false;
    }
}
async function statusCheck(URL, ID, int, header){  //, headerO, IDo) {
    try {
        const response = await axiosInstance.get(URL, {headers: header});
        let check = false;
        let stat = "";
        if(ID.includes("UDP")){
            if( int == 1){
                stat = response.data.statistics.udpStatistics.inputPresent;
                if (stat == true){
                  UDPinBT = response.data.statistics.tsStatistics.bitrate;
                  console.log(UDPinBT)
                }
            }else{
                stat = response.data.statistics.udpStatistics.outputPresent;
                if (stat == true){
                  if (response.data.statistics.tsStatistics.bitrate >= UDPinBT*0.5){
                    stat = true;
                    console.log(response.data.statistics.tsStatistics.bitrate);
                  }else{
                    stat = false;
                  }
                }
            }
        }
        if(ID.includes("RTP")){
            if( int == 1){
                stat = response.data.statistics.udpStatistics.inputPresent;
                if (stat == true){
                  RTPinBT = response.data.statistics.tsStatistics.bitrate;
                }
            }else{
                stat = response.data.statistics.rtpStatistics.outputPresent;
                if (stat == true){
                  if (response.data.statistics.tsStatistics.bitrate >= RTPinBT*0.5){
                    stat = true;
                  }else{
                    stat = false;
                  }
                }
            }
        }
        if(ID.includes("SRT")){
            stat = response.data.statistics.srtStatistics.status;
        }
        if(ID.includes("RIST")){
            stat = response.data.statistics.ristStatistics.connectionStatus;
        }
        const bitrate = response.data.statistics.tsStatistics.bitrate;//need null check
        if((stat === true || stat === "CONNECTED") && (bitrate)>0){
          check = true;
        }
        //CCR
        return check;
    } catch (error) {
        console.log('Error: ' + error +', ' + error.response.data.error);
        return false;
    }
}

async function resourceExists(Id, URL, indicator, header) {
    try {
      const response = await axiosInstance.get(URL, {headers: header});
      if (indicator == 0){
        const inputs = response.data.inputs;
        return inputs.some(input => input.inputInfo.inputId === Id);
      }
      if (indicator == 1){
        const flows = response.data;
        return flows.some(flow => flow.flowId === Id);
      }
      if (indicator == 2){
        const dests = response.data.outputs;
        return dests.some(output => output.outputInfo.outputId === Id);
      }
    } catch (error) {
      console.log('Error fetching inputs: ' + error +', ' + error.response.data.error);
      return false;
    }
  }
  
  async function getId(baseId, URL, indicator, header) {
    let Id = baseId;
    let counter = 2;
    while (await resourceExists(Id, URL, indicator, header)) {
      Id = baseId.replace(/_\d+$/, '');
      Id = `${Id}_${counter}`;
      counter++;
    }
    return Id;
  }
  async function initialize(URLs) {
    let loginPromises = URLs.map(URL => login(URL));
    await Promise.all(loginPromises);
  }
  async function deleteCall(URL, header) {
    try {
      const response = await axiosInstance.delete(URL, {headers: header});
      return response;
    } catch (error) {
      console.log('Error: ' + error +', ' + error.response.data.error);
      throw error;
    }
  }
module.exports = {initialize, headers, postCall, sourceUp, statusCheck, getId, deleteCall};

