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
//see https://github.com/yagop/node-telegram-bot-api/issues/319
process.env["NTBA_FIX_319"] = "1";
const FS = __importStar(require("fs"));
const readline = __importStar(require("readline"));
const yargs_1 = __importDefault(require("yargs"));
const TOML = __importStar(require("@iarna/toml"));
const Config = __importStar(require("./config"));
const run_1 = __importDefault(require("./run"));
/**
 * Calls makeConfigFile and writes the result to the specified path.
 */
const writeSampleConfig = (path) => {
    const sampleConfig = Config.makeSampleConfig();
    const serialized = TOML.stringify(sampleConfig);
    if (path) {
        FS.writeFileSync(path, serialized);
    }
    else {
        console.log(serialized);
    }
};
const clearData = (dataDirectory) => {
    if (FS.existsSync(dataDirectory)) {
        FS.rmSync(dataDirectory, { recursive: true });
        console.log(`Data directory deleted: ${dataDirectory}`);
    }
    else {
        console.log("Data directory does not exist");
    }
};
const main = async () => {
    (0, yargs_1.default)(process.argv.slice(2))
        .strict()
        .command("config", "Commands to view and manage configuration", (yargs) => {
        return yargs
            .command("show", "Show effective config derived from command line and config file", async (yargs) => {
            return yargs.options(Config.yargRunOptions);
        }, async () => {
            const config = await Config.load();
            const serialized = TOML.stringify(config.asObject());
            console.log(serialized);
        })
            .command("sample [path]", "Print sample config or write it to a file", (yargs) => {
            return yargs.positional("path", { type: "string" });
        }, (args) => {
            writeSampleConfig(args.path);
        })
            .demandCommand();
    })
        .command("reset", "Clear state data, including notifications queues and block history.", async (yargs) => {
        return yargs.options(Config.yargResetOptions).option("force", {
            alias: "f",
            type: "boolean",
            description: "Don't prompt for confirmation, just clear state",
        });
    }, async (args) => {
        const config = await Config.load(Config.yargResetOptions, false);
        if (args.force) {
            clearData(config.storageDirectory);
        }
        else {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });
            rl.question(`Delete ${config.storageDirectory}?\nEnter y to confirm, anything else to exit: `, (answer) => {
                rl.close();
                if (answer === "y") {
                    clearData(config.storageDirectory);
                }
            });
        }
    })
        .command("run", "Starts event monitoring.", async (yargs) => {
        return yargs.options(Config.yargRunOptions);
    }, async () => {
        const config = await Config.load();
        await (0, run_1.default)(config);
    })
        .demandCommand().argv;
};
main();
