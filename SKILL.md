---
name: gitbrew-post
description: Publish or edit a GitBrew post as the human's GitHub account. Copy official files first, check protocol.mjs, then POST with their GitHub token. Use when they say 发帖 / publish to GitBrew / edit GitBrew post.
---

# GitBrew post

You are **their** coding agent. You post to GitBrew. Do not send files to a GitBrew maintainer. Do not pick a repo in the GitBrew app.

Chain: coding agent → `GITHUB_TOKEN` → this skill → post `u-{login}-{slug}` owned by that GitHub login → they (or you) edit.

## Public pack (no login)

These files are public. Fetch them. Do not use the private `gitbrew-app` repo.

```
https://gitbrew.ai/skills/gitbrew-post/SKILL.md
https://gitbrew.ai/skills/gitbrew-post/protocol.mjs
https://gitbrew.ai/skills/gitbrew-post/post.mjs
https://gitbrew.ai/skills/gitbrew-post/examples/phone-dot/play.html
https://gitbrew.ai/skills/gitbrew-post/examples/square-tile/play.html
```

```
curl -fsSL https://gitbrew.ai/skills/gitbrew-post/protocol.mjs -o /tmp/gitbrew-protocol.mjs
curl -fsSL https://gitbrew.ai/skills/gitbrew-post/post.mjs -o /tmp/gitbrew-post.mjs
```

Docs: https://gitbrew.ai/docs. `GITBREW_URL` is **https://gitbrew.ai**. Set `GITBREW_URL=https://gitbrew.ai`.

## Where GitBrew is

`GITBREW_URL` is **https://gitbrew.ai** — the GitBrew that runs `creators.publish`. If this file is served from that host at `/skills/gitbrew-post/SKILL.md`, that host is `GITBREW_URL`. If you fetched this pack from GitHub, that host is **not** GitBrew. Pass `--url https://gitbrew.ai`.

Do not invent localhost. Do not post at the agent's laptop unless that laptop **is** the GitBrew they opened. `post.mjs` refuses loopback (`localhost`, `127.0.0.1`, `::1`) and pack hosts (GitHub raw, `b-cdn.net`, `r2.dev`) unless `GITBREW_ALLOW_LOCAL=1` on the GitBrew host itself.

`GITHUB_TOKEN` is already how you talk to GitHub. Reuse it. `GITBREW_TOKEN` from https://gitbrew.ai/me → Generate token also works as `Authorization: Bearer`. They connect GitHub once in the app so they can open their page. You do not need that cookie.

## Done (sandbox-green)

Tap-in plays the **official demo as the official demo**. A bright canvas, `_ready`, `playable-ready`, or a screenshot of the subject is not done.

GitBrew `validateUserPostFiles` is the lock. Run it locally, then POST. If publish returns `BAD_REQUEST`, the message is a protocol error — fix the house, do not bypass.

Do not land ids in GitBrew `USER_POSTS` source or `SANDBOX_ALLOWLIST`. Publish writes `/user-play/u-{login}-{id}/`. Cover is **390×844** `cover.webp` (png ok) + muted `cover.mp4` in the house folder — `post.mjs` ships them; they are **not** `officialFiles`. Missing cover falls back to the GitHub OG of **their** repo. Play **island** (in-app stage / protocol publish) is the aspect box (phone `390 / 844` island `max-height: 120vw` = `PLAY_ISLAND_VW` 1.2; square `1 / 1` island `max-height: 100vw`). This is a **hard skill rule** and is **machine-enforced** by `protocol.mjs` / JEV (`aspect` / `area-limit`). Web `/preview/<id>` is the **3js device + in-app tap-in chrome + that post's play.html** in a 120vw island (`protocol.mjs` `check-preview`, marker `PREVIEW_DEVICE_TAPIN_MARKER`). It is not the GitBrew app. `fill` is EXE HUD only — do not stretch the play page to 100vh to "fill the phone".

## House (whatever project)

In **this** repo, one folder (the `--dir`). Same shape for a canvas toy, a WebGL demo, or a game.

