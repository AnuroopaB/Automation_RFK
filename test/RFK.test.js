const {
  initialize,
  headers,
  postCall,
  sourceUp,
  statusCheck,
  getId,
  deleteCall,
} = require("../dem.js");
const jwt = require("jsonwebtoken");
const {
  payload_udp_in,
  payload_srt_in,
  payload_rist_in,
  payload_flow,
  payload_udp_out,
  payload_srt_out,
  payload_rist_out,
  out_ip1,
  ip2,
  out_ip2,
} = require("../payloads.js");
const config = require("../conv.js");
const BASE_URL_RFK1 = config.BASE_URL_RFK1 + "/api/v1/";
const BASE_URL_RFK2 = config.BASE_URL_RFK2 + "/api/v1/";
const ipRegex = /http:\/\/([\d.]+):/;
const RFK_1_IP = BASE_URL_RFK1.match(ipRegex)[1];
const RFK_2_IP = BASE_URL_RFK2.match(ipRegex)[1];
console.log(RFK_1_IP, RFK_2_IP);
// const RFK_2_IP = config.RFK_2_IP;
const timeout = config.Timeout;
const IN_EP = BASE_URL_RFK1 + "inputs";
const OUT_EP = BASE_URL_RFK1 + "outputs";
const inputIds = {};
const outputIds = {};
let flowId = "";
const IN_EP2 = BASE_URL_RFK2 + "inputs";
const OUT_EP2 = BASE_URL_RFK2 + "outputs";
const inputIds2 = {};
const outputIds2 = {};
let flowId2 = "";
const payloads_in2 = [
  { name: "UDP", payload: JSON.parse(JSON.stringify(payload_udp_in)) },
  { name: "RTP", payload: JSON.parse(JSON.stringify(payload_udp_in)) },
  { name: "SRT", payload: JSON.parse(JSON.stringify(payload_srt_in)) },
  { name: "RIST SIMPLE", payload: JSON.parse(JSON.stringify(payload_rist_in)) },
  { name: "RIST MAIN", payload: JSON.parse(JSON.stringify(payload_rist_in)) },
];
const payloads_out2 = [
  { name: "UDP", payload: payload_udp_out },
  { name: "RTP", payload: payload_udp_out },
  { name: "SRT", payload: payload_srt_out },
  { name: "RIST SIMPLE", payload: payload_rist_out },
  { name: "RIST MAIN", payload: payload_rist_out },
];
const payloads_in = { name: "UDP", payload: payload_udp_in };
const payloads_out = [
  { name: "UDP", payload: JSON.parse(JSON.stringify(payload_udp_out)) },
  { name: "RTP", payload: JSON.parse(JSON.stringify(payload_udp_out)) },
  { name: "SRT", payload: JSON.parse(JSON.stringify(payload_srt_out)) },
  {
    name: "RIST SIMPLE",
    payload: JSON.parse(JSON.stringify(payload_rist_out)),
  },
  { name: "RIST MAIN", payload: JSON.parse(JSON.stringify(payload_rist_out)) },
];
const inputIds3 = {};
const payloads_in3 = [
  { name: "UDP", payload: payload_udp_in },
  { name: "RTP", payload: payload_udp_in },
  { name: "SRT", payload: payload_srt_in },
  { name: "RIST SIMPLE", payload: payload_rist_in },
  { name: "RIST MAIN", payload: payload_rist_in },
];
const URLs = [`${BASE_URL_RFK1}login`, `${BASE_URL_RFK2}login`];
const RFKs = [RFK_1_IP, RFK_2_IP];
let allTestsPassed = true;
let urlToHeaderMap = {};
beforeAll(async () => {
  urlToHeaderMap = await initialize(RFKs);
});
const xlsx = require("xlsx");
const testResults = [];
describe("Source creation in Main RFK", () => {
  it(
    `Create UDP source in Main RFK`,
    async () => {
      const startTime = Date.now();
      const testName = `Create UDP source in Main RFK`;
      try {
        let payload = payloads_in.payload;
        const availableInputId = await getId(
          payload.inputId,
          IN_EP,
          0,
          urlToHeaderMap[RFK_1_IP]
        );
        if (availableInputId !== payload.inputId) {
          payload.inputId = availableInputId;
          payload.inputAliasName = availableInputId;
        }
        const res = await postCall(IN_EP, payload);
        const endTime = Date.now();

        // Log successful test result
        testResults.push({
          testName,
          status: "PASS",
          executionTime: `${endTime - startTime} ms`,
        });

        expect(res.status).toBe(201);
        expect(res.statusText).toContain("Created");
        inputIds["UDP"] = payload.inputId;
      } catch (err) {
        const endTime = Date.now();

        // Log failed test result
        testResults.push({
          testName,
          status: "Fail",
          executionTime: `${endTime - startTime} ms`,
        });

        allTestsPassed = false;
        throw new Error(err);
      }
    },
    timeout
  );
});

