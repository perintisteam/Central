import * as p from "@clack/prompts";
import type { PromptStep } from "../schemas/framework.schema.js";
import type { PromptAnswers } from "./runner.js";

/** Run a sequence of prompt steps and collect the answers keyed by step id. */
export async function runPromptSteps(
  steps: PromptStep[] | undefined
): Promise<PromptAnswers> {
  const answers: PromptAnswers = {};
  if (!steps || steps.length === 0) return answers;

  for (const step of steps) {
    const value = await runStep(step);
    if (p.isCancel(value)) {
      p.cancel("Cancelled.");
      process.exit(0);
    }
    answers[step.id] = value as string | boolean | undefined;
  }

  return answers;
}

async function runStep(step: PromptStep): Promise<unknown> {
  switch (step.type) {
    case "text":
      return p.text({
        message: step.message,
        placeholder: step.placeholder,
        initialValue: typeof step.initial === "string" ? step.initial : undefined,
        validate: (value) => {
          if (step.required && (!value || value.trim().length === 0)) {
            return "This field is required.";
          }
          return undefined;
        },
      });

    case "confirm":
      return p.confirm({
        message: step.message,
        initialValue: typeof step.initial === "boolean" ? step.initial : true,
      });

    case "select": {
      const options = (step.options ?? []).map((o) => ({
        value: o.value,
        label: o.label,
        hint: o.hint,
      }));
      if (options.length === 0) {
        throw new Error(`select prompt "${step.id}" has no options.`);
      }
      return p.select({
        message: step.message,
        options,
        initialValue: typeof step.initial === "string" ? step.initial : undefined,
      });
    }
  }
}
