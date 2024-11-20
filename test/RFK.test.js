const { initialize, headers, postCall, sourceUp, statusCheck, getId, deleteCall } = require('../dem.js');
const { payload_udp_in, payload_srt_in, payload_rist_in, payload_flow, payload_udp_out, payload_srt_out, payload_rist_out, out_ip1, ip2, out_ip2 } = require('../payloads.js');
const config = require('../conv.js')
const BASE_URL_RFK1 = config.BASE_URL_RFK1 + '/api/v1/';
const IN_EP = BASE_URL_RFK1 + 'inputs';
const OUT_EP = BASE_URL_RFK1 + 'outputs';
const inputIds = {};
const outputIds = {};
let flowId = '';
const BASE_URL_RFK2 = config.BASE_URL_RFK2 + '/api/v1/';
const IN_EP2 = BASE_URL_RFK2 + 'inputs';
const OUT_EP2 = BASE_URL_RFK2 + 'outputs';
const inputIds2 = {};
const outputIds2 = {};
let flowId2 = '';
const payloads_in2 = [{ name: 'UDP', payload: JSON.parse(JSON.stringify(payload_udp_in)) }, { name: 'RTP', payload: JSON.parse(JSON.stringify(payload_udp_in)) }, { name: 'SRT', payload: JSON.parse(JSON.stringify(payload_srt_in)) }, { name: 'RIST SIMPLE', payload: JSON.parse(JSON.stringify(payload_rist_in)) }, { name: 'RIST MAIN', payload: JSON.parse(JSON.stringify(payload_rist_in)) }];
const payloads_out2 = [{ name: 'UDP', payload: payload_udp_out }, { name: 'RTP', payload: payload_udp_out }, { name: 'SRT', payload: payload_srt_out }, { name: 'RIST SIMPLE', payload: payload_rist_out }, { name: 'RIST MAIN', payload: payload_rist_out }];
const payloads_in = { name: 'UDP', payload: payload_udp_in };
const payloads_out = [{ name: 'UDP', payload: JSON.parse(JSON.stringify(payload_udp_out)) }, { name: 'RTP', payload: JSON.parse(JSON.stringify(payload_udp_out)) }, { name: 'SRT', payload: JSON.parse(JSON.stringify(payload_srt_out)) }, { name: 'RIST SIMPLE', payload: JSON.parse(JSON.stringify(payload_rist_out)) }, { name: 'RIST MAIN', payload: JSON.parse(JSON.stringify(payload_rist_out)) }];
const inputIds3 = {};
const payloads_in3 = [{ name: 'UDP', payload: payload_udp_in }, { name: 'RTP', payload: payload_udp_in }, { name: 'SRT', payload: payload_srt_in }, { name: 'RIST SIMPLE', payload: payload_rist_in }, { name: 'RIST MAIN', payload: payload_rist_in }];
const URLs = [`${BASE_URL_RFK1}login`, `${BASE_URL_RFK2}login`]
let allTestsPassed = true;
let header1 = {};
let header2 = {};
beforeAll(async () => {
  await initialize(URLs);
  //console.log('Headers after initialization:', headers);
  header1 = headers[0];
  header2 = headers[1];
});
describe('Source creation in Main RFK', () => {
  it(`Create UDP source in Main RFK`, async () => {
    try {
      let payload = payloads_in.payload;
      const availableInputId = await getId(payload.inputId, IN_EP, 0, header1);
      if (availableInputId !== payload.inputId) {
        payload.inputId = availableInputId;
        payload.inputAliasName = availableInputId;
      }
      const res = await postCall(IN_EP, payload, header1);
      expect(res.status).toBe(201);
      expect(res.statusText).toContain("Created");
      inputIds["UDP"] = payload.inputId;
      //console.log(inputIds);
    } catch (err) {
      allTestsPassed = false;
      throw new Error(err);
    }
  }, 10000);
});
describe('Start Sources in Main RFK', () => {
  it(`Start UDP source`, async () => {
    try {
      const inputId = inputIds["UDP"];
      if (!inputId) {
        throw new Error(`Input ID for UDP not found`);
      }
      let res = await sourceUp(`${IN_EP}/${inputId}/enable`, header1);
      expect(res.status).toBe(200);
      res = await sourceUp(`${IN_EP}/${inputId}/start`, header1);
      expect(res.status).toBe(200);
    } catch (err) {
      allTestsPassed = false;
      throw new Error(err);
    }
  }, 10000);
});


