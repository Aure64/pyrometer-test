"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkBlockAccusationsForDoubleBake = exports.checkBlockAccusationsForDoubleEndorsement = exports.checkBlockEndorsingRights = exports.checkBlockBakingRights = void 0;
const loglevel_1 = require("loglevel");
const events_1 = require("./events");
const now_1 = __importDefault(require("./now"));
const types_1 = require("./rpc/types");
const name = "bm-proto-l";
const EMPTY_LIST = Object.freeze([]);
/**
 * Analyze block data for baking and endorsing related events.
 */
exports.default = async ({ bakers, block, rpc, }) => {
    const metadata = block.metadata;
    const blockLevel = metadata.level_info.level;
    const blockCycle = metadata.level_info.cycle;
    const blockId = `${blockLevel}`;
    const { header } = block;
    const priority = header.payload_round;
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
            bakingRights: bakingRights,
            blockBaker: metadata.baker,
            blockProposer: metadata.proposer,
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
        const doubleBakeEvent = await (0, exports.checkBlockAccusationsForDoubleBake)(baker, anonymousOperations);
        if (doubleBakeEvent) {
            events.push(createEvent(baker, events_1.Events.DoubleBaked));
        }
        const doubleEndorseEvent = await (0, exports.checkBlockAccusationsForDoubleEndorsement)(baker, anonymousOperations);
        if (doubleEndorseEvent) {
            events.push(createEvent(baker, doubleEndorseEvent));
        }
    }
    return events;
};
/**
 * Check the baking rights for a block to see if the provided baker had a successful or missed bake.
 */
const checkBlockBakingRights = ({ baker, blockBaker, blockProposer, bakingRights, blockId, blockPriority, }) => {
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
    //actual baking right at block's round
    const blockRight = bakingRights.find((bakingRight) => {
        return bakingRight.round == blockPriority;
    });
    if (!blockRight) {
        log.error(`No rights found block ${blockId} at round ${blockPriority}`, bakingRights);
        return null;
    }
    if (blockProposer === baker && blockBaker !== baker) {
        log.info(`${baker} proposed block at level ${blockRight.level}, but didn't bake it`);
        return events_1.Events.MissedBonus;
    }
    if (bakerRight.round < blockRight.round) {
        log.info(`${baker} had baking slot for round ${bakerRight.round}, but missed it (block baked at round ${blockPriority})`);
        return events_1.Events.MissedBake;
    }
    if (blockRight.delegate === baker &&
        blockRight.round === bakerRight.round &&
        blockBaker === baker) {
        log.info(`${baker} baked block ${blockId} at round ${blockPriority} of level ${blockRight.level}`);
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
    const levelRights = endorsingRights.find((right) => right.level === level);
    if (!levelRights) {
        log.warn(`did not find rights for level ${level} in`, endorsingRights);
        return null;
    }
    const endorsingRight = levelRights.delegates.find((d) => d.delegate === baker);
    if (endorsingRight) {
        const slotCount = endorsingRight.endorsing_power;
        log.debug(`found ${slotCount} endorsement slots for baker ${baker} at level ${level}`);
        const didEndorse = endorsementOperations.find((op) => isEndorsementByDelegate(op, baker)) !==
            undefined;
        if (didEndorse) {
            log.debug(`Successful endorse for baker ${baker}`);
            return [events_1.Events.Endorsed, slotCount];
        }
        else {
            log.debug(`Missed endorse for baker ${baker} at level ${level}`);
            return [events_1.Events.MissedEndorsement, slotCount];
        }
    }
    log.debug(`No endorse event for baker ${baker}`);
    return null;
};
exports.checkBlockEndorsingRights = checkBlockEndorsingRights;
const isEndorsementByDelegate = (operation, delegate) => {
    for (const contentsItem of operation.contents) {
        if (contentsItem.kind === types_1.OpKind.ENDORSEMENT &&
            "metadata" in contentsItem) {
            if (contentsItem.metadata.delegate === delegate) {
                return true;
            }
        }
    }
    return false;
};
const checkBlockAccusationsForDoubleEndorsement = async (baker, operations) => {
    const log = (0, loglevel_1.getLogger)(name);
    for (const operation of operations) {
        for (const contentsItem of operation.contents) {
            if (contentsItem.kind === types_1.OpKind.DOUBLE_ENDORSEMENT_EVIDENCE ||
                contentsItem.kind === types_1.OpKind.DOUBLE_PREENDORSEMENT_EVIDENCE) {
                const { kind } = contentsItem;
                const { level, round } = contentsItem.op1.operations;
                if ("metadata" in contentsItem) {
                    for (const balanceUpdate of contentsItem.metadata.balance_updates ||
                        EMPTY_LIST) {
                        if (balanceUpdate.kind === "freezer" &&
                            balanceUpdate.category === "deposits" &&
                            balanceUpdate.delegate === baker) {
                            log.info(`${baker} ${kind} at level ${level} round ${round}`);
                            return kind === types_1.OpKind.DOUBLE_ENDORSEMENT_EVIDENCE
                                ? events_1.Events.DoubleEndorsed
                                : events_1.Events.DoublePreendorsed;
                        }
                    }
                    log.warn(`Found ${kind} for level ${level} with metadata, but no freezer balance update, unable to process`);
                }
                else {
                    //perhaps the block is too old for node's history mode
                    log.warn(`Found ${kind} without metadata for level ${level}, unable to process`);
                }
            }
        }
    }
    return null;
};
exports.checkBlockAccusationsForDoubleEndorsement = checkBlockAccusationsForDoubleEndorsement;
const checkBlockAccusationsForDoubleBake = async (baker, operations) => {
    const log = (0, loglevel_1.getLogger)(name);
    for (const operation of operations) {
        for (const contentsItem of operation.contents) {
            if (contentsItem.kind === types_1.OpKind.DOUBLE_BAKING_EVIDENCE) {
                const { level, payload_round } = contentsItem.bh1;
                if ("metadata" in contentsItem) {
                    for (const balanceUpdate of contentsItem.metadata.balance_updates ||
                        EMPTY_LIST) {
                        if (balanceUpdate.kind === "freezer" &&
                            balanceUpdate.category === "deposits" &&
                            balanceUpdate.delegate === baker) {
                            log.info(`${baker} double baked level ${level}, round ${payload_round}`);
                            return true;
                        }
                    }
                    log.warn(`Found double baking evidence for level ${level} with metadata, but no freezer balance update, unable to precess`);
                }
                else {
                    //perhaps the block is too old for node's history mode
                    log.warn(`Found double baking evidence without metadata for level ${level}, unable to process`);
                }
            }
        }
    }
    return false;
};
exports.checkBlockAccusationsForDoubleBake = checkBlockAccusationsForDoubleBake;
