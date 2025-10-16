"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.operationsWithDoubleBakeAccusation = exports.operationsWithDoubleEndorsementAccusation = exports.endorsingRightsResponse = exports.endorsementsWithSuccess = exports.endorsementsWithMiss = exports.successfulEndorsement = exports.level = exports.baker = void 0;
const types_1 = require("../../rpc/types");
exports.baker = "tz1VHFxUuBhwopxC9YC9gm5s2MHBHLyCtvN1";
exports.level = 1318230;
exports.successfulEndorsement = {
    protocol: "PtHangz2aRngywmSRGGvrcTyMbbdpWdpFKuS4uMWxg2RaH9i1qx",
    chain_id: "NetXxkAx4woPLyu",
    hash: "op2Vjgfz5sESAgf9droANKQ35toL43ySFCmDzGWTb1nnaaQnSa8",
    branch: "BKmivKSAnaRqEHZr7fZW9oGpYeXDKESfKJbqRXFp1iYLPjmJ4aZ",
    contents: [
        {
            kind: types_1.OpKind.ENDORSEMENT_WITH_SLOT,
            endorsement: {
                branch: "BKmivKSAnaRqEHZr7fZW9oGpYeXDKESfKJbqRXFp1iYLPjmJ4aZ",
                operations: {
                    kind: types_1.OpKind.ENDORSEMENT,
                    level: exports.level,
                },
                signature: "siggw64btFC4MAMdpuN9vYUz7yQfEiFsyHxm152nnyvVh2gmhZuj3rmXdsBZy6bMCT479qaEf4CoLdj3cesHdcG8GANrWvC6",
            },
            slot: 17,
            metadata: {
                balance_updates: [
                    {
                        kind: "contract",
                        contract: exports.baker,
                        change: "-320000000",
                        origin: "block",
                    },
                    {
                        kind: "freezer",
                        category: "deposits",
                        delegate: exports.baker,
                        cycle: 87,
                        change: "320000000",
                        origin: "block",
                    },
                    {
                        kind: "freezer",
                        category: "rewards",
                        delegate: exports.baker,
                        cycle: 87,
                        change: "4166665",
                        origin: "block",
                    },
                ],
                delegate: exports.baker,
                slots: [17],
            },
        },
    ],
};
exports.endorsementsWithMiss = [
    {
        protocol: "PtHangz2aRngywmSRGGvrcTyMbbdpWdpFKuS4uMWxg2RaH9i1qx",
        chain_id: "NetXdQprcVkpaWU",
        hash: "oneKm4rbM1hC4k2UVhq1MrJPMq6RHJotKwKWt4oEdJm3VXmG7ub",
        branch: "BLA3CjVsLUWzvf4GbfMKTqXStUB3Hon526hsdTFB6cF3AFRY4Hn",
        contents: [
            {
                kind: types_1.OpKind.ENDORSEMENT_WITH_SLOT,
                endorsement: {
                    branch: "BLA3CjVsLUWzvf4GbfMKTqXStUB3Hon526hsdTFB6cF3AFRY4Hn",
                    operations: {
                        kind: types_1.OpKind.ENDORSEMENT,
                        level: exports.level,
                    },
                    signature: "sigbJwj4ZMkbd61qtSURkdmY3bSXT8Mx34KGZDZyXP5wz8eZMr475WyZrBTFe5dgSTmmTPqwr4C7qnPC1Jtf45dxtfs7HLWL",
                },
                slot: 0,
            },
        ],
    },
    {
        protocol: "PtHangz2aRngywmSRGGvrcTyMbbdpWdpFKuS4uMWxg2RaH9i1qx",
        chain_id: "NetXdQprcVkpaWU",
        hash: "ooYqdUc8LWn4j6pKFc4wPFWLaGnuxCZEE9p4StZXXPoyxRAXf9a",
        branch: "BLA3CjVsLUWzvf4GbfMKTqXStUB3Hon526hsdTFB6cF3AFRY4Hn",
        contents: [
            {
                kind: types_1.OpKind.ENDORSEMENT_WITH_SLOT,
                endorsement: {
                    branch: "BLA3CjVsLUWzvf4GbfMKTqXStUB3Hon526hsdTFB6cF3AFRY4Hn",
                    operations: {
                        kind: types_1.OpKind.ENDORSEMENT,
                        level: exports.level,
                    },
                    signature: "sigbJwj4ZMkbd61qtSURkdmY3bSXT8Mx34KGZDZyXP5wz8eZMr475WyZrBTFe5dgSTmmTPqwr4C7qnPC1Jtf45dxtfs7HLWL",
                },
                slot: 16,
            },
        ],
    },
    {
        protocol: "PtHangz2aRngywmSRGGvrcTyMbbdpWdpFKuS4uMWxg2RaH9i1qx",
        chain_id: "NetXdQprcVkpaWU",
        hash: "ooFeS9g5RNBfvmxMy69i26a5XTiGoeNaR1kuNBBtohF6CPKfWzF",
        branch: "BLA3CjVsLUWzvf4GbfMKTqXStUB3Hon526hsdTFB6cF3AFRY4Hn",
        contents: [
            {
                kind: types_1.OpKind.ENDORSEMENT_WITH_SLOT,
                endorsement: {
                    branch: "BLA3CjVsLUWzvf4GbfMKTqXStUB3Hon526hsdTFB6cF3AFRY4Hn",
                    operations: {
                        kind: types_1.OpKind.ENDORSEMENT,
                        level: exports.level,
                    },
                    signature: "sigYW8tzPYbSM5i5H2r8cUEvH7KawEqTyp2uXHNbyLdL8sv5D1tMXvZXhcq3GML9CQCdJGUxfB11Y8Xfhy8pBnTmRu95bGkk",
                },
                slot: 14,
            },
        ],
    },
    {
        protocol: "PtHangz2aRngywmSRGGvrcTyMbbdpWdpFKuS4uMWxg2RaH9i1qx",
        chain_id: "NetXdQprcVkpaWU",
        hash: "onzSwuu914ufW1WNNXy4KZm6bxaUgrP3AwNpNKK3Kh5argXZeDc",
        branch: "BLA3CjVsLUWzvf4GbfMKTqXStUB3Hon526hsdTFB6cF3AFRY4Hn",
        contents: [
            {
                kind: types_1.OpKind.ENDORSEMENT_WITH_SLOT,
                endorsement: {
                    branch: "BLA3CjVsLUWzvf4GbfMKTqXStUB3Hon526hsdTFB6cF3AFRY4Hn",
                    operations: {
                        kind: types_1.OpKind.ENDORSEMENT,
                        level: exports.level,
                    },
                    signature: "sigw2sVMQxJB2kGWAY3bES2KgVrA4FLDqDvNvuSPuPtu3b3jAzfdZDiJ7P7JLnNK6ZE6hUZXGytiin5sYakgf14SSvnf7mm2",
                },
                slot: 25,
            },
        ],
    },
    {
        protocol: "PtHangz2aRngywmSRGGvrcTyMbbdpWdpFKuS4uMWxg2RaH9i1qx",
        chain_id: "NetXdQprcVkpaWU",
        hash: "opR15ca7Nne1kSn9J2yWNL3KFq3PqswUbGf3sjYXn5TNZGhPnrF",
        branch: "BLA3CjVsLUWzvf4GbfMKTqXStUB3Hon526hsdTFB6cF3AFRY4Hn",
        contents: [
            {
                kind: types_1.OpKind.ENDORSEMENT_WITH_SLOT,
                endorsement: {
                    branch: "BLA3CjVsLUWzvf4GbfMKTqXStUB3Hon526hsdTFB6cF3AFRY4Hn",
                    operations: {
                        kind: types_1.OpKind.ENDORSEMENT,
                        level: exports.level,
                    },
                    signature: "sigR62M6wREB4RsFTcKxx8fLpDvae6s1PaWZ6dJW55XQGxAnxn9a1Jhugu72kbsfFQiySXDujm76Xtby4yswFjdsSt1uQHZz",
                },
                slot: 9,
            },
        ],
    },
];
exports.endorsementsWithSuccess = [
    ...exports.endorsementsWithMiss,
    exports.successfulEndorsement,
];
exports.endorsingRightsResponse = [
    {
        level: 1318230,
        delegate: "tz3bvNMQ95vfAYtG8193ymshqjSvmxiCUuR5",
        slots: [19, 3],
        estimated_time: "2021-01-26T15:27:34Z",
    },
    {
        level: 1318230,
        delegate: "tz3bTdwZinP8U1JmSweNzVKhmwafqWmFWRfk",
        slots: [4, 1],
        estimated_time: "2021-01-26T15:27:34Z",
    },
    {
        level: 1318230,
        delegate: "tz3VEZ4k6a4Wx42iyev6i2aVAptTRLEAivNN",
        slots: [21],
        estimated_time: "2021-01-26T15:27:34Z",
    },
    {
        level: 1318230,
        delegate: "tz3UoffC7FG7zfpmvmjUmUeAaHvzdcUvAj6r",
        slots: [22, 2],
        estimated_time: "2021-01-26T15:27:34Z",
    },
    {
        level: 1318230,
        delegate: "tz3RDC3Jdn4j15J7bBHZd29EUee9gVB1CxD9",
        slots: [23, 15],
        estimated_time: "2021-01-26T15:27:34Z",
    },
    {
        level: 1318230,
        delegate: "tz3RB4aoyjov4KEVRbuhvQ1CKJgBJMWhaeB8",
        slots: [30, 5],
        estimated_time: "2021-01-26T15:27:34Z",
    },
    {
        level: 1318230,
        delegate: "tz3QCNyySViKHmeSr45kzDxzchys7NiXCWoa",
        slots: [29],
        estimated_time: "2021-01-26T15:27:34Z",
    },
    {
        level: 1318230,
        delegate: "tz3NExpXn9aPNZPorRE4SdjJ2RGrfbJgMAaV",
        slots: [20, 14],
        estimated_time: "2021-01-26T15:27:34Z",
    },
    {
        level: 1318230,
        delegate: "tz2FCNBrERXtaTtNX6iimR1UJ5JSDxvdHM93",
        slots: [16],
        estimated_time: "2021-01-26T15:27:34Z",
    },
    {
        level: 1318230,
        delegate: "tz1irJKkXS2DBWkU1NnmFQx1c1L7pbGg4yhk",
        slots: [13, 12],
        estimated_time: "2021-01-26T15:27:34Z",
    },
    {
        level: 1318230,
        delegate: "tz1gfArv665EUkSg2ojMBzcbfwuPxAvqPvjo",
        slots: [28],
        estimated_time: "2021-01-26T15:27:34Z",
    },
    {
        level: 1318230,
        delegate: "tz1eEnQhbwf6trb8Q8mPb2RaPkNk2rN7BKi8",
        slots: [27],
        estimated_time: "2021-01-26T15:27:34Z",
    },
    {
        level: 1318230,
        delegate: "tz1aRoaRhSpRYvFdyvgWLL6TGyRoGF51wDjM",
        slots: [18, 10, 9],
        estimated_time: "2021-01-26T15:27:34Z",
    },
    {
        level: 1318230,
        delegate: "tz1Y7tsDmwrJocSt81Nt8apH1h6LnehMLRiH",
        slots: [26],
        estimated_time: "2021-01-26T15:27:34Z",
    },
    {
        level: 1318230,
        delegate: "tz1WpeqFaBG9Jm73Dmgqamy8eF8NWLz9JCoY",
        slots: [6],
        estimated_time: "2021-01-26T15:27:34Z",
    },
    {
        level: 1318230,
        delegate: "tz1Vc9XAD7iphycJoRwE1Nxx5krB9C7XyBu5",
        slots: [25],
        estimated_time: "2021-01-26T15:27:34Z",
    },
    {
        level: 1318230,
        delegate: exports.baker,
        slots: [17],
        estimated_time: "2021-01-26T15:27:34Z",
    },
    {
        level: 1318230,
        delegate: "tz1S8MNvuFEUsWgjHvi3AxibRBf388NhT1q2",
        slots: [8, 0],
        estimated_time: "2021-01-26T15:27:34Z",
    },
    {
        level: 1318230,
        delegate: "tz1PWCDnz783NNGGQjEFFsHtrcK5yBW4E2rm",
        slots: [24],
        estimated_time: "2021-01-26T15:27:34Z",
    },
    {
        level: 1318230,
        delegate: "tz1NHJkUcjHwSGHviyrk2WzpXk2c9uYMKknD",
        slots: [7],
        estimated_time: "2021-01-26T15:27:34Z",
    },
    {
        level: 1318230,
        delegate: "tz1MXFrtZoaXckE41bjUCSjAjAap3AFDSr3N",
        slots: [31],
        estimated_time: "2021-01-26T15:27:34Z",
    },
    {
        level: 1318230,
        delegate: "tz1Ldzz6k1BHdhuKvAtMRX7h5kJSMHESMHLC",
        slots: [11],
        estimated_time: "2021-01-26T15:27:34Z",
    },
];
const operationContentsWithDoubleEndorsement = {
    kind: types_1.OpKind.DOUBLE_ENDORSEMENT_EVIDENCE,
    slot: 17,
    op1: {
        branch: "",
        operations: {
            kind: types_1.OpKind.ENDORSEMENT,
            level: exports.level,
        },
        signature: exports.successfulEndorsement.contents[0]
            .endorsement.signature,
    },
    op2: {
        branch: "",
        operations: {
            kind: types_1.OpKind.ENDORSEMENT,
            level: exports.level,
        },
        signature: "",
    },
};
exports.operationsWithDoubleEndorsementAccusation = [
    {
        protocol: "PtHangz2aRngywmSRGGvrcTyMbbdpWdpFKuS4uMWxg2RaH9i1qx",
        chain_id: "NetXdQprcVkpaWU",
        hash: "opEcYqxb9HYvdQE5jLvazmpdk93f8M7dcQMdh33mpqDQeC3rDdF",
        branch: "BLA3CjVsLUWzvf4GbfMKTqXStUB3Hon526hsdTFB6cF3AFRY4Hn",
        contents: [operationContentsWithDoubleEndorsement],
    },
];
const operationContentsWithDoubleBake = {
    kind: types_1.OpKind.DOUBLE_BAKING_EVIDENCE,
    bh1: {
        liquidity_baking_escape_vote: false,
        level: 1299013,
        proto: 12,
        predecessor: "",
        timestamp: "",
        validation_pass: 1,
        operations_hash: "",
        fitness: [],
        context: "",
        priority: 0,
        proof_of_work_nonce: "",
        signature: "",
    },
    bh2: {
        liquidity_baking_escape_vote: false,
        level: 1299013,
        proto: 12,
        predecessor: "",
        timestamp: "",
        validation_pass: 1,
        operations_hash: "",
        fitness: [],
        context: "",
        priority: 0,
        proof_of_work_nonce: "",
        signature: "",
    },
};
exports.operationsWithDoubleBakeAccusation = [
    {
        protocol: "PtHangz2aRngywmSRGGvrcTyMbbdpWdpFKuS4uMWxg2RaH9i1qx",
        chain_id: "NetXdQprcVkpaWU",
        hash: "opEcYqxb9HYvdQE5jLvazmpdk93f8M7dcQMdh33mpqDQeC3rDdF",
        branch: "BLA3CjVsLUWzvf4GbfMKTqXStUB3Hon526hsdTFB6cF3AFRY4Hn",
        contents: [operationContentsWithDoubleBake],
    },
];
