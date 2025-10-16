"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseWithPriorityZero = exports.priorityZeroOtherBaker = exports.priorityZero = exports.levelWithMultipleBakers = void 0;
exports.levelWithMultipleBakers = 1298498;
const responseWithLowerPriorities = [
    {
        level: 1298433,
        delegate: "tz1VHFxUuBhwopxC9YC9gm5s2MHBHLyCtvN1",
        priority: 24,
    },
    {
        level: 1298441,
        delegate: "tz1VHFxUuBhwopxC9YC9gm5s2MHBHLyCtvN1",
        priority: 62,
    },
    {
        level: 1298449,
        delegate: "tz1VHFxUuBhwopxC9YC9gm5s2MHBHLyCtvN1",
        priority: 37,
    },
    {
        level: 1298454,
        delegate: "tz1VHFxUuBhwopxC9YC9gm5s2MHBHLyCtvN1",
        priority: 13,
    },
    {
        level: 1298460,
        delegate: "tz1VHFxUuBhwopxC9YC9gm5s2MHBHLyCtvN1",
        priority: 47,
    },
    {
        level: 1298465,
        delegate: "tz1VHFxUuBhwopxC9YC9gm5s2MHBHLyCtvN1",
        priority: 19,
    },
    {
        level: 1298475,
        delegate: "tz1VHFxUuBhwopxC9YC9gm5s2MHBHLyCtvN1",
        priority: 52,
    },
    {
        level: 1298476,
        delegate: "tz1VHFxUuBhwopxC9YC9gm5s2MHBHLyCtvN1",
        priority: 25,
    },
    {
        level: 1298490,
        delegate: "tz1VHFxUuBhwopxC9YC9gm5s2MHBHLyCtvN1",
        priority: 25,
    },
    {
        level: exports.levelWithMultipleBakers,
        delegate: "tz1VHFxUuBhwopxC9YC9gm5s2MHBHLyCtvN1",
        priority: 46,
    },
];
exports.priorityZero = {
    level: 1299013,
    delegate: "tz1VHFxUuBhwopxC9YC9gm5s2MHBHLyCtvN1",
    priority: 0,
};
exports.priorityZeroOtherBaker = {
    level: exports.levelWithMultipleBakers,
    delegate: "other_baker",
    priority: 0,
};
exports.responseWithPriorityZero = [
    ...responseWithLowerPriorities,
    exports.priorityZeroOtherBaker,
    exports.priorityZero,
];
