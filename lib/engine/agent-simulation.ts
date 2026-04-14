import { FinancialState, PriorityDecision } from "@/types/domain";

interface AgentContext {
  state: FinancialState;
  warnings: string[];
  score: number;
}

interface SimulationAgent {
  name: "Budget Guardian" | "Growth Advisor" | "Risk Controller";
  evaluate(ctx: AgentContext): PriorityDecision[];
}

const budgetGuardian: SimulationAgent = {
  name: "Budget Guardian",
  evaluate(ctx) {
    const out: PriorityDecision[] = [];
    if (ctx.state.monthlyExpense > ctx.state.monthlyIncome * 0.9) {
      out.push({ priority: "high", message: "Expense ceiling breached. Block discretionary spend.", source: this.name });
    }
    if (ctx.warnings.some((w) => w.toLowerCase().includes("food"))) {
      out.push({ priority: "medium", message: "Cap food orders this week.", source: this.name });
    }
    return out;
  }
};

const growthAdvisor: SimulationAgent = {
  name: "Growth Advisor",
  evaluate(ctx) {
    const out: PriorityDecision[] = [];
    if (ctx.state.monthlyIncome > 0 && ctx.state.monthlyExpense < ctx.state.monthlyIncome * 0.75) {
      out.push({ priority: "low", message: "Increase investment allocation by 5% next cycle.", source: this.name });
    }
    if (ctx.score < 60) {
      out.push({ priority: "medium", message: "Rebuild savings consistency with weekly transfer automation.", source: this.name });
    }
    return out;
  }
};

const riskController: SimulationAgent = {
  name: "Risk Controller",
  evaluate(ctx) {
    const out: PriorityDecision[] = [];
    if (ctx.state.balance <= 0) {
      out.push({ priority: "high", message: "Do not spend today.", source: this.name });
    }
    if (ctx.warnings.some((w) => w.toLowerCase().includes("projected spending exceeds"))) {
      out.push({ priority: "high", message: "Deficit risk detected. Freeze non-essential purchases.", source: this.name });
    }
    return out;
  }
};

const agents: SimulationAgent[] = [budgetGuardian, growthAdvisor, riskController];

export function runAgentSimulation(ctx: AgentContext): PriorityDecision[] {
  return agents.flatMap((agent) => agent.evaluate(ctx));
}