1. **Copy then adapt.** Paste official `index.html` + its js/css/sprites into `vendor/` first. Play HTML is that official HTML with the smallest GitBrew patches. Keep official ids (`canvas`, `#stage`, `#messageBox`). Do not write a new runner (`showRunner(`, `gbRebuildHud`, `width: 100% !important`).
2. **Ready.** `<script src="/sandbox/_ready.js">` — GitBrew host path, not a path inside the agent repo. Do not boot `html,body { opacity:0 }`. Do not `display:none` `canvas` / `#scene`.
3. **Local only.** Relative `./vendor/…`. No `https://` stylesheets, scripts, fonts (Google Fonts / Typekit), iframes, or import maps. No `location.replace`. Vendor remote engines; do not link CDN copies. Play HTML must be the leaf.
4. **Ratio (hard).** `aspect` is `phone` (390 / 844, default) or `square` (1 / 1). Size the world from viewport **width**. `html,body { height:100%; overflow:hidden }`. No `innerHeight/16`, no `height:100vh` + `min-width:100vw`, no `100vw`×`100vh` on canvas without `aspect-ratio`, no `object-fit:fill`. Square stage is `aspect-ratio: 1` or `min(100cqw, 100cqh)`, centered. Cover on the feed stays phone-tall even when play is square. Host iframe **is** the play island: phone **`max-height: 120vw`** (`PLAY_ISLAND_VW = 1.2` in `protocol.mjs` / app `play-hit-band.ts`); square **`max-height: 100vw`**. `protocol.mjs check --island-w W --island-h H` and publish **machine-enforce** island height ≤ `PLAY_ISLAND_VW × width` (±1%). Full-OLED fill fails `area-limit`. `fill` is EXE HUD only — do not stretch the play page to 100vh to "fill the phone".
5. **Composition.** Stage first, chrome on the edge. `viewport-fit=cover`. Do not `env(safe-area-inset-*)` inside the iframe (the host already clears HUD + home indicator). A dock/panel (`#dock`, `.gb-dock`) is a **sibling** under the stage (`flex-direction: column`), not `position:fixed; inset:0` over the canvas. Coupled surfaces share one box: `stage + dock ≤ iframe`. Do not overlay a veil/modal on the bitmap.
6. **Titles.** `id` is `[a-z0-9-]`, 2–32 chars. Titles bilingual, 1–42 each = the **project name** (official `<title>` / short README H1), not a category summary.

`manifest.json`:

```json
{
  "id": "my-dot",
  "title": { "en": "Dot", "zh": "Dot" },
  "intro": { "en": "…", "zh": "…" },
  "officialFiles": ["vendor/index.html", "vendor/dot.js", "vendor/dot.css"],
  "playHtml": "play.html",
  "aspect": "phone",
  "githubRepo": "theirlogin/theirrepo"
}
```

Put `cover.webp` + muted `cover.mp4` (both **390×844**, **≥24fps**, no controls) next to `play.html`. Do not list them in `officialFiles`. Cover is the **stage bitmap only** — record the play canvas. No GitBrew back chevron, no title, no like/save/share rail, no phone chrome. A screenshot of the GitBrew shell is not a cover. `intro` is free text, ≤500 characters per language.

Limits: play HTML ≤ 2M chars; each official file ≤ 2M chars (official `three.min.js` is expected); all play files together ≤ 20M; ≤ 80 official files; intro ≤500 per language. Images/audio/wasm: keep them relative under `vendor/` and referenced by basename from play HTML (utf8 text files — inline small assets as data URIs when the official demo already does).

Dock sibling (when the official demo has a panel):

```css
html, body { height: 100%; margin: 0; overflow: hidden; }
body { display: flex; flex-direction: column; }
#stage { flex: 1 1 auto; min-height: 0; display: block; }
#dock { flex: 0 0 auto; }
```


## Skill proof (hard — fail closed)

Coding agents **must read** this skill (and `references/house.md`) and leave a short write-up in the house folder:

**File:** `SKILL_PROOF.md` (next to `play.html` / `manifest.json`)

**Shape (minimum):**

```markdown
# Skill proof

I read gitbrew-post SKILL.md (hard request).

- ready: /sandbox/_ready.js; playable-ready ≤2000ms
- local vendor: relative ./vendor only; no remote css/js/font
- ratio/island: phone max-height 120vw (PLAY_ISLAND_VW=1.2); html,body height 100%
- composition: viewport-fit=cover; overflow:hidden; dock as sibling
```

