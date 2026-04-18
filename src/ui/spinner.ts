import ora, { type Ora, type Options as OraOptions } from "ora";

/** Thin wrapper around ora so we can swap implementations later. */
export function createSpinner(textOrOptions: string | OraOptions): Ora {
  return ora(textOrOptions);
}
