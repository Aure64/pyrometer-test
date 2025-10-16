import { getLogger } from "loglevel";

import { BakerEvent, Events } from "./events";

import now from "./now";

import { RpcClient } from "./rpc/client";
import {
  BlockR,
  EndorsingRightsR,
  BakingRightsR,
  OpKind,
  OperationR,
} from "./rpc/types";

import { _022_PsRiotum$FrozenStaker } from "rpc/types/gen/PsRiotumaAMo/Block";

const name = "bm-proto-r";

export type CheckBlockArgs = {
  bakers: string[];
  block: BlockR;
  rpc: RpcClient;
};

const EMPTY_LIST = Object.freeze([]);

/**
 * Analyze block data for baking and endorsing related events.
 */
export default async ({
  bakers,
  block,
  rpc,
}: CheckBlockArgs): Promise<BakerEvent[]> => {
  const metadata = block.metadata!;
  const blockLevel = metadata.level_info.level;
  const blockCycle = metadata.level_info.cycle;
  const blockId = `${blockLevel}`;

  const { header } = block;
  const priority = header.payload_round;
  const blockTimestamp = new Date(header.timestamp);

  const [bakingRights, endorsingRights] = <[BakingRightsR, EndorsingRightsR]>(
    await rpc.getRights(blockLevel, priority)
  );

  const events: BakerEvent[] = [];

  type CreateEventParams = { baker: string } & (
    | {
      kind:
      | Events.Baked
      | Events.MissedBake
      | Events.MissedBonus
      | Events.DoubleBaked
      | Events.DoubleEndorsed
      | Events.DoublePreendorsed;
    }
    | {
      kind: Events.Endorsed | Events.MissedEndorsement;
      level: number;
      slotCount: number;
    }
  );

  const createEvent = (params: CreateEventParams): BakerEvent => {
    const event = {
      baker: params.baker,
      createdAt: now(),
      cycle: blockCycle,
      timestamp: blockTimestamp,
    };
    switch (params.kind) {
      case Events.Baked:
        return { ...event, kind: params.kind, priority, level: blockLevel };
      case Events.Endorsed:
      case Events.MissedEndorsement:
        return {
          ...event,
          kind: params.kind,
          slotCount: params.slotCount,
          level: params.level,
        };
      default:
        return { ...event, kind: params.kind, level: blockLevel };
    }
  };

  for (const baker of bakers) {
    const endorsementOperations = block.operations[0];
    const anonymousOperations = block.operations[2];
    const bakingEvent = checkBlockBakingRights({
      baker,
      bakingRights: bakingRights,
      blockBaker: metadata.baker,
      blockProposer: metadata.proposer,
      blockId,
      blockPriority: priority,
    });
    if (bakingEvent) {
      events.push(createEvent({ baker, kind: bakingEvent }));
    }

    const endorsingEvent = checkBlockEndorsingRights({
      baker,
      level: blockLevel - 1,
      endorsementOperations,
      endorsingRights,
    });
    if (endorsingEvent) {
      const [kind, slotCount] = endorsingEvent;
      events.push(
        createEvent({ baker, kind, level: blockLevel - 1, slotCount }),
      );
    }
    const doubleBakeEvent = await checkBlockAccusationsForDoubleBake(
      baker,
      anonymousOperations,
    );
    if (doubleBakeEvent) {
      events.push(createEvent({ baker, kind: Events.DoubleBaked }));
    }
    const doubleEndorseEvent = await checkBlockAccusationsForDoubleEndorsement(
      baker,
      anonymousOperations,
    );
    if (doubleEndorseEvent) {
      events.push(createEvent({ baker, kind: doubleEndorseEvent }));
    }
  }
  return events;
};

/**
 * Check the baking rights for a block to see if the provided baker had a successful or missed bake.
 */

export const checkBlockBakingRights = ({
  baker,
  blockBaker,
  blockProposer,
  bakingRights,
  blockId,
  blockPriority,
}: {
  baker: string;
  blockBaker: string;
  blockProposer: string;
  blockId: string;
  bakingRights: BakingRightsR;
  blockPriority: number;
}): Events.MissedBake | Events.MissedBonus | Events.Baked | null => {
  const log = getLogger(name);

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
    log.error(
      `No rights found block ${blockId} at round ${blockPriority}`,
      bakingRights,
    );
    return null;
  }

  if (blockProposer === baker && blockBaker !== baker) {
    log.info(
      `${baker} proposed block at level ${blockRight.level}, but didn't bake it`,
    );
    return Events.MissedBonus;
  }

  if (bakerRight.round < blockRight.round) {
    log.info(
      `${baker} had baking slot for round ${bakerRight.round}, but missed it (block baked at round ${blockPriority})`,
    );
    return Events.MissedBake;
  }

  if (
    blockRight.delegate === baker &&
    blockRight.round === bakerRight.round &&
    blockBaker === baker
  ) {
    log.info(
      `${baker} baked block ${blockId} at round ${blockPriority} of level ${blockRight.level}`,
    );
    return Events.Baked;
  }

  return null;
};