describe("Start Sources in Main RFK", () => {
  it(
    `Start UDP source`,
    async () => {
      const startTime = Date.now();
      const testName = "Start Sources in Main RFK";
      try {
        const inputId = inputIds["UDP"];
        if (!inputId) {
          throw new Error(`Input ID for UDP not found`);
        }
        let res = await sourceUp(
          `${IN_EP}/${inputId}/enable`,
          urlToHeaderMap[RFK_1_IP]
        );
        expect(res.status).toBe(200);

        res = await sourceUp(
          `${IN_EP}/${inputId}/start`,
          urlToHeaderMap[RFK_1_IP]
        );
        expect(res.status).toBe(200);

        testResults.push({
          testName,
          status: "PASS",
          executionTime: `${Date.now() - startTime}ms`,
        });
      } catch (err) {
        testResults.push({
          testName,
          status: "FAILED",
          executionTime: `${Date.now() - startTime}ms`,
        });

        allTestsPassed = false;
        throw new Error(err);
      }
    },
    timeout
  );
});

describe("Create Flow in Main RFK", () => {
  it(
    "Create flow",
    async () => {
      const startTime = Date.now();
      const testName = "Create, enable and start Flow in Main RFK";
      try {
        const URL_flow = BASE_URL_RFK1 + "flows";
        const flowPayload = {
          ...payload_flow,
          inputs: Object.values(inputIds),
        };
        const availableFlowId = await getId(
          flowPayload.flowId,
          URL_flow,
          1,
          urlToHeaderMap[RFK_1_IP]
        );
        if (availableFlowId !== flowPayload.flowId) {
          flowPayload.flowId = availableFlowId;
          flowPayload.flowAliasName = availableFlowId;
        }
        flowId = availableFlowId;
        const res = await postCall(URL_flow, flowPayload);
        expect(res.status).toBe(201);
        expect(res.statusText).toContain("Created");
        await sourceUp(
          `${URL_flow}/${flowId}/enable`,
          urlToHeaderMap[RFK_1_IP]
        );
        await sourceUp(`${URL_flow}/${flowId}/start`, urlToHeaderMap[RFK_1_IP]);

        testResults.push({
          testName,
          status: "PASS",
          executionTime: `${Date.now() - startTime}ms`,
        });
      } catch (err) {
        testResults.push({
          testName,
          status: "FAILED",
          executionTime: `${Date.now() - startTime}ms`,
        });
        allTestsPassed = false;
        throw new Error(err);
      }
    },
    timeout
  );
});
describe("Destination creation in Main RFK", () => {
  payloads_out.forEach(({ name, payload }) => {
    it(
      `Create ${name} destination`,
      async () => {
        const startTime = Date.now();
        const testName = "Destination creation in Main RFK";
        try {
          if (name == "RIST MAIN") {
            payload.outputId = "TEST-RIST-MAIN-OUT_1";
            payload.outputAliasName = "TEST-RIST-MAIN-OUT_1";
            payload.config.rist.ristConfig.Profile = "MAIN";
            payload.config.rist.ristConfig.port += 2;
            //payload.config.rist.ristConfig.Mode = "SERVER";
          }
          payload.inputs = [inputIds["UDP"]];
          payload.flowId = flowId;
          if (name == "RTP") {
            payload.outputId = "TEST-RTP-OUT_1";
            payload.outputAliasName = "TEST-RTP-OUT_1";
            payload.config.udp.encapsulationConfig.EncapsulationType = "RTP";
          }
          const availableoutputId = await getId(
            payload.outputId,
            OUT_EP,
            2,
            urlToHeaderMap[RFK_1_IP]
          );
          if (availableoutputId !== payload.outputId) {
            payload.outputId = availableoutputId;
            payload.outputAliasName = availableoutputId;
          }
          const res = await postCall(OUT_EP, payload);
          expect(res.status).toBe(201);
          expect(res.statusText).toContain("Created");
          outputIds[name] = payload.outputId;
          testResults.push({
            testName,
            status: "PASS",
            executionTime: `${Date.now() - startTime}ms`,
          });
          console.log(outputIds);
        } catch (err) {
          testResults.push({
            testName,
            status: "FAILED",
            executionTime: `${Date.now() - startTime}ms`,
          });
          allTestsPassed = false;
          console.error(
            "Error in destination creation in main rfk: " +
              err.response.data.error
          );
          throw new Error(err);
        }
      },
      timeout
    );
  });
});
describe("Start Main RFK Destinations", () => {
  payloads_out.forEach(({ name }) => {
    it(
      `Start ${name} source`,
      async () => {
        const startTime = Date.now();
        const testName = "Start Main RFK Destinations";
        try {
          const outputId = outputIds[name];
          if (!outputId) {
            throw new Error(`output ID for ${name} not found`);
          }
          let res = await sourceUp(
            `${OUT_EP}/${outputId}/enable`,
            urlToHeaderMap[RFK_1_IP]
          );
          expect(res.status).toBe(200);
          res = await sourceUp(
            `${OUT_EP}/${outputId}/start`,
            urlToHeaderMap[RFK_1_IP]
          );
          expect(res.status).toBe(200);
          testResults.push({
            testName,
            status: "PASS",
            executionTime: `${Date.now() - startTime}ms`,
          });
        } catch (err) {
          testResults.push({
            testName,
            status: "FAILED",
            executionTime: `${Date.now() - startTime}ms`,
          });
          allTestsPassed = false;
          throw new Error(err);
        }
      },
      timeout
    );
  });
});

