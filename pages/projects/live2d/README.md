# live2d.mk — bring-your-own Live2D stage + look maker

One browser tool for **any** Cubism 3/4/5 Live2D model. It ships **only renderer
code** — you load your own model folder; nothing is uploaded anywhere.

- **stage.html** — viewer / VTuber stage **+ built-in look maker**. Load your model,
  stack any expressions (face / outfit / avatar / tail — all of them, like VTube
  Studio), play motions, track your face, and use it as an OBS Browser Source. When
  the folder includes a `.cdi3.json`, a **look maker** panel appears: restyle the
  model's customization parameters live and export a `.exp3.json` save-state.
- **maker.html** — *deprecated*; the look maker is now built into stage.html, so this
  page just redirects there.

## Face tracking

**Webcam (zero setup):** works right in the browser via MediaPipe — just pick
"Webcam" and turn it on.

**OpenSeeFace (better tracking, local only):**
1. Get OpenSeeFace: <https://github.com/emilianavt/OpenSeeFace/releases/latest>
   Run its tracker so it sends to `127.0.0.1:11573`:
   ```
   python facetracker.py --capture 0 --ip 127.0.0.1 --port 11573
   ```
2. From your copy of this repo, run the bridge (no dependencies):
   ```
   node pages/projects/live2d/osf_bridge.js
   ```
3. Open **http://localhost:8080/pages/projects/live2d/stage.html**, choose source
   **OpenSeeFace**, turn it on.

> A page served over `https://` (e.g. GitHub Pages) **cannot** reach a local
> `ws://` socket — browsers block it. That's why OpenSeeFace needs the page opened
> from the bridge on `http://localhost`. The hosted version is webcam-only.

## OBS
Add **stage.html** as a Browser Source, turn the **preview backdrop OFF** for
transparency, and press **H** to hide the controls.
