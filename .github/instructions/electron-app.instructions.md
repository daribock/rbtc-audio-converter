---
description: "Use when modifying the Electron Forge app, preload bridge, renderer DOM code, IPC flow, or project scripts. Preserve the plain JavaScript architecture and validate changes against the actual repo structure when docs conflict."
name: "Electron App Conventions"
applyTo: "src/**/*.js", "src/**/*.cjs", "forge.config.cjs", "scripts/**/*.sh" 
---

# Electron App Conventions

- Treat this repository as an Electron Forge application with plain JavaScript entrypoints. Do not introduce TypeScript, React, or backend/frontend architecture assumptions unless the task explicitly requires them.
- Keep process boundaries intact: main-process behavior belongs in `src/index.js`, renderer DOM logic in `src/renderer.js`, preload bridge code in `src/preload.cjs`, and shared helpers in `src/utils/`.
- Preserve the existing module split: ESM in `.js` files and CommonJS only where the repo already requires `.cjs`.
- Prefer small helper extraction in `src/utils/` over growing large mixed-responsibility blocks in main or renderer files.
- When changing IPC or conversion flows, update both sides of the bridge coherently and verify payload shapes stay aligned.
- If repository documentation conflicts with the running code or `package.json`, trust the codebase and call out stale docs explicitly instead of following the outdated document.
- For verification, prefer checks that exist in this repo today. Do not claim lint coverage from `npm run lint`, because it is currently a placeholder rather than a real lint step.