describe("Source creation in Test RFK", () => {
  payloads_in2.forEach(({ name, payload }) => {
    it(
      `Create ${name} source`,
      async () => {
        const startTime = Date.now();
        const testName = "Source creation in Test RFK";
        try {
          if (name == "RIST MAIN") {
            payload.inputId = "TEST-RIST-MAIN-IN_1";
            payload.inputAliasName = "TEST-RIST-MAIN-IN_1";
            payload.config.rist.ristConfig.Profile = "MAIN";
            //payload.config.rist.ristConfig.Mode = "SERVER";
            payload.config.rist.ristConfig.port += 2;
          }
          if (name == "RTP" || name == "UDP") {
            payload.config.udp.ipConfig.ipAddress = out_ip1;
            if (name == "RTP") {
              payload.inputId = "TEST-RTP-IN_1";
              payload.inputAliasName = "TEST-RTP-IN_1";
            }
          }
          console.log(name);
          const availableInputId = await getId(
            payload.inputId,
            IN_EP2,
            0,
            urlToHeaderMap[RFK_2_IP]
          );
          if (availableInputId !== payload.inputId) {
            payload.inputId = availableInputId;
            payload.inputAliasName = availableInputId;
          }
          const res = await postCall(IN_EP2, payload);
          expect(res.status).toBe(201);
          expect(res.statusText).toContain("Created");
          inputIds2[name] = payload.inputId;
          testResults.push({
            testName,
            status: "PASS",
            executionTime: `${Date.now() - startTime}ms`,
          });
          //console.log(inputIds2);
        } catch (err) {
          testResults.push({
            testName,
            status: "FAILED",
            executionTime: `${Date.now() - startTime}ms`,
          });
          allTestsPassed = false;
          throw new Error(err);
        }
      },
      timeout
    );
  });
});
describe("Start Test RFK Sources", () => {
  payloads_in2.forEach(({ name }) => {
    it(
      `Start ${name} source`,
      async () => {
        const startTime = Date.now();
        const testName = "Start Test RFK Sources";
        try {
          const inputId = inputIds2[name];
          if (!inputId) {
            throw new Error(`Input ID for ${name} not found`);
          }
          let res = await sourceUp(
            `${IN_EP2}/${inputId}/enable`,
            urlToHeaderMap[RFK_2_IP]
          );
          expect(res.status).toBe(200);
          res = await sourceUp(
            `${IN_EP2}/${inputId}/start`,
            urlToHeaderMap[RFK_2_IP]
          );
          expect(res.status).toBe(200);
          testResults.push({
            testName,
            status: "PASS",
            executionTime: `${Date.now() - startTime}ms`,
          });
        } catch (err) {
          testResults.push({
            testName,
            status: "FAILED",
            executionTime: `${Date.now() - startTime}ms`,
          });
          allTestsPassed = false;
          throw new Error(err);
        }
      },
      timeout
    );
  });
});

