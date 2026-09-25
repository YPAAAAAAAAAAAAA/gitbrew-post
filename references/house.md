# House

Tap-in plays the **official demo as the official demo**. A bright canvas, `_ready`, `playable-ready`, or a screenshot of the subject is not done.

In **this** repo, one folder (`--dir`).

**Repo law.** The post id **is the repo name**, slugified (lowercase, `-` for anything else, ≤32 chars). `manifest.json` `id` must equal the slug of `githubRepo` / `gitlabRepo`, and `--repo` must be that same repo. A mismatch is a protocol error: `post id must be the repo name`. There is no wrong-repo publish.

1. **Copy then adapt.** Paste official `index.html` + its js/css/sprites into `vendor/` first. Play HTML is that official HTML with the smallest GitBrew patches. Keep official ids (`canvas`, `#stage`, `#messageBox`). Do not write a new runner (`showRunner(`, `gbRebuildHud`, `width: 100% !important`). Do not change official visual defaults (`args.seg = 16`, empty `filter()`). Pixel-equivalent loops (skip `a===0`, `putImageData`) are allowed.
2. **Ready (hard).** Load `/sandbox/_ready.js`. Cold `playable-ready` must fire within **2000 ms** on the phone stage (390×844). Empty stage, gray canvas, and the host 14s fallback are not ready. Static `protocol.mjs check` covers size/structure; **publish runs a cloud ready simulator** and rejects if ready > 2000 ms.


3. **Local only.** Relative `./vendor/…`. No `https://` stylesheets, scripts, fonts (Google Fonts / Typekit), iframes, or import maps. No `location.replace`. Play HTML must be the leaf.
4. **Ratio.** `aspect` is `phone` (390 / 844, default) or `square` (1 / 1). Size the world from viewport **width**. `html,body { height:100%; overflow:hidden }`. No `innerHeight/16`, no `height:100vh` + `min-width:100vw`, no `object-fit:fill`. Square stage is `aspect-ratio: 1` or `min(100cqw, 100cqh)`, centered. Cover on the feed stays phone-tall even when play is square. Host iframe **is** the aspect box (phone island `max-height: 120vw` = `PLAY_ISLAND_VW` 1.2; square `max-height: 100vw`). **Hard skill rule — machine-enforced** by `protocol.mjs` / JEV as `area-limit`. `fill` is EXE HUD only.
5. **Composition.** Stage first, chrome on the edge. `viewport-fit=cover`. Do not `env(safe-area-inset-*)` inside the iframe. A dock (`#dock`, `.gb-dock`) is a **sibling** under the stage (`flex-direction: column`), not `position:fixed; inset:0`. Coupled surfaces: `stage + dock ≤ iframe`.
6. **Titles.** `id` is the repo name slugified (`[a-z0-9-]`, 2–32 — see Repo law). Titles bilingual, 1–42 each = the **project name**.

`manifest.json`:

```json
{
  "id": "theirrepo",
  "title": { "en": "Dot", "zh": "Dot" },
  "intro": { "en": "…", "zh": "…" },
  "officialFiles": ["vendor/index.html", "vendor/dot.js", "vendor/dot.css"],
  "playHtml": "play.html",
  "aspect": "phone",
  "githubRepo": "theirlogin/theirrepo"
}
```

GitLab house: same file, `"gitlabRepo": "theirlogin/theirrepo"` instead of `githubRepo`.

Put `cover.webp` (or `cover.png`) + muted `cover.mp4` (both **390×844**, **≥24fps**, no controls) next to `play.html`. Do not list them in `officialFiles`. Cover is the **stage bitmap only**. No GitBrew back chevron, no title, no like/save/share rail, no phone chrome. **Covers are required** — publish rejects missing or blank covers (no GitHub OG fallback). `intro` ≤500 characters per language.

Limits: play HTML ≤ 2M chars; each official file ≤ 2M chars; all play files together ≤ 20M; ≤ 80 official files.

Dock sibling:

```css
html, body { height: 100%; margin: 0; overflow: hidden; }
body { display: flex; flex-direction: column; }
#stage { flex: 1 1 auto; min-height: 0; display: block; }
#dock { flex: 0 0 auto; }
```

Required house artifact: **`SKILL_PROOF.md`** (coding agent proves they read gitbrew-post skill — ready, local vendor, 120vw island, composition). `protocol.mjs check` must print `"ok": true`. Publish returns **JEV:YES** or **JEV:NO** (with every reason). Fail closed:

| error | fix |
| --- | --- |
| `id must be a short slug` | `[a-z0-9-]`, 2–32 |
| `post id must be the repo name` | set `id` to the slug of the repo you are posting from |
| `need official html` / `too thin` | paste real `vendor/index.html` + engine js/css |
| `missing /sandbox/_ready.js` | GitBrew path, not `./_ready.js` |
| `ready-hook` | `#root` posts must load `/sandbox/_ready.js`; cloud gate enforces ready ≤ 2000 ms |
| `remote stylesheet` / `script` / `font` / `widget` | vendor locally |
| `hop` | leaf page, no `location.replace` |
| `demolished house` | no `showRunner(`, `width:100% !important`, `gbRebuildHud`, `args.seg = <n>`, empty `filter()` |
| `camera-landscape` | no `innerHeight/16` |
| `stretch-canvas` | no independent `100vh`+`100vw`, no `object-fit:fill` |
| `square stage must be 1:1` | `aspect-ratio:1` or `min(100cqw,100cqh)` |
| `composition-viewport` | `viewport-fit=cover` |
| `composition-fill` | `html,body { height:100%; overflow:hidden }` |
| `composition-safe-area` | no `env(safe-area-inset-*)` in the iframe |
| `composition-dock` | `#dock` needs `flex-direction: column` |
| `composition-overlay` | no `#overlay`/`#veil`/`.modal` `position:fixed; inset:0` |
| `hide-stage` / `opacity-0 boot` | keep canvas visible |
| `play html is a rebuilt wrapper` | keep official ids |
| `does not reference` | play HTML must include each official js/css basename |
| `title must be bilingual and ≤42` | project name both langs |

Examples: `examples/phone-dot`, `examples/square-tile`.