describe('Create Flow in Main RFK', () => {
  it('Create flow', async () => {
    try {
      const URL_flow = BASE_URL_RFK1 + 'flows';
      const flowPayload = { ...payload_flow, inputs: Object.values(inputIds) };
      const availableFlowId = await getId(flowPayload.flowId, URL_flow, 1, header1);
      if (availableFlowId !== flowPayload.flowId) {
        flowPayload.flowId = availableFlowId;
        flowPayload.flowAliasName = availableFlowId;
      }
      flowId = availableFlowId;
      const res = await postCall(URL_flow, flowPayload, header1);
      expect(res.status).toBe(201);
      expect(res.statusText).toContain("Created");
      await sourceUp(`${URL_flow}/${flowId}/enable`, header1);
      await sourceUp(`${URL_flow}/${flowId}/start`, header1);
    } catch (err) {
      allTestsPassed = false;
      throw new Error(err);
    }
  }, 10000);
});
describe('Destination creation in Main RFK', () => {
  payloads_out.forEach(({ name, payload }) => {
    it(`Create ${name} destination`, async () => {
      try {
        if (name == 'RIST MAIN') {
          payload.outputId = "TEST-RIST-MAIN-OUT_1";
          payload.outputAliasName = "TEST-RIST-MAIN-OUT_1";
          payload.config.rist.ristConfig.Profile = "MAIN";
          payload.config.rist.ristConfig.port += 2;
          //payload.config.rist.ristConfig.Mode = "SERVER";
        }
        payload.inputs = [inputIds["UDP"]];
        payload.flowId = flowId;
        if (name == 'RTP') {
          payload.outputId = "TEST-RTP-OUT_1";
          payload.outputAliasName = "TEST-RTP-OUT_1";
          payload.config.udp.encapsulationConfig.EncapsulationType = "RTP"
        }
        const availableoutputId = await getId(payload.outputId, OUT_EP, 2, header1);
        if (availableoutputId !== payload.outputId) {
          payload.outputId = availableoutputId;
          payload.outputAliasName = availableoutputId;
        }
        const res = await postCall(OUT_EP, payload, header1);
        expect(res.status).toBe(201);
        expect(res.statusText).toContain("Created");
        outputIds[name] = payload.outputId;

        //console.log(outputIds);
      } catch (err) {
      allTestsPassed = false;
        throw new Error(err);
      }
    }, 10000);
  });
});
describe('Start Main RFK Destinations', () => {
  payloads_out.forEach(({ name }) => {
    it(`Start ${name} source`, async () => {
      try {
        const outputId = outputIds[name];
        if (!outputId) {
          throw new Error(`output ID for ${name} not found`);
        }
        let res = await sourceUp(`${OUT_EP}/${outputId}/enable`, header1);
        expect(res.status).toBe(200);
        res = await sourceUp(`${OUT_EP}/${outputId}/start`, header1);
        expect(res.status).toBe(200);
      } catch (err) {
      allTestsPassed = false;
        throw new Error(err);
      }
    }, 10000);
  });
});


describe('Source creation in Test RFK', () => {
  payloads_in2.forEach(({ name, payload }) => {
    it(`Create ${name} source`, async () => {
      try {
        if (name == 'RIST MAIN') {
          payload.inputId = "TEST-RIST-MAIN-IN_1";
          payload.inputAliasName = "TEST-RIST-MAIN-IN_1";
          payload.config.rist.ristConfig.Profile = "MAIN";
          //payload.config.rist.ristConfig.Mode = "SERVER";
          payload.config.rist.ristConfig.port += 2;
        }
        if (name == 'RTP' || name == 'UDP') {
          payload.config.udp.ipConfig.ipAddress = out_ip1;
          if (name == 'RTP') {
            payload.inputId = "TEST-RTP-IN_1";
            payload.inputAliasName = "TEST-RTP-IN_1";
          }
        }
        const availableInputId = await getId(payload.inputId, IN_EP2, 0, header2);
        if (availableInputId !== payload.inputId) {
          payload.inputId = availableInputId;
          payload.inputAliasName = availableInputId;
        }
        const res = await postCall(IN_EP2, payload, header2);
        expect(res.status).toBe(201);
        expect(res.statusText).toContain("Created");
        inputIds2[name] = payload.inputId;

        //console.log(inputIds2);
      } catch (err) {
      allTestsPassed = false;
        throw new Error(err);
      }
    }, 50000);
  });
});
describe('Start Test RFK Sources', () => {
  payloads_in2.forEach(({ name }) => {
    it(`Start ${name} source`, async () => {
      try {
        const inputId = inputIds2[name];
        if (!inputId) {
          throw new Error(`Input ID for ${name} not found`);
        }
        let res = await sourceUp(`${IN_EP2}/${inputId}/enable`, header2);
        expect(res.status).toBe(200);
        res = await sourceUp(`${IN_EP2}/${inputId}/start`, header2);
        expect(res.status).toBe(200);
      } catch (err) {
      allTestsPassed = false;
        throw new Error(err);
      }
    }, 50000);
  });
});