describe("Create Flow in Test RFK", () => {
  it(
    "Create flow",
    async () => {
      const startTime = Date.now();
      const testName = "Create, enable and start Flow in Test RFK";
      try {
        const URL_flow = BASE_URL_RFK2 + "flows";
        const flowPayload = {
          ...payload_flow,
          inputs: Object.values(inputIds2),
        };
        const availableflowId2 = await getId(
          flowPayload.flowId,
          URL_flow,
          1,
          urlToHeaderMap[RFK_2_IP]
        );
        if (availableflowId2 !== flowPayload.flowId) {
          flowPayload.flowId = availableflowId2;
          flowPayload.flowAliasName = availableflowId2;
        }
        flowId2 = availableflowId2;
        const res = await postCall(URL_flow, flowPayload);
        expect(res.status).toBe(201);
        expect(res.statusText).toContain("Created");
        await sourceUp(
          `${URL_flow}/${flowId2}/enable`,
          urlToHeaderMap[RFK_2_IP]
        );
        await sourceUp(
          `${URL_flow}/${flowId2}/start`,
          urlToHeaderMap[RFK_2_IP]
        );
        testResults.push({
          testName,
          status: "PASS",
          executionTime: `${Date.now() - startTime}ms`,
        });
      } catch (err) {
        testResults.push({
          testName,
          status: "FAILED",
          executionTime: `${Date.now() - startTime}ms`,
        });
        allTestsPassed = false;
        throw new Error(err);
      }
    },
    timeout
  );
});
describe("Destination creation in Test RFK", () => {
  payloads_out2.forEach(({ name, payload }) => {
    it(
      `Create ${name} destination`,
      async () => {
        const startTime = Date.now();
        const testName = "Destination creatin in Test RFK";
        try {
          if (name == "SRT") {
            payload.config.srt.srtConfig.ipAddress = ip2.split(":")[0];
          }
          if (name.includes("RIST")) {
            payload.config.rist.ristConfig.ipAddress = ip2.split(":")[0];
            if (name == "RIST MAIN") {
              payload.outputId = "TEST-RIST-MAIN-OUT_1";
              payload.outputAliasName = "TEST-RIST-MAIN-OUT_1";
              payload.config.rist.ristConfig.Profile = "MAIN";
              //payload.config.rist.ristConfig.Mode = "SERVER";
              payload.config.rist.ristConfig.port += 2;
            }
          }

          payload.inputs = [inputIds2[name]];
          payload.flowId = flowId2;
          if (name == "RTP" || name == "UDP") {
            payload.config.udp.ipConfig.ipAddress = out_ip2;
            if (name == "RTP") {
              payload.outputId = "TEST-RTP-OUT_1";
              payload.outputAliasName = "TEST-RTP-OUT_1";
              payload.config.udp.encapsulationConfig.EncapsulationType = "RTP";
            }
          }
          const availableoutputId = await getId(
            payload.outputId,
            OUT_EP2,
            2,
            urlToHeaderMap[RFK_2_IP]
          );
          if (availableoutputId !== payload.outputId) {
            payload.outputId = availableoutputId;
            payload.outputAliasName = availableoutputId;
          }
          console.log(479);
          const res = await postCall(OUT_EP2, payload);
          console.log(481);
          expect(res.status).toBe(201);
          expect(res.statusText).toContain("Created");
          outputIds2[name] = payload.outputId;
          testResults.push({
            testName,
            status: "PASS",
            executionTime: `${Date.now() - startTime}ms`,
          });
          //console.log(outputIds2);
        } catch (err) {
          testResults.push({
            testName,
            status: "FAILED",
            executionTime: `${Date.now() - startTime}ms`,
          });
          allTestsPassed = false;
          throw new Error(err);
        }
      },
      timeout
    );
  });
});
describe("Start Test RFK Destinations", () => {
  payloads_out2.forEach(({ name }) => {
    it(
      `Start ${name} source`,
      async () => {
        const startTime = Date.now();
        const testName = "Start Test RFK Destinations";
        try {
          const outputId = outputIds2[name];
          if (!outputId) {
            throw new Error(`output ID for ${name} not found`);
          }
          let res = await sourceUp(
            `${OUT_EP2}/${outputId}/enable`,
            urlToHeaderMap[RFK_2_IP]
          );
          expect(res.status).toBe(200);
          res = await sourceUp(
            `${OUT_EP2}/${outputId}/start`,
            urlToHeaderMap[RFK_2_IP]
          );
          expect(res.status).toBe(200);
          testResults.push({
            testName,
            status: "PASS",
            executionTime: `${Date.now() - startTime}ms`,
          });
        } catch (err) {
          testResults.push({
            testName,
            status: "FAILED",
            executionTime: `${Date.now() - startTime}ms`,
          });
          allTestsPassed = false;
          throw new Error(err);
        }
      },
      timeout
    );
  });
});

