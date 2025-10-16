"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkBlockAccusationsForDoubleBake = exports.checkBlockAccusationsForDoubleEndorsement = exports.checkBlockEndorsingRights = exports.checkBlockBakingRights = exports.loadBlockRights = void 0;
const loglevel_1 = require("loglevel");
const events_1 = require("./events");
const now_1 = __importDefault(require("./now"));
const types_1 = require("./rpc/types");
const name = "bm-proto-h";
/**
 * Analyze block data for baking and endorsing related events.
 */
exports.default = async ({ bakers, block, rpc, }) => {
    const metadata = block.metadata;
    const blockLevel = metadata.level_info.level;
    const blockCycle = metadata.level_info.cycle;
    const blockId = `${blockLevel}`;
    const { header } = block;
    const priority = header.priority;
    const blockTimestamp = new Date(header.timestamp);
    const [bakingRights, endorsingRights] = (await rpc.getRights(blockLevel, priority));
    const events = [];
    const createEvent = (baker, kind, level = blockLevel, slotCount) => {
        const event = {
            baker,
            kind,
            createdAt: (0, now_1.default)(),
            level,
            cycle: blockCycle,
            timestamp: blockTimestamp,
        };
        if (kind === events_1.Events.Baked)
            event.priority = priority;
        if (kind === events_1.Events.Endorsed || kind === events_1.Events.MissedEndorsement)
            event.slotCount = slotCount;
        return event;
    };
    for (const baker of bakers) {
        const endorsementOperations = block.operations[0];
        const anonymousOperations = block.operations[2];
        const bakingEvent = (0, exports.checkBlockBakingRights)({
            baker,
            bakingRights,
            blockBaker: metadata.baker,
            blockId,
            blockPriority: priority,
        });
        if (bakingEvent) {
            events.push(createEvent(baker, bakingEvent));
        }
        const endorsingEvent = (0, exports.checkBlockEndorsingRights)({
            baker,
            level: blockLevel - 1,
            endorsementOperations,
            endorsingRights,
        });
        if (endorsingEvent) {
            const [kind, slotCount] = endorsingEvent;
            events.push(createEvent(baker, kind, blockLevel - 1, slotCount));
        }
        const doubleBakeEvent = await (0, exports.checkBlockAccusationsForDoubleBake)({
            baker,
            operations: anonymousOperations,
            rpc,
        });
        if (doubleBakeEvent) {
            events.push(createEvent(baker, events_1.Events.DoubleBaked));
        }
        const doubleEndorseEvent = await (0, exports.checkBlockAccusationsForDoubleEndorsement)({
            baker,
            operations: anonymousOperations,
            rpc,
        });
        if (doubleEndorseEvent) {
            events.push(createEvent(baker, events_1.Events.DoubleEndorsed));
        }
    }
    return events;
};
const loadBlockRights = async (blockId, level, priority, rpc) => {
    const bakingRightsPromise = rpc.getBakingRights(blockId, level, priority);
    const endorsingRightsPromise = rpc.getEndorsingRights(blockId, level - 1);
    const [bakingRights, endorsingRights] = await Promise.all([
        bakingRightsPromise,
        endorsingRightsPromise,
    ]);
    return {
        bakingRights: bakingRights,
        endorsingRights: endorsingRights,
    };
};
exports.loadBlockRights = loadBlockRights;
/**
 * Check the baking rights for a block to see if the provided baker had a successful or missed bake.
 */
const checkBlockBakingRights = ({ baker, blockBaker, bakingRights, blockId, blockPriority, }) => {
    const log = (0, loglevel_1.getLogger)(name);
    //baher's scheduled right
    const bakerRight = bakingRights.find((bakingRight) => {
        return bakingRight.delegate == baker;
    });
    if (!bakerRight) {
        //baker had no baking rights at this level
        log.debug(`No baking slot at block ${blockId} for ${baker}`);
        return null;
    }
    //actual baking right at block's priority
    const blockRight = bakingRights.find((bakingRight) => {
        return bakingRight.priority == blockPriority;
    });
    if (!blockRight) {
        log.error(`No rights found block ${blockId} at priority ${blockPriority}`, bakingRights);
        return null;
    }
    if (bakerRight.priority < blockRight.priority) {
        log.info(`${baker} had baking slot for priority ${bakerRight.priority}, but missed it (block baked at priority ${blockPriority})`);
        return events_1.Events.MissedBake;
    }
    if (blockRight.delegate === baker &&
        blockRight.priority === bakerRight.priority &&
        blockBaker === baker) {
        log.info(`${baker} baked block ${blockId} at priority ${blockPriority} of level ${blockRight.level}`);
        return events_1.Events.Baked;
    }
    return null;
};
exports.checkBlockBakingRights = checkBlockBakingRights;
/**
 * Check the endorsing rights for a block to see if the provided endorser had a successful or missed endorse.
 */
