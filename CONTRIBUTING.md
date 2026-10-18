# Contributing to DroidBridge

## Setup

```bash
git clone https://github.com/Lusan-sapkota/DroidBridge.git
cd DroidBridge
npm install
```

Press F5 in VS Code to launch an Extension Development Host with DroidBridge loaded.

## Commands

| Command | What it does |
|---------|--------------|
| `npm run compile` | Type check, lint and build to `dist/` |
| `npm run watch` | Rebuild on change |
| `npm test` | Run the test suite in a VS Code test instance |
| `npm run lint` | Lint `src/` |
| `npx vsce package` | Build `droidbridge-<version>.vsix` |

## Layout

- `src/extension.ts` activation and wiring
- `src/managers/` ADB, scrcpy, binaries, commands, device tracking, mirror session
- `src/providers/` sidebar webview, mirror controller, MCP registration
- `src/mcp/` standalone MCP server bundled to `dist/mcp-server.js` (must not import `vscode`)
- `media/` webview scripts, styles and icons
- `resources/scrcpy-server` official scrcpy server matching `SERVER_VERSION` in `src/managers/mirrorSession.ts`
- `docs/` the documentation site, served by GitHub Pages

## Releasing

1. Bump `version` in `package.json` and add a `CHANGELOG.md` entry.
2. `npm test`, then `npx vsce package`.
3. Install the `.vsix` locally and check the mirror and MCP setup on a device.
4. Upload the `.vsix` to the VS Code Marketplace and Open VSX (`npx ovsx publish <file> -p <token>`).
5. Tag the release: `git tag -a vX.Y.Z -m "DroidBridge X.Y.Z" && git push origin vX.Y.Z`, then create a GitHub release with the `.vsix` attached.

## Pull requests

Keep changes focused, include a test for new logic, and run `npm test` before opening the PR.
