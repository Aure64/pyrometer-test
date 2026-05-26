"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const loglevel_1 = require("loglevel");
const nconf_1 = __importDefault(require("nconf"));
const path = __importStar(require("path"));
const config_1 = require("./config");
(0, loglevel_1.setLevel)("SILENT");
const fixturePath = (name) => path.join(__dirname, "testFixtures/baker-groups", name);
describe("config: baker_group parsing", () => {
    const originalArgv = process.argv;
    afterEach(() => {
        process.argv = originalArgv;
        // reset nconf stores so the next test gets a clean instance
        nconf_1.default.remove("argv");
        nconf_1.default.remove("file");
        nconf_1.default.remove("defaults");
        nconf_1.default.remove("overrides");
    });
    it("parses [[baker_group]] into the Config", async () => {
        process.argv = [process.argv[0], process.argv[1], "--config", fixturePath("valid.toml")];
        const config = await (0, config_1.load)(undefined, false);
        expect(config.bakerGroups).toBeDefined();
        expect(config.bakerGroups.length).toEqual(2);
        expect(config.bakerGroups[0].name).toEqual("corporate");
        expect(config.bakerGroups[0].bakers).toEqual([
            "tz1gcna2xxZj2eNp1LaMyAhVJ49mEFj4FH26",
        ]);
        expect(config.bakerGroups[0].missed_threshold).toEqual(30);
        expect(config.bakerGroups[1].name).toEqual("whales");
        expect(config.bakerGroups[1].stake_min).toEqual(1000000000000);
        expect(config.bakerGroups[1].missed_threshold).toEqual(75);
    });
});