describe('Create Flow in Test RFK', () => {
  it('Create flow', async () => {
    try {
      const URL_flow = BASE_URL_RFK2 + 'flows';
      const flowPayload = { ...payload_flow, inputs: Object.values(inputIds2) };
      const availableflowId2 = await getId(flowPayload.flowId, URL_flow, 1, header2);
      if (availableflowId2 !== flowPayload.flowId) {
        flowPayload.flowId = availableflowId2;
        flowPayload.flowAliasName = availableflowId2;
      }
      flowId2 = availableflowId2;
      const res = await postCall(URL_flow, flowPayload, header2);
      expect(res.status).toBe(201);
      expect(res.statusText).toContain("Created");
      await sourceUp(`${URL_flow}/${flowId2}/enable`, header2);
      await sourceUp(`${URL_flow}/${flowId2}/start`, header2);
    } catch (err) {
      allTestsPassed = false;
      throw new Error(err);
    }
  }, 50000);
});
describe('Destination creation in Test RFK', () => {
  payloads_out2.forEach(({ name, payload }) => {
    it(`Create ${name} destination`, async () => {
      try {
        if (name == 'SRT') {
          payload.config.srt.srtConfig.ipAddress = ip2;
        }
        if (name.includes('RIST')) {
          payload.config.rist.ristConfig.ipAddress = ip2;
          if (name == 'RIST MAIN') {
            payload.outputId = "TEST-RIST-MAIN-OUT_1";
            payload.outputAliasName = "TEST-RIST-MAIN-OUT_1";
            payload.config.rist.ristConfig.Profile = "MAIN";
            //payload.config.rist.ristConfig.Mode = "SERVER";
            payload.config.rist.ristConfig.port += 2;
          }
        }
        payload.inputs = [inputIds2[name]];
        payload.flowId = flowId2;
        if (name == 'RTP' || name == 'UDP') {
          payload.config.udp.ipConfig.ipAddress = out_ip2;
          if (name == 'RTP') {
            payload.outputId = "TEST-RTP-OUT_1";
            payload.outputAliasName = "TEST-RTP-OUT_1";
            payload.config.udp.encapsulationConfig.EncapsulationType = "RTP"
          }
        }
        const availableoutputId = await getId(payload.outputId, OUT_EP2, 2, header2);
        if (availableoutputId !== payload.outputId) {
          payload.outputId = availableoutputId;
          payload.outputAliasName = availableoutputId;
        }
        const res = await postCall(OUT_EP2, payload, header2);
        expect(res.status).toBe(201);
        expect(res.statusText).toContain("Created");
        outputIds2[name] = payload.outputId;

        //console.log(outputIds2);
      } catch (err) {
      allTestsPassed = false;
        throw new Error(err);
      }
    }, 50000);
  });
});
describe('Start Test RFK Destinations', () => {
  payloads_out2.forEach(({ name }) => {
    it(`Start ${name} source`, async () => {
      try {
        const outputId = outputIds2[name];
        if (!outputId) {
          throw new Error(`output ID for ${name} not found`);
        }
        let res = await sourceUp(`${OUT_EP2}/${outputId}/enable`, header2);
        expect(res.status).toBe(200);
        res = await sourceUp(`${OUT_EP2}/${outputId}/start`, header2);
        expect(res.status).toBe(200);
      } catch (err) {
      allTestsPassed = false;
        throw new Error(err);
      }
    }, 50000);
  });
});


describe('Source creation in Main RFK for loopback', () => {
  payloads_in3.forEach(({ name, payload }) => {
    it(`Create ${name} source`, async () => {
      try {
        if (name == 'RIST MAIN') {
          payload.inputId = "TEST-RIST-MAIN-IN_1";
          payload.inputAliasName = "TEST-RIST-MAIN-IN_1";
          payload.config.rist.ristConfig.Profile = "MAIN";
          //payload.config.rist.ristConfig.Mode = "SERVER";
          payload.config.rist.ristConfig.port += 2;
        }
        if (name == 'RTP' || name == 'UDP') {
          payload.config.udp.ipConfig.ipAddress = out_ip2;
          if (name == 'RTP') {
            payload.inputId = "TEST-RTP-IN_1";
            payload.inputAliasName = "TEST-RTP-IN_1";
          }
        }
        const availableInputId = await getId(payload.inputId, IN_EP, 0, header1);
        if (availableInputId !== payload.inputId) {
          payload.inputId = availableInputId;
          payload.inputAliasName = availableInputId;
        }
        const res = await postCall(IN_EP, payload, header1);
        expect(res.status).toBe(201);
        expect(res.statusText).toContain("Created");
        inputIds3[name] = payload.inputId;

        //console.log(inputIds3);
      } catch (err) {
      allTestsPassed = false;
        throw new Error(err);
      }
    }, 10000);
  });
});
describe('Start Sources', () => {
  payloads_in3.forEach(({ name }) => {
    it(`Start ${name} source`, async () => {
      try {
        const inputId = inputIds3[name];
        if (!inputId) {
          throw new Error(`Input ID for ${name} not found`);
        }
        let res = await sourceUp(`${IN_EP}/${inputId}/enable`, header1);
        expect(res.status).toBe(200);
        res = await sourceUp(`${IN_EP}/${inputId}/start`, header1);
        expect(res.status).toBe(200);
      } catch (err) {
      allTestsPassed = false;
        throw new Error(err);
      }
    }, 10000);
  });
});