describe("Source creation in Main RFK for loopback", () => {
  payloads_in3.forEach(({ name, payload }) => {
    it(
      `Create ${name} source`,
      async () => {
        const startTime = Date.now();
        const testName = `Source ${name} creation in Main RFK for loopback`;
        try {
          if (name == "RIST MAIN") {
            payload.inputId = "TEST-RIST-MAIN-IN_1";
            payload.inputAliasName = "TEST-RIST-MAIN-IN_1";
            payload.config.rist.ristConfig.Profile = "MAIN";
            //payload.config.rist.ristConfig.Mode = "SERVER";
            payload.config.rist.ristConfig.port += 2;
          }
          if (name == "RTP" || name == "UDP") {
            payload.config.udp.ipConfig.ipAddress = out_ip2;
            if (name == "RTP") {
              payload.inputId = "TEST-RTP-IN_1";
              payload.inputAliasName = "TEST-RTP-IN_1";
            }
          }
          const availableInputId = await getId(
            payload.inputId,
            IN_EP,
            0,
            urlToHeaderMap[RFK_1_IP]
          );
          if (availableInputId !== payload.inputId) {
            payload.inputId = availableInputId;
            payload.inputAliasName = availableInputId;
          }
          const res = await postCall(IN_EP, payload);
          expect(res.status).toBe(201);
          expect(res.statusText).toContain("Created");
          inputIds3[name] = payload.inputId;
          testResults.push({
            testName,
            status: "PASS",
            executionTime: `${Date.now() - startTime}ms`,
          });
          //console.log(inputIds3);
        } catch (err) {
          testResults.push({
            testName,
            status: "FAILED",
            executionTime: `${Date.now() - startTime}ms`,
          });
          allTestsPassed = false;
          throw new Error(err);
        }
      },
      timeout
    );
  });
});
describe("Start Sources", () => {
  payloads_in3.forEach(({ name }) => {
    it(
      `Start ${name} source`,
      async () => {
        const startTime = Date.now();
        const testName = `Start ${name} source in Main RFK for loopback`;
        try {
          const inputId = inputIds3[name];
          if (!inputId) {
            throw new Error(`Input ID for ${name} not found`);
          }
          let res = await sourceUp(
            `${IN_EP}/${inputId}/enable`,
            urlToHeaderMap[RFK_1_IP]
          );
          expect(res.status).toBe(200);
          res = await sourceUp(
            `${IN_EP}/${inputId}/start`,
            urlToHeaderMap[RFK_1_IP]
          );
          expect(res.status).toBe(200);
          testResults.push({
            testName,
            status: "PASS",
            executionTime: `${Date.now() - startTime}ms`,
          });
        } catch (err) {
          testResults.push({
            testName,
            status: "FAILED",
            executionTime: `${Date.now() - startTime}ms`,
          });
          allTestsPassed = false;
          throw new Error(err);
        }
      },
      timeout
    );
  });
});

