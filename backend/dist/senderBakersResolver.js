"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveSenderBakers = void 0;
const GROUP_PREFIX = "@group:";
const resolveSenderBakers = (input, registry) => {
    if (input === undefined)
        return undefined;
    const literals = [];
    const groupNames = [];
    let hasGroupRef = false;
    for (const entry of input) {
        if (entry.startsWith(GROUP_PREFIX)) {
            const name = entry.slice(GROUP_PREFIX.length);
            if (!registry.getGroup(name)) {
                throw new Error(`sender bakers: unknown group "${name}" (referenced as "${entry}")`);
            }
            groupNames.push(name);
            hasGroupRef = true;
        }
        else {
            literals.push(entry);
        }
    }
    if (!hasGroupRef)
        return literals;
    return () => {
        const set = new Set(literals);
        for (const name of groupNames) {
            const g = registry.getGroup(name);
            if (g)
                g.bakers.forEach((b) => set.add(b));
        }
        return [...set];
    };
};
exports.resolveSenderBakers = resolveSenderBakers;
