# TerminCard Figma Live Bridge

A GitHub-ready university demo for **Figma in component-based development**.

The project demonstrates a technical Figma-to-web bridge:

```txt
Figma plugin -> local bridge server -> browser-demo/design-tokens.css + design-tokens.json -> browser preview
```

## What it proves

Figma should not decide whether a real appointment is available. That is application/backend data.

But Figma can define the component model:

- allowed states: `available`, `waitlist`, `full`
- token pairs: background + text color per state
- component naming and status mapping
- implementation-ready CSS variables

The bridge exports these design decisions into the web project so the browser demo can use them as real CSS variables.

## Project structure

```txt
browser-demo/
  index.html              Browser demo page
  styles.css              Component styling
  script.js               Browser status switching + token polling
  design-tokens.css       Generated CSS token file
  design-tokens.json      Generated token data

figma-plugin/
  manifest.json           Figma plugin manifest
  code.js                 Figma canvas logic
  ui.html                 Plugin panel UI

bridge-server/
  server.js               Local localhost bridge server


## Run the project

```bash
npm install
npm start
```

Open the browser demo:

```txt
http://localhost:5173
```

Check the bridge server:

```txt
http://localhost:3001/health
```

## Figma setup

1. Open Figma Desktop.
2. Open a design file.
3. Go to `Plugins > Development > Import plugin from manifest...`.
4. Select `figma-plugin/manifest.json`.
5. Run `TerminCard Live Bridge`.
6. Click `1 · Drei Figma-Cards erzeugen`.
7. Select a TerminCard on the canvas.
8. Use `Verfügbar`, `Warteliste`, or `Ausgebucht` to set the selected card to a defined component state.
9. Change one or more token pairs in section 3.
10. Click `4 · Sync token pairs to Web Demo`.
11. Watch the browser demo update.

## Demo explanation

The Figma status buttons set the selected card to one of the three defined component states. This keeps the demo focused: select a card, choose its state, then sync the related token pairs into the web project.

The token section is grouped into explicit pairs:

- Available token pair: background + text
- Waitlist token pair: background + text
- Full token pair: background + text

When you click sync, the bridge server writes the token values into:

```txt
browser-demo/design-tokens.css
browser-demo/design-tokens.json
```

The browser demo reads those values and applies them as CSS variables.

## Troubleshooting

If the browser does not update:

1. Keep `npm start` running.
2. Open `http://localhost:3001/health`. It should return JSON.
3. After clicking sync in Figma, open `browser-demo/design-tokens.json` in VS Code and check whether `generatedAt` changed.
4. In the browser, click `Reload synced tokens now`.
5. If Figma cannot reach the bridge, re-import `figma-plugin/manifest.json`; the manifest includes development network access for localhost.


## Token preview on selected Figma card

When a generated TerminCard is selected in Figma, changing a token pair in the plugin immediately previews the active status token on that selected Figma card. The actual codebase changes only after pressing **Sync token pairs to Web Demo**, which writes `browser-demo/design-tokens.css` and `browser-demo/design-tokens.json`.
