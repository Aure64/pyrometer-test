import type { BakerGroupsRegistry } from "./bakerGroups";

const GROUP_PREFIX = "@group:";

export const resolveSenderBakers = (
  input: string[] | undefined,
  registry: BakerGroupsRegistry,
): string[] | (() => string[]) | undefined => {
  if (input === undefined) return undefined;

  const literals: string[] = [];
  const groupNames: string[] = [];
  let hasGroupRef = false;

  for (const entry of input) {
    if (entry.startsWith(GROUP_PREFIX)) {
      const name = entry.slice(GROUP_PREFIX.length);
      if (!registry.getGroup(name)) {
        throw new Error(
          `sender bakers: unknown group "${name}" (referenced as "${entry}")`,
        );
      }
      groupNames.push(name);
      hasGroupRef = true;
    } else {
      literals.push(entry);
    }
  }

  if (!hasGroupRef) return literals;

  return () => {
    const set = new Set<string>(literals);
    for (const name of groupNames) {
      const g = registry.getGroup(name);
      if (g) g.bakers.forEach((b) => set.add(b));
    }
    return [...set];
  };
};