type CheckBlockEndorsingRightsArgs = {
  baker: string;
  endorsementOperations: OperationR[];
  level: number;
  endorsingRights: EndorsingRightsR;
};

/**
 * Check the endorsing rights for a block to see if the provided endorser had a successful or missed endorse.
 */
export const checkBlockEndorsingRights = ({
  baker,
  endorsementOperations,
  level,
  endorsingRights,
}: CheckBlockEndorsingRightsArgs):
  | [Events.Endorsed | Events.MissedEndorsement, number]
  | null => {
  const log = getLogger(name);
  const levelRights = endorsingRights.find((right) => right.level === level);
  if (!levelRights) {
    log.warn(`did not find rights for level ${level} in`, endorsingRights);
    return null;
  }
  const endorsingRight = levelRights.delegates.find(
    (d) => d.delegate === baker,
  );
  if (endorsingRight) {
    const slotCount = endorsingRight.attestation_power;
    log.debug(
      `found ${slotCount} endorsement slots for baker ${baker} at level ${level}`,
    );
    const didEndorse =
      endorsementOperations.find((op) => isEndorsementByDelegate(op, baker)) !==
      undefined;
    if (didEndorse) {
      log.debug(`Successful endorse for baker ${baker}`);
      return [Events.Endorsed, slotCount];
    } else {
      log.debug(`Missed endorse for baker ${baker} at level ${level}`);
      return [Events.MissedEndorsement, slotCount];
    }
  }

  log.debug(`No endorse event for baker ${baker}`);
  return null;
};

const isEndorsementByDelegate = (
  operation: OperationR,
  delegate: string,
): boolean => {
  for (const contentsItem of operation.contents) {
    if (
      (contentsItem.kind === OpKind.ATTESTATION || contentsItem.kind === OpKind.ATTESTATION_WITH_DAL) &&
      "metadata" in contentsItem
    ) {
      if (contentsItem.metadata.delegate === delegate) {
        return true;
      }
    }
  }

  return false;
};

function getBaker(staker: _022_PsRiotum$FrozenStaker): string {
  if ("delegate" in staker) {
    return staker.delegate;
  } else if ("baker_own_stake" in staker) {
    return staker.baker_own_stake;
  } else {
    return staker.baker_edge;
  }
}

export const checkBlockAccusationsForDoubleEndorsement = async (
  baker: string,
  operations: OperationR[],
): Promise<Events.DoubleEndorsed | Events.DoublePreendorsed | null> => {
  const log = getLogger(name);
  for (const operation of operations) {
    for (const contentsItem of operation.contents) {
      if (
        contentsItem.kind === OpKind.DOUBLE_ATTESTATION_EVIDENCE ||
        contentsItem.kind === OpKind.DOUBLE_PREATTESTATION_EVIDENCE
      ) {
        const { kind } = contentsItem;
        const { level, round } = contentsItem.op1.operations;
        if ("metadata" in contentsItem) {
          for (const balanceUpdate of contentsItem.metadata.balance_updates ||
            EMPTY_LIST) {
            if (
              balanceUpdate.kind === "freezer" &&
              balanceUpdate.category === "deposits" &&
              getBaker(balanceUpdate.staker) === baker
            ) {
              log.info(`${baker} ${kind} at level ${level} round ${round}`);
              return kind === OpKind.DOUBLE_ATTESTATION_EVIDENCE
                ? Events.DoubleEndorsed
                : Events.DoublePreendorsed;
            }
          }
          log.warn(
            `Found ${kind} for level ${level} with metadata, but no freezer balance update, unable to process`,
          );
        } else {
          //perhaps the block is too old for node's history mode
          log.warn(
            `Found ${kind} without metadata for level ${level}, unable to process`,
          );
        }
      }
    }
  }

  return null;
};

export const checkBlockAccusationsForDoubleBake = async (
  baker: string,
  operations: OperationR[],
): Promise<boolean> => {
  const log = getLogger(name);
  for (const operation of operations) {
    for (const contentsItem of operation.contents) {
      if (contentsItem.kind === OpKind.DOUBLE_BAKING_EVIDENCE) {
        const { level, payload_round } = contentsItem.bh1;
        if ("metadata" in contentsItem) {
          for (const balanceUpdate of contentsItem.metadata.balance_updates ||
            EMPTY_LIST) {
            if (
              balanceUpdate.kind === "freezer" &&
              balanceUpdate.category === "deposits" &&
              getBaker(balanceUpdate.staker) === baker
            ) {
              log.info(
                `${baker} double baked level ${level}, round ${payload_round}`,
              );
              return true;
            }
          }
          log.warn(
            `Found double baking evidence for level ${level} with metadata, but no freezer balance update, unable to precess`,
          );
        } else {
          //perhaps the block is too old for node's history mode
          log.warn(
            `Found double baking evidence without metadata for level ${level}, unable to process`,
          );
        }
      }
    }
  }

  return false;
};
