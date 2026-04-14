export interface AllocationRule {
  bucket: "essentials" | "investment" | "stability" | "joy";
  ratio: number;
}

export const DEFAULT_ALLOCATION_RULES: AllocationRule[] = [
  { bucket: "essentials", ratio: 0.5 },
  { bucket: "investment", ratio: 0.25 },
  { bucket: "stability", ratio: 0.15 },
  { bucket: "joy", ratio: 0.1 }
];

export function allocateIncome(amount: number, rules: AllocationRule[] = DEFAULT_ALLOCATION_RULES) {
  return rules.map((rule, index) => {
    if (index === rules.length - 1) {
      const assigned = rules
        .slice(0, -1)
        .reduce((sum, r) => sum + Math.round(amount * r.ratio), 0);
      return { bucket: rule.bucket, amount: Math.max(0, amount - assigned), ratio: rule.ratio };
    }

    return {
      bucket: rule.bucket,
      amount: Math.round(amount * rule.ratio),
      ratio: rule.ratio
    };
  });
}
