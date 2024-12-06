const config = require("./conv.js");
const ip1 = config.BASE_URL_RFK2.split("//")[1];
const ip2 = config.BASE_URL_RFK1.split("//")[1];
const out_ip1 = "239.121.166.89";
const out_ip2 = "239.121.166.99";

// First UDP Input for Main RFK
const payload_udp_in = {
  inputId: "TEST-UDP-IN_1",
  inputAliasName: "TEST-UDP-IN_1",
  InputMode: "UDP",
  tsMonitorControl: true,
  config: {
    udp: {
      ipConfig: {
        ipAddress: config.multicast,
        port: 1234,
        interface: "eth0",
      },
      igmpConfig: {
        IgmpV3Mode: "EXCLUDE",
        igmpV3Src: [
          { ipAddress: "0.0.0.0", index: 1 },
          { ipAddress: "0.0.0.0", index: 2 },
          { ipAddress: "0.0.0.0", index: 3 },
          { ipAddress: "0.0.0.0", index: 4 },
          { ipAddress: "0.0.0.0", index: 5 },
          { ipAddress: "0.0.0.0", index: 6 },
        ],
      },
      smpte20227Mode: {
        MultiPathPacketMergeControl: "DISABLED",
        pathDifferential: 10,
        ipConfig: {
          ipAddress: "239.0.0.0",
          port: 1234,
          interface: "eth4",
        },
        igmpConfig: {
          IgmpV3Mode: "EXCLUDE",
          igmpV3Src: [
            { ipAddress: "0.0.0.0", index: 1 },
            { ipAddress: "0.0.0.0", index: 2 },
            { ipAddress: "0.0.0.0", index: 3 },
            { ipAddress: "0.0.0.0", index: 4 },
            { ipAddress: "0.0.0.0", index: 5 },
            { ipAddress: "0.0.0.0", index: 6 },
          ],
        },
        lossOfInputTimeout: 2,
      },
    },
  },
};

//SRT INPUT
const payload_srt_in = {
  inputId: "TEST-SRT-IN_1",
  inputAliasName: "TEST-SRT-IN_1",
  InputMode: "SRT",
  tsMonitorControl: true,
  config: {
    srt: {
      srtConfig: {
        Mode: "LISTENER",
        ipAddress: "172.16.0.0",
        port: 16066,
        interface: "eth2",
        latency: 100,
        sourcePortMode: false,
        streamId: "",
        encryptionControl: false,
      },
    },
  },
};
const payload_rist_in = {
  inputId: "TEST-RIST-SIMPLE-IN_1",
  inputAliasName: "TEST-RIST-SIMPLE-IN_1",
  InputMode: "RIST",
  tsMonitorControl: true,
  config: {
    rist: {
      ristConfig: {
        Profile: "SIMPLE",
        Mode: "SERVER",
        port: 17066,
        interface: "eth2",
        latency: 100,
        sessionTimeout: 100,
        streamId: 0,
        encryptionControl: false,
        dtlsControl: false,
      },
    },
  },
};
const payload_flow = {
  flowId: "TEST-FLOW_1",
  flowAliasName: "TEST-FLOW_1",
  inputs: [],
  processingUnits: [],
};
const payload_udp_out = {
  outputId: "TEST-UDP-OUT_1",
  outputAliasName: "TEST-UDP-OUT_1",
  OutputMode: "UDP",
  inputs: [],
  processingUnits: [],
  flowId: "",
  tsMonitorControl: true,
  config: {
    udp: {
      ipConfig: {
        ipAddress: out_ip1,
        port: 1234,
        interface: "eth0",
      },
      encapsulationConfig: {
        EncapsulationType: "UDP",
        outputTtl: 64,
        typeOfService: 0,
        qualityOfService: 0,
      },
      smpte20227Mode: {
        multiPathPacketMergeControl: false,
        ipConfig: {
          ipAddress: "239.0.0.0",
          port: 1234,
          interface: "eth4",
        },
      },
      maxOutputBitrate: 60000,
    },
  },
};

const payload_srt_out = {
  outputId: "TEST-SRT-OUT_1",
  outputAliasName: "TEST-SRT-OUT_1",
  OutputMode: "SRT",
  inputs: [],
  processingUnits: [],
  flowId: "",
  tsMonitorControl: true,
  config: {
    srt: {
      srtConfig: {
        Mode: "CALLER",
        ipAddress: ip1.split(":")[0],
        port: 16066,
        interface: "eth2",
        latency: 100,
        sourcePortMode: false,
        streamId: "",
        encryptionControl: false,
        outputTtl: 100,
      },
      maxOutputBitrate: 60000,
    },
  },
};
const payload_rist_out = {
  outputId: "TEST-RIST-SIMPLE-OUT_1",
  outputAliasName: "TEST-RIST-SIMPLE-OUT_1",
  OutputMode: "RIST",
  inputs: [],
  processingUnits: [],
  flowId: "",
  tsMonitorControl: true,
  config: {
    rist: {
      ristConfig: {
        Profile: "SIMPLE",
        Mode: "CLIENT",
        ipAddress: ip1.split(":")[0],
        port: 17066,
        interface: "eth2",
        latency: 100,
        sessionTimeout: 100,
        streamId: 0,
        nullPacketDeletion: false,
        encryptionControl: false,
        PreSharedKeyType: "AES128",
        preSharedKey: "DISABLE",
        dtlsControl: false,
        dtlsPeerVerify: false,
      },
      maxOutputBitrate: 60000,
    },
  },
};

module.exports = {
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
};
