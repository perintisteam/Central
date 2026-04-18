import type { Framework } from "../schemas/framework.schema.js";

/**
 * Built-in framework definitions shipped with CENTRAL.
 * Users can override or extend these via `central add <path>`.
 *
 * The `{{projectName}}` token inside `install.command` is replaced at
 * runtime by the answer to the prompt with the same `id`.
 */
export const defaultFrameworks: Framework[] = [
  {
    id: "nextjs",
    name: "Next.js",
    description: "The React framework for production — SSR, RSC, routing and more.",
    category: "fullstack",
    tags: ["react", "ssr", "fullstack", "vercel"],
    docs: "https://nextjs.org/docs",
    install: {
      type: "npx",
      command: "npx create-next-app@latest {{projectName}}",
    },
    prompts: [
      {
        id: "projectName",
        type: "text",
        message: "Project name",
        placeholder: "my-next-app",
        required: true,
      },
    ],
    nextSteps: [
      "cd {{projectName}}",
      "npm run dev",
    ],
  },
  {
    id: "nestjs",
    name: "Nest.js",
    description: "A progressive Node.js framework for scalable server-side applications.",
    category: "backend",
    tags: ["node", "typescript", "backend", "oop"],
    docs: "https://docs.nestjs.com",
    install: {
      type: "custom",
      command: "npm i -g @nestjs/cli && nest new {{projectName}}",
    },
    prompts: [
      {
        id: "projectName",
        type: "text",
        message: "Project name",
        placeholder: "my-nest-app",
        required: true,
      },
    ],
    nextSteps: [
      "cd {{projectName}}",
      "npm run start:dev",
    ],
  },
  {
    id: "nuxt",
    name: "Nuxt.js",
    description: "The intuitive Vue framework for building modern full-stack apps.",
    category: "fullstack",
    tags: ["vue", "ssr", "fullstack"],
    docs: "https://nuxt.com/docs",
    install: {
      type: "npx",
      command: "npx nuxi@latest init {{projectName}}",
    },
    prompts: [
      {
        id: "projectName",
        type: "text",
        message: "Project name",
        placeholder: "my-nuxt-app",
        required: true,
      },
    ],
    nextSteps: [
      "cd {{projectName}}",
      "npm install",
      "npm run dev",
    ],
  },
  {
    id: "sveltekit",
    name: "SvelteKit",
    description: "The fastest way to build Svelte apps — routing, SSR, and endpoints.",
    category: "fullstack",
    tags: ["svelte", "ssr", "fullstack"],
    docs: "https://kit.svelte.dev/docs",
    install: {
      type: "npm",
      command: "npm create svelte@latest {{projectName}}",
    },
    prompts: [
      {
        id: "projectName",
        type: "text",
        message: "Project name",
        placeholder: "my-svelte-app",
        required: true,
      },
    ],
    nextSteps: [
      "cd {{projectName}}",
      "npm install",
      "npm run dev",
    ],
  },
  {
    id: "astro",
    name: "Astro",
    description: "The web framework for content-driven websites — islands, zero JS by default.",
    category: "frontend",
    tags: ["static", "islands", "content", "mdx"],
    docs: "https://docs.astro.build",
    install: {
      type: "npm",
      command: "npm create astro@latest {{projectName}}",
    },
    prompts: [
      {
        id: "projectName",
        type: "text",
        message: "Project name",
        placeholder: "my-astro-site",
        required: true,
      },
    ],
    nextSteps: [
      "cd {{projectName}}",
      "npm run dev",
    ],
  },
  {
    id: "remix",
    name: "Remix",
    description: "Full-stack web framework focused on web standards and great UX.",
    category: "fullstack",
    tags: ["react", "ssr", "fullstack"],
    docs: "https://remix.run/docs",
    install: {
      type: "npx",
      command: "npx create-remix@latest {{projectName}}",
    },
    prompts: [
      {
        id: "projectName",
        type: "text",
        message: "Project name",
        placeholder: "my-remix-app",
        required: true,
      },
    ],
    nextSteps: [
      "cd {{projectName}}",
      "npm run dev",
    ],
  },
  {
    id: "express-ts",
    name: "Express (TS)",
    description: "Minimal TypeScript Express server scaffolded by CENTRAL.",
    category: "backend",
    tags: ["node", "express", "typescript", "backend"],
    docs: "https://expressjs.com",
    install: {
      type: "custom",
      command: "central:scaffold-express-ts {{projectName}}",
    },
    prompts: [
      {
        id: "projectName",
        type: "text",
        message: "Project name",
        placeholder: "my-express-app",
        required: true,
      },
    ],
    nextSteps: [
      "cd {{projectName}}",
      "npm run dev",
    ],
  },
  {
    id: "hono",
    name: "Hono",
    description: "Small, simple, ultra-fast web framework that runs on any JS runtime.",
    category: "backend",
    tags: ["edge", "workers", "deno", "bun", "backend"],
    docs: "https://hono.dev/docs",
    install: {
      type: "npm",
      command: "npm create hono@latest {{projectName}}",
    },
    prompts: [
      {
        id: "projectName",
        type: "text",
        message: "Project name",
        placeholder: "my-hono-app",
        required: true,
      },
    ],
    nextSteps: [
      "cd {{projectName}}",
      "npm install",
      "npm run dev",
    ],
  },
  {
    id: "vite-react",
    name: "Vite (React + TS)",
    description: "Lightning-fast frontend tooling with a React + TypeScript template.",
    category: "frontend",
    tags: ["react", "vite", "spa", "typescript"],
    docs: "https://vitejs.dev/guide",
    install: {
      type: "npm",
      command: "npm create vite@latest {{projectName}} -- --template react-ts",
    },
    prompts: [
      {
        id: "projectName",
        type: "text",
        message: "Project name",
        placeholder: "my-vite-app",
        required: true,
      },
    ],
    nextSteps: [
      "cd {{projectName}}",
      "npm install",
      "npm run dev",
    ],
  },
  {
    id: "analog",
    name: "Analog",
    description: "The fullstack Angular meta-framework — SSR, file routing, API routes.",
    category: "fullstack",
    tags: ["angular", "ssr", "fullstack", "meta"],
    docs: "https://analogjs.org",
    install: {
      type: "npm",
      command: "npm create analog@latest {{projectName}}",
    },
    prompts: [
      {
        id: "projectName",
        type: "text",
        message: "Project name",
        placeholder: "my-analog-app",
        required: true,
      },
    ],
    nextSteps: [
      "cd {{projectName}}",
      "npm install",
      "npm run dev",
    ],
  },
];