describe('Verify Status of Main RFK Source', () => {
  it(`UDP`, async () => {
    try {
      const inputId = inputIds["UDP"];
      //const IDo = outputIds["UDP"];
      //Const URLo = `${IN_EP}/${inputId}/status`
      if (!inputId) {
        throw new Error(`Input ID for UDP not found`);
      }
      let stat = await statusCheck(`${IN_EP}/${inputId}/status`, inputId, 1, header1);
      expect(stat).toBe(true);
    } catch (err) {
      allTestsPassed = false;
      throw new Error(err);
    }
  }, 10000);
});
describe('Verify Status of Main RFK Destinations', () => {
  payloads_out.forEach(({ name }) => {
    it(`${name}`, async () => {
      try {
        const outputId = outputIds[name];
        if (!outputId) {
          throw new Error(`output ID for ${name} not found`);
        }
        let stat = await statusCheck(`${OUT_EP}/${outputId}/status`, outputId, 2, header1);
        expect(stat).toBe(true);
      } catch (err) {
      allTestsPassed = false;
        throw new Error(err);
      }
    }, 10000);
  });
});
describe('Verify Status of Test RFK Sources', () => {
  payloads_in2.forEach(({ name }) => {
    it(`${name}`, async () => {
      try {
        const inputId = inputIds2[name];
        if (!inputId) {
          throw new Error(`Input ID for ${name} not found`);
        }
        let stat = await statusCheck(`${IN_EP2}/${inputId}/status`, inputId, 1, header2);
        expect(stat).toBe(true);
      } catch (err) {
      allTestsPassed = false;
        throw new Error(err);
      }
    }, 50000);
  });
});
describe('Verify Status of Test RFK Destinations', () => {
  payloads_out2.forEach(({ name }) => {
    it(`${name}`, async () => {
      try {
        const outputId = outputIds2[name];
        if (!outputId) {
          throw new Error(`output ID for ${name} not found`);
        }
        let stat = await statusCheck(`${OUT_EP2}/${outputId}/status`, outputId, 2, header2);
        expect(stat).toBe(true);
      } catch (err) {
      allTestsPassed = false;
        throw new Error(err);
      }
    }, 50000);
  });
});
describe('Verify Status of Sources in loopback RFK', () => {
  payloads_in3.forEach(({ name }) => {
    it(`${name}`, async () => {
      try {
        const inputId = inputIds3[name];
        if (!inputId) {
          throw new Error(`Input ID for ${name} not found`);
        }
        let stat = await statusCheck(`${IN_EP}/${inputId}/status`, inputId, 1, header1);
        expect(stat).toBe(true);
      } catch (err) {
      allTestsPassed = false;
        throw new Error(err);
      }
    }, 10000);
  });
});
if(config.Clear_All == "true"){
  describe('Clear All', () => {
    it(`Clearing all resources`, async () => {
      if (!allTestsPassed) {
        console.log("Skipping resource cleanup because some tests failed.");
        expect(allTestsPassed).toBe(true);
      }
      try {
        let res = await deleteCall(`${BASE_URL_RFK2}flows/${flowId2}`, header2);
        expect(res.status).toBe(200);
        expect(res.data).toContain("successfully deleted");
        res = await deleteCall(`${BASE_URL_RFK1}flows/${flowId}`, header1);
        expect(res.status).toBe(200);
        expect(res.data).toContain("successfully deleted");
        for (const Id of Object.values(inputIds3)) {
          //console.log(Id)
          res = await deleteCall(`${BASE_URL_RFK1}inputs/${Id}`, header1);
          expect(res.status).toBe(200);
          expect(res.data).toContain("successfully deleted");
        }
      } catch (err) {
        throw new Error(err);
      }
    }, 500000);
  });
}