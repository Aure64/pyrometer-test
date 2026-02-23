import { getLogger } from "loglevel";

import { BakerEvent, Events } from "./events";
import now from "./now";
import { RpcClient } from "./rpc/client";

import { OpKind } from "./rpc/types";
import {
  Block as BlockT,
  Operation as OperationT,
} from "./rpc/types/gen/PtTALLiNtPec/Block";
import { BakingRights as BakingRightsT } from "./rpc/types/gen/PtTALLiNtPec/BakingRights";
import { EndorsingRights as EndorsingRightsT } from "./rpc/types/gen/PtTALLiNtPec/EndorsingRights";

const name = "bm-proto-t";

export type CheckBlockArgs = {
  bakers: string[];
  block: BlockT;
  rpc: RpcClient;
};

const EMPTY_LIST = Object.freeze([]);

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

  const [bakingRights, endorsingRights] = <[BakingRightsT, EndorsingRightsT]>(
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
    } as any;
    switch (params.kind) {
      case Events.Baked:
        return { ...event, kind: params.kind, priority, level: blockLevel };
      case Events.Endorsed:
      case Events.MissedEndorsement:
        return {
          ...event,
          kind: params.kind,
          slotCount: (params as any).slotCount,
          level: (params as any).level,
        };
      default:
        return { ...event, kind: params.kind, level: blockLevel };
    }
  };

  for (const baker of bakers) {
    const endorsementOperations = block.operations[0] as OperationT[];
    const anonymousOperations = block.operations[2] as OperationT[];
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
  bakingRights: BakingRightsT;
  blockPriority: number;
}): Events.MissedBake | Events.MissedBonus | Events.Baked | null => {
  const log = getLogger(name);
  const bakerRight = bakingRights.find(
    (br: BakingRightsT[number]) => br.delegate === baker,
  );
  if (!bakerRight) {
    log.debug(`No baking slot at block ${blockId} for ${baker}`);
    return null;
  }
  const blockRight = bakingRights.find(
    (br: BakingRightsT[number]) => br.round === blockPriority,
  );
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
  endorsementOperations: OperationT[];
  level: number;
  endorsingRights: EndorsingRightsT;
};

export const checkBlockEndorsingRights = ({
  baker,
  endorsementOperations,
  level,
  endorsingRights,
}: CheckBlockEndorsingRightsArgs):
  | [Events.Endorsed | Events.MissedEndorsement, number]
  | null => {
  const log = getLogger(name);
  const levelRights = endorsingRights.find(
    (right: EndorsingRightsT[number]) => right.level === level,
  );
  if (!levelRights) {
    log.warn(`did not find rights for level ${level} in`, endorsingRights);
    return null;
  }
  const endorsingRight = levelRights.delegates.find(
    (d: EndorsingRightsT[number]["delegates"][number]) => d.delegate === baker,
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
  operation: OperationT,
  delegate: string,
): boolean => {
  for (const contentsItem of operation.contents) {
    if (
      (contentsItem.kind === OpKind.ATTESTATION ||
        contentsItem.kind === OpKind.ATTESTATION_WITH_DAL) &&
      "metadata" in contentsItem
    ) {
      if ((contentsItem as any).metadata.delegate === delegate) {
        return true;
      }
    }
  }
  return false;
};

export const checkBlockAccusationsForDoubleEndorsement = async (
  baker: string,
  operations: OperationT[],
): Promise<Events.DoubleEndorsed | Events.DoublePreendorsed | null> => {
  const log = getLogger(name);
  for (const operation of operations) {
    for (const contentsItem of operation.contents) {
      const k = (contentsItem as any).kind;
      if (
        k === OpKind.DOUBLE_ATTESTATION_EVIDENCE ||
        k === (OpKind as any).DOUBLE_CONSENSUS_OPERATION_EVIDENCE
      ) {
        const { kind } = contentsItem as any;
        const { level, round } = (contentsItem as any).op1.operations || (contentsItem as any).op1;
        if ("metadata" in contentsItem) {
          const punished = (contentsItem as any).metadata?.punished_delegate;
          if (punished === baker) {
            log.info(`${baker} ${kind} at level ${level} round ${round}`);
            return kind === OpKind.DOUBLE_ATTESTATION_EVIDENCE
              ? Events.DoubleEndorsed
              : Events.DoublePreendorsed;
          }
        }
      }
    }
  }
  return null;
};

export const checkBlockAccusationsForDoubleBake = async (
  baker: string,
  operations: OperationT[],
): Promise<boolean> => {
  const log = getLogger(name);
  for (const operation of operations) {
    for (const contentsItem of operation.contents) {
      if (contentsItem.kind === OpKind.DOUBLE_BAKING_EVIDENCE) {
        const { level, payload_round } = (contentsItem as any).bh1;
        if ("metadata" in contentsItem) {
          const punished = (contentsItem as any).metadata?.punished_delegate;
          if (punished === baker) {
            log.info(
              `${baker} double baked level ${level}, round ${payload_round}`,
            );
            return true;
          }
        }
      }
    }
  }
  return false;
};