describe("Verify Status of Main RFK Source", () => {
  it(
    `UDP`,
    async () => {
      const startTime = Date.now();
      const testName = `Verify Status of Main RFK Source`;
      try {
        const inputId = inputIds["UDP"];
        //const IDo = outputIds["UDP"];
        //Const URLo = `${IN_EP}/${inputId}/status`
        if (!inputId) {
          throw new Error(`Input ID for UDP not found`);
        }
        let stat = await statusCheck(`${IN_EP}/${inputId}/status`, inputId, 1);
        expect(stat).toBe(true);
        testResults.push({
          testName,
          status: "PASS",
          executionTime: `${Date.now() - startTime}ms`,
        });
      } catch (err) {
        testResults.push({
          testName,
          status: "FAILED",
          executionTime: `${Date.now() - startTime}ms`,
        });
        allTestsPassed = false;
        throw new Error(err);
      }
    },
    timeout
  );
});
describe("Verify Status of Main RFK Destinations", () => {
  payloads_out.forEach(({ name }) => {
    it(
      `${name}`,
      async () => {
        const startTime = Date.now();
        let testName = `Verify Status of Main RFK Destination: ${name}`; // Default testName with name

        try {
          const outputId = outputIds[name];
          if (!outputId) {
            throw new Error(`Output ID for ${name} not found`);
          }
          testName = `Verify Status of Main RFK Destination: ${outputId}`; // Update testName with outputId

          let stat = await statusCheck(
            `${OUT_EP}/${outputId}/status`,
            outputId,
            2
          );
          expect(stat).toBe(true);

          testResults.push({
            testName,
            status: "PASS",
            executionTime: `${Date.now() - startTime}ms`,
          });
        } catch (err) {
          testResults.push({
            testName,
            status: "FAILED",
            executionTime: `${Date.now() - startTime}ms`,
          });
          allTestsPassed = false;
          throw new Error(err);
        }
      },
      timeout
    );
  });
});