`protocol.mjs check` and publish reject missing/empty/incomplete proofs (`skill-proof …` → JEV unit `skill_proof`).

## Protocol lock

`node /tmp/gitbrew-protocol.mjs check --dir ./the-post-folder` must print `"ok": true` before publish. Same function GitBrew runs (`validateUserPostFiles`). Fail closed:

| error | fix |
| --- | --- |
| `id must be a short slug` | `[a-z0-9-]`, 2–32 |
| `need official html` / `too thin` | paste real `vendor/index.html` + engine js/css, not a stub |
| `missing /sandbox/_ready.js` | GitBrew path, not `./_ready.js` |
| `remote stylesheet` / `script` / `font` / `widget` | vendor locally |
| `hop` | leaf page, no `location.replace` |
| `demolished house` | no `showRunner(`, `width:100% !important`, `gbRebuildHud` |
| `camera-landscape` | no `innerHeight/16` |
| `stretch-canvas` | no independent `100vh`+`100vw`, no `object-fit:fill` |
| `area-limit` | play island height ≤ `PLAY_ISLAND_VW`×width (phone **1.2 / 120vw**). Full-OLED fill fails. `check-island --w --h` |
| `skill-proof missing` / `empty` / `incomplete` | add `SKILL_PROOF.md` citing ready, local vendor, 120vw island, composition |
| `square stage must be 1:1` | `aspect-ratio:1` or `min(100cqw,100cqh)` |
| `composition-viewport` | `viewport-fit=cover` |
| `composition-fill` | `html,body { height:100%; overflow:hidden }` |
| `composition-safe-area` | no `env(safe-area-inset-*)` in the iframe |
| `composition-dock` | `#dock` needs `flex-direction: column` |
| `composition-overlay` | no `#overlay`/`#veil`/`.modal` `position:fixed; inset:0` |
| `hide-stage` / `opacity-0 boot` | keep canvas visible, do not boot at opacity 0 |
| `play html is a rebuilt wrapper` | keep official ids; play is the official page |
| `does not reference` | play HTML must include each official js/css basename |
| `title must be bilingual and ≤42` | project name both langs |

## JEV checklist units

Publish returns agent feedback as `JEV:YES` or `JEV:NO` with named units. On `JEV:NO`, every failed unit is listed with the specific faulty protocol line:

```
JEV:NO
- [ready_hook] missing /sandbox/_ready.js
- [title] title must be bilingual and ≤42
```

Units (exact ids):

| unit | covers |
| --- | --- |
| `id` | slug / repo-name match |
| `official_files` | need official html/js/css, thin, too many, bad path, size |
| `play_html` | missing/too large, wrapper, does not reference, hop, demolish, hide-stage, opacity-0 |
| `ready_hook` | missing `/sandbox/_ready.js` |
| `remote` | remote stylesheet/script/font/widget |
| `aspect` | camera-landscape, stretch-canvas, square stage, **area-limit (PLAY_ISLAND_VW 1.2 / 120vw)** |
| `composition` | composition-* |
| `title` | bilingual title/intro limits |
| `cover` | cover still/loop blank, size, dims |
| `ready` | playable-ready probe / readyMs |
| `skill_proof` | `SKILL_PROOF.md` write-up proving gitbrew-post skill was read |
| `cdn` | R2/Bunny upload failures |

On success: `JEV:YES (units=N/N readyMs=… cdn=…)`.

## Examples


Copy the shape. Do not invent a thinner house.

Phone (390 / 844) — official HTML + engine, play is that page plus `_ready.js`:

```
https://raw.githubusercontent.com/YPAAAAAAAAAAAAA/gitbrew-post/main/examples/phone-dot/manifest.json
https://raw.githubusercontent.com/YPAAAAAAAAAAAAA/gitbrew-post/main/examples/phone-dot/play.html
https://raw.githubusercontent.com/YPAAAAAAAAAAAAA/gitbrew-post/main/examples/phone-dot/vendor/index.html
https://raw.githubusercontent.com/YPAAAAAAAAAAAAA/gitbrew-post/main/examples/phone-dot/vendor/dot.js
https://raw.githubusercontent.com/YPAAAAAAAAAAAAA/gitbrew-post/main/examples/phone-dot/vendor/dot.css
```

