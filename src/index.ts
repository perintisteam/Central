/**
 * Programmatic entry point for `central` as a library.
 *
 * Example:
 *   import { registerFramework, loadRegistry } from "central";
 *
 *   registerFramework({
 *     id: "myfw",
 *     name: "My Framework",
 *     description: "...",
 *     category: "frontend",
 *     tags: ["mine"],
 *     install: { type: "npx", command: "npx my-cli init {{projectName}}" },
 *   });
 */
export {
  loadRegistry,
  registerFramework,
  saveFrameworkToUserRegistry,
} from "./core/registry.js";

export {
  runFrameworkInstall,
  interpolate,
  RunError,
} from "./core/runner.js";

export type {
  Framework,
  PromptStep,
  InstallConfig,
  RegistryFile,
} from "./schemas/framework.schema.js";

export {
  frameworkSchema,
  promptStepSchema,
  installSchema,
  registryFileSchema,
} from "./schemas/framework.schema.js";

export { detectPackageManager } from "./utils/detect-pm.js";

export { CENTRAL_VERSION } from "./version.js";