describe("Verify Status of Test RFK Destinations", () => {
  payloads_out2.forEach(({ name }) => {
    it(
      `${name}`,
      async () => {
        const startTime = Date.now();
        let testName = `Verify Status of Test RFK Destination: ${name}`; // Initialize with a default value

        try {
          const outputId = outputIds2[name];
          if (!outputId) {
            throw new Error(`Output ID for ${name} not found`);
          }
          testName = `Verify Status of Test RFK Destination: ${outputId}`; // Update once outputId is available

          let stat = await statusCheck(
            `${OUT_EP2}/${outputId}/status`,
            outputId,
            2
          );
          expect(stat).toBe(true);

          testResults.push({
            testName,
            status: "PASS",
            executionTime: `${Date.now() - startTime}ms`,
          });
        } catch (err) {
          testResults.push({
            testName,
            status: "FAILED",
            executionTime: `${Date.now() - startTime}ms`,
          });
          allTestsPassed = false;
          throw new Error(err);
        }
      },
      timeout
    );
  });
});

describe("Verify Status of Sources in loopback RFK", () => {
  payloads_in3.forEach(({ name }) => {
    it(
      `${name}`,
      async () => {
        const startTime = Date.now();
        const testName = `Verify Status of Source in loopback RFK: ${name}`;
        try {
          const inputId = inputIds3[name];
          if (!inputId) {
            throw new Error(`Input ID for ${name} not found`);
          }
          let stat = await statusCheck(
            `${IN_EP}/${inputId}/status`,
            inputId,
            1
          );
          expect(stat).toBe(true);
          testResults.push({
            testName,
            status: "PASS",
            executionTime: `${Date.now() - startTime}ms`,
          });
        } catch (err) {
          testResults.push({
            testName,
            status: "FAILED",
            executionTime: `${Date.now() - startTime}ms`,
          });
          allTestsPassed = false;
          throw new Error(err);
        }
      },
      timeout
    );
  });
});

if (config.Clear_All.toLowerCase() === "true") {
  describe("Clear All", () => {
    it(
      `Clearing all resources`,
      async () => {
        const startTime = Date.now();
        const testName = `Clearing all resources`;
        // if (!allTestsPassed) {
        //   console.log("Skipping resource cleanup because some tests failed.");
        //   expect(allTestsPassed).toBe(true);
        // }
        try {
          let res = await deleteCall(
            `${BASE_URL_RFK2}flows/${flowId2}`,
            urlToHeaderMap[RFK_2_IP]
          );
          expect(res.status).toBe(200);
          expect(res.data).toContain("successfully deleted");
          res = await deleteCall(
            `${BASE_URL_RFK1}flows/${flowId}`,
            urlToHeaderMap[RFK_1_IP]
          );
          expect(res.status).toBe(200);
          expect(res.data).toContain("successfully deleted");
          for (const Id of Object.values(inputIds3)) {
            //console.log(Id)
            res = await deleteCall(
              `${BASE_URL_RFK1}inputs/${Id}`,
              urlToHeaderMap[RFK_1_IP]
            );
            expect(res.status).toBe(200);
            expect(res.data).toContain("successfully deleted");
          }
          testResults.push({
            testName,
            status: "PASS",
            executionTime: `${Date.now() - startTime}ms`,
          });
        } catch (err) {
          testResults.push({
            testName,
            status: "FAILED",
            executionTime: `${Date.now() - startTime}ms`,
          });
          console.error(error.response.data.error);
          throw new Error(err);
        }
      },
      timeout
    );
  });
}

function exportResultsToExcel(testResults) {
  // Define worksheet data
  const worksheetData = [
    ["Test Name", "Status", "Execution Time"],
    ...testResults.map((result) => [
      result.testName,
      result.status,
      result.executionTime,
    ]),
  ];

  // Create a worksheet
  const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);

  // Create a workbook and add the worksheet
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "Test Results");

  // Write the workbook to a file
  xlsx.writeFile(workbook, "Test_Results.xlsx");
}

// Example: Export results after tests are done
afterAll(() => {
  exportResultsToExcel(testResults);
});
