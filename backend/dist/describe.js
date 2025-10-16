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
/* eslint-disable @typescript-eslint/no-explicit-any */
const json_schema_to_typescript_1 = require("json-schema-to-typescript");
const FS = __importStar(require("fs"));
const yargs_1 = __importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
const util_1 = require("./rpc/util");
const urls = __importStar(require("./rpc/urls"));
const defPrefix = "#/definitions/";
const stripDefPrefix = (s) => {
    return s.substr(defPrefix.length);
};
const ensureIdentifier = (k) => {
    if (Number.isInteger(parseInt(k[0]))) {
        k = "_" + k;
    }
    return k.replaceAll(".", "$").replaceAll("-", "_").replaceAll(" ", "_");
};
const ensureIdentifierInRef = (value) => {
    if (value.startsWith(defPrefix)) {
        return defPrefix + ensureIdentifier(stripDefPrefix(value));
    }
    return value;
};
function preprocessSchema(inputSchema) {
    switch (inputSchema.type) {
        case "object": {
            const outputSchema = {};
            Object.entries(inputSchema).forEach(([name, value]) => {
                outputSchema[ensureIdentifier(name)] = value;
            });
            return {
                ...outputSchema,
                properties: preprocessProperties(inputSchema.properties),
                definitions: preprocessProperties(inputSchema.definitions),
            };
        }
        case "array":
            return {
                ...inputSchema,
                definitions: preprocessProperties(inputSchema.definitions),
                items: preprocessSchema(inputSchema.items),
            };
        default:
            if (Array.isArray(inputSchema)) {
                return inputSchema.map(preprocessSchema);
            }
            if (inputSchema.$ref) {
                // Workaround for: https://github.com/bcherny/json-schema-to-typescript/issues/193
                const out = {
                    $ref: ensureIdentifierInRef(inputSchema.$ref),
                };
                if (inputSchema.definitions)
                    out.definitions = preprocessProperties(inputSchema.definitions);
                return out;
            }
            if (inputSchema.allOf) {
                return {
                    allOf: inputSchema.allOf.map(preprocessSchema),
                    properties: preprocessProperties(inputSchema.properties),
                    definitions: preprocessProperties(inputSchema.definitions),
                };
            }
            if (inputSchema.oneOf) {
                return {
                    oneOf: inputSchema.oneOf.map(preprocessSchema),
                    properties: preprocessProperties(inputSchema.properties),
                    definitions: preprocessProperties(inputSchema.definitions),
                };
            }
            if (inputSchema.anyOf) {
                return {
                    anyOf: inputSchema.anyOf.map(preprocessSchema),
                    properties: preprocessProperties(inputSchema.properties),
                    definitions: preprocessProperties(inputSchema.definitions),
                };
            }
            return inputSchema;
    }
}
function preprocessProperties(inputProperties) {
    if (inputProperties) {
        const outputProperties = {};
        Object.entries(inputProperties).forEach(([name, value]) => {
            outputProperties[ensureIdentifier(name)] = preprocessSchema(value);
        });
        return outputProperties;
    }
    return undefined;
}
const main = async () => {
    const argv = await (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
        .usage("$0 <url>", 
    // @ts-ignore TS complains but this is correct
    "generate types from Tezos RPC descriptions", (yargs) => {
        yargs.positional("url", {
            describe: "URL for Tezos Node RPC",
            type: "string",
        });
    })
        .strict()
        .parse();
    const node = argv.url;
    const blockHeader = (await (0, util_1.get)(`${node}/${urls.E_BLOCK_HEADER("head")}`));
    const shortProtoHash = blockHeader.protocol.substr(0, 12);
    const outDirSchemasBase = `tezos-rpc-schemas`;
    const outDirSchemasProto = `${outDirSchemasBase}/${shortProtoHash}`;
    const outDirBase = `src/rpc/types/gen`;
    const outDirProto = `${outDirBase}/${shortProtoHash}`;
    FS.mkdirSync(outDirSchemasProto, { recursive: true });
    FS.mkdirSync(outDirProto, { recursive: true });
    const sampleAddress = "tz3RDC3Jdn4j15J7bBHZd29EUee9gVB1CxD9";
    const typeNames = {
        [urls.E_IS_BOOTSTRAPPED]: { name: "BootstrappedStatus", protocol: false },
        [urls.E_NETWORK_CONNECTIONS]: {
            name: "NetworkConnection",
            protocol: false,
        },
        [urls.E_TEZOS_VERSION]: { name: "TezosVersion", protocol: false },
        [urls.E_CONSTANTS("head")]: { name: "Constants", protocol: true },
        [urls.E_BAKING_RIGHTS("head")]: { name: "BakingRights", protocol: true },
        [urls.E_ENDORSING_RIGHTS("head")]: {
            name: "EndorsingRights",
            protocol: true,
        },
        [urls.E_BLOCK("head")]: {
            name: "Block",
            protocol: true,
        },
        [urls.E_BLOCK_HEADER("head")]: {
            name: "BlockHeader",
            protocol: true,
        },
        [urls.E_DELEGATES_PKH("head", sampleAddress)]: {
            name: "Delegate",
            protocol: true,
        },
        [`${urls.E_DELEGATES_PKH("head", sampleAddress)}/consensus_key`]: {
            name: "ConsensusKey",
            protocol: true,
        },
        [urls.E_DELEGATE_PARTICIPATION("head", sampleAddress)]: {
            name: "Participation",
            protocol: true,
        },
    };
    for (const [url, { name, protocol }] of Object.entries(typeNames)) {
        console.log("=======", name);
        const outDir = protocol ? outDirProto : outDirBase;
        const outDirSchemas = protocol ? outDirSchemasProto : outDirSchemasBase;
        const schemaFileName = `${outDirSchemas}/${name}.json`;
        try {
            if (!FS.existsSync(schemaFileName)) {
                console.log(`Downloading schema to ${schemaFileName}`);
                const desc = (await (0, util_1.get)(`${node}/describe/${url}`));
                let schema = desc["static"].get_service.output.json_schema;
                schema.definitions = {
                    ...schema.definitions,
                    unistring: { type: "string" },
                };
                if (schema.$ref) {
                    const defName = stripDefPrefix(schema.$ref);
                    const definition = schema.definitions[defName];
                    delete schema.definitions[defName];
                    delete schema.$ref;
                    schema = { ...definition, ...schema };
                }
                const processedSchema = preprocessSchema(schema);
                FS.writeFileSync(`${outDirSchemas}/${name}.json`, JSON.stringify(processedSchema, null, 2), "utf8");
            }
            else {
                console.log(`Reading schema from ${schemaFileName}`);
            }
            const schema = JSON.parse(FS.readFileSync(schemaFileName, "utf8"));
            const ts = await (0, json_schema_to_typescript_1.compile)(schema, name);
            const tsFileName = `${outDir}/${name}.ts`;
            FS.writeFileSync(tsFileName, ts);
            console.log(`Wrote ${tsFileName}`);
        }
        catch (x) {
            console.error(x);
        }
    }
};
main();