const checkBlockEndorsingRights = ({ baker, endorsementOperations, level, endorsingRights, }) => {
    const log = (0, loglevel_1.getLogger)(name);
    const endorsingRight = endorsingRights.find((right) => right.level === level && right.delegate === baker);
    if (endorsingRight) {
        const slotCount = endorsingRight.slots.length;
        log.debug(`found ${slotCount} endorsement slots for baker ${baker} at level ${level}`);
        const didEndorse = endorsementOperations.find((op) => isEndorsementByDelegate(op, baker)) !==
            undefined;
        if (didEndorse) {
            log.debug(`Successful endorse for baker ${baker}`);
            return [events_1.Events.Endorsed, endorsingRight.slots.length];
        }
        else {
            log.debug(`Missed endorse for baker ${baker} at level ${level}`);
            return [events_1.Events.MissedEndorsement, endorsingRight.slots.length];
        }
    }
    log.debug(`No endorse event for baker ${baker}`);
    return null;
};
exports.checkBlockEndorsingRights = checkBlockEndorsingRights;
const isEndorsementByDelegate = (operation, delegate) => {
    for (const contentsItem of operation.contents) {
        if (contentsItem.kind === types_1.OpKind.ENDORSEMENT_WITH_SLOT &&
            "metadata" in contentsItem) {
            if (contentsItem.metadata.delegate === delegate) {
                return true;
            }
        }
    }
    return false;
};
const checkBlockAccusationsForDoubleEndorsement = async ({ baker, operations, rpc, }) => {
    const log = (0, loglevel_1.getLogger)(name);
    for (const operation of operations) {
        for (const contentsItem of operation.contents) {
            if (contentsItem.kind === types_1.OpKind.DOUBLE_ENDORSEMENT_EVIDENCE) {
                const accusedLevel = contentsItem.op1.operations.level;
                const accusedSignature = contentsItem.op1.signature;
                try {
                    const block = (await rpc.getBlock(`${accusedLevel}`));
                    const endorsementOperations = block.operations[0];
                    const operation = endorsementOperations.find((operation) => {
                        for (const c of operation.contents) {
                            if (c.kind === types_1.OpKind.ENDORSEMENT_WITH_SLOT) {
                                if (c.endorsement.signature === accusedSignature) {
                                    return true;
                                }
                            }
                        }
                    });
                    const endorser = operation && findEndorserForOperation(operation);
                    if (endorser) {
                        if (endorser === baker) {
                            log.info(`Double endorsement for baker ${baker} at block ${block.hash}`);
                            return true;
                        }
                    }
                    else {
                        log.warn(`Unable to find endorser for double endorsed block ${block.hash}`);
                    }
                }
                catch (err) {
                    log.warn(`Error fetching block info to determine double endorsement violator because of `, err);
                }
            }
        }
    }
    return false;
};
exports.checkBlockAccusationsForDoubleEndorsement = checkBlockAccusationsForDoubleEndorsement;
/**
 * Searches through the contents of an operation to find the delegate who performed the endorsement.
 */
const findEndorserForOperation = (operation) => {
    for (const contentsItem of operation.contents) {
        if (contentsItem.kind === types_1.OpKind.ENDORSEMENT_WITH_SLOT &&
            "metadata" in contentsItem)
            return contentsItem.metadata.delegate;
    }
    return null;
};
const checkBlockAccusationsForDoubleBake = async ({ baker, operations, rpc, }) => {
    const log = (0, loglevel_1.getLogger)(name);
    for (const operation of operations) {
        for (const contentsItem of operation.contents) {
            if (contentsItem.kind === types_1.OpKind.DOUBLE_BAKING_EVIDENCE) {
                const accusedHash = operation.hash;
                const accusedLevel = contentsItem.bh1.level;
                const accusedPriority = contentsItem.bh1.priority;
                try {
                    const bakingRights = await rpc.getBakingRights(`${accusedLevel}`, accusedLevel, undefined, baker);
                    const hadBakingRights = bakingRights.find((right) => right.priority === accusedPriority && right.delegate === baker) !== undefined;
                    if (hadBakingRights) {
                        log.info(`Double bake for baker ${baker} at level ${accusedLevel} with hash ${accusedHash}`);
                        return true;
                    }
                }
                catch (err) {
                    log.warn(`Error fetching baking rights to determine double bake violator because of `, err);
                }
            }
        }
    }
    return false;
};
exports.checkBlockAccusationsForDoubleBake = checkBlockAccusationsForDoubleBake;