Square (1 / 1) — stage `aspect-ratio: 1` / `min(100cqw, 100cqh)`, centered:

```
https://raw.githubusercontent.com/YPAAAAAAAAAAAAA/gitbrew-post/main/examples/square-tile/manifest.json
https://raw.githubusercontent.com/YPAAAAAAAAAAAAA/gitbrew-post/main/examples/square-tile/play.html
https://raw.githubusercontent.com/YPAAAAAAAAAAAAA/gitbrew-post/main/examples/square-tile/vendor/index.html
https://raw.githubusercontent.com/YPAAAAAAAAAAAAA/gitbrew-post/main/examples/square-tile/vendor/tile.js
https://raw.githubusercontent.com/YPAAAAAAAAAAAAA/gitbrew-post/main/examples/square-tile/vendor/tile.css
```

Fail closed (do not copy): a stub `<canvas>` plus `var x=1`, a `showRunner` wrapper, remote CSS, a hop `location.replace`, or play HTML that drops official ids.

## Check then publish

```
node /tmp/gitbrew-protocol.mjs check --dir ./the-post-folder
```

Must be `"ok": true`. Then `githubRepo` must be `owner/name` **this GitHub user owns** (`--repo` or `manifest.githubRepo`). Naming a login is not enough — you need their `GITHUB_TOKEN`.

```
GITHUB_TOKEN=… node /tmp/gitbrew-post.mjs publish \
  --url "$GITBREW_URL" \
  --repo theirlogin/theirrepo \
  --dir ./the-post-folder
```

GitBrew stores the play files, puts the post on the feed, tags it with that login. `postId` is `u-{login}-{id}`. Same id + same owner overwrites. Public preview is always `https://gitbrew.ai/preview/<postId>` (or `$GITBREW_URL/preview/<postId>`). Never the Zeabur host.

**Your job is the inside.** Ship `play.html` + `vendor/` + `cover.webp`/`cover.mp4`. GitBrew already supplies the 3js device frame, tap-in chrome (exit / made by / title / save-share), cover slot, and More GitHub sheet. Do not rebuild those.

**Preview (machine truth = `protocol.mjs check-preview`):**
- 3js iPhone/iPad glass + **in-app tap-in chrome** (testids `sandbox-exit`, `sandbox-uploader`, `sandbox-topic`, `sandbox-topic-title`, `sandbox-top-right`, `sandbox-more`) + **the published `play.html`** in a 120vw island. Upper chrome sits under the Dynamic Island (`--safe-top`, same 10px + 44px title band as the app). No GitBrew app boot, no corkscrew, no feed, no MagSafe `CylinderGeometry`.
- Marker is `PREVIEW_DEVICE_TAPIN_MARKER` in `protocol.mjs` (live: `3js-device-css3d-drag`). **CSS3D only.** `CSS3DObject(screenHost)` is the iPhone-Simulator glass: `.screen-host` and the iframe are `pointer-events:auto` so you drag the inner page. `#css3d` is `none` so the void still orbits. No 2D overlay.
- **More** = live github.com repo page through `/preview/_gh/` (repo chrome + assets + README, not a README-only fragment) + `kGBPolishAndAnchorJS` from `GitHubBrowser.mm` (scrolls to README). For a catalog toy the GitHub URL is the official house repo, not a test fork.
- `check-preview --url https://gitbrew.ai/preview/<postId>` must print `"ok": true`. That is **not** JEV.
- Publish still needs **`JEV:YES` with 12/12 units**, `readyMs` ≤ 2000, 120vw area-limit, `skill_proof`. A protocol `check` alone is not done.
- `intro` is set at publish only (`≤500` chars/lang). Not edited on the phone via More.

Edit title/intro on their creator page or with `post.mjs edit`.

```
GITHUB_TOKEN=… node /tmp/gitbrew-post.mjs edit \
  --url "$GITBREW_URL" \
  --post u-theirlogin-my-dot \
  --title-en "Dot" --title-zh "Dot" \
  --intro-en "…" --intro-zh "…"
```

List theirs: `node /tmp/gitbrew-post.mjs mine --url "$GITBREW_URL"`.
