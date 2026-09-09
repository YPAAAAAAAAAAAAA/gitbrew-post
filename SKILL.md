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
https://raw.githubusercontent.com/YPAAAAAAAAAAAAA/gitbrew-post/main/SKILL.md
https://raw.githubusercontent.com/YPAAAAAAAAAAAAA/gitbrew-post/main/protocol.mjs
https://raw.githubusercontent.com/YPAAAAAAAAAAAAA/gitbrew-post/main/post.mjs
https://raw.githubusercontent.com/YPAAAAAAAAAAAAA/gitbrew-post/main/examples/phone-dot/play.html
https://raw.githubusercontent.com/YPAAAAAAAAAAAAA/gitbrew-post/main/examples/square-tile/play.html
```

```
curl -fsSL https://gitbrew-cdn.b-cdn.net/skills/gitbrew-post/protocol.mjs -o /tmp/gitbrew-protocol.mjs
curl -fsSL https://gitbrew-cdn.b-cdn.net/skills/gitbrew-post/post.mjs -o /tmp/gitbrew-post.mjs
```

GitHub `raw.githubusercontent.com/.../main/` can lag. Prefer the CDN (or `cdn.jsdelivr.net/gh/YPAAAAAAAAAAAAA/gitbrew-post@main/...`).

## Where GitBrew is

`GITBREW_URL` is the GitBrew that runs `creators.publish` — the site whose feed will show the post. If this file is served from that host at `/skills/gitbrew-post/SKILL.md`, that host is `GITBREW_URL` (the origin of **this skill file**). If you fetched this pack from GitHub or a CDN, those hosts are **not** GitBrew. Pass `--url` of the real GitBrew.

Do not invent localhost. Do not post at the agent's laptop unless that laptop **is** the GitBrew they opened. `post.mjs` refuses loopback (`localhost`, `127.0.0.1`, `::1`) and pack hosts (GitHub raw, `b-cdn.net`, `r2.dev`) unless `GITBREW_ALLOW_LOCAL=1` on the GitBrew host itself.

`GITHUB_TOKEN` is already how you talk to GitHub. Reuse it. They connect GitHub once in the app so they can open their page. You do not need that cookie.

## Done (sandbox-green)

Tap-in plays the **official demo as the official demo**. A bright canvas, `_ready`, `playable-ready`, or a screenshot of the subject is not done.

GitBrew `validateUserPostFiles` is the lock. Run it locally, then POST. If publish returns `BAD_REQUEST`, the message is a protocol error — fix the house, do not bypass.

Do not land ids in GitBrew `USER_POSTS` source or `SANDBOX_ALLOWLIST`. Publish writes `/user-play/u-{login}-{id}/`. Cover is **390×844** `cover.webp` (png ok) + muted `cover.mp4` in the house folder — `post.mjs` ships them; they are **not** `officialFiles`. Missing cover falls back to the GitHub OG of **their** repo. Host iframe **is** the aspect box (phone `390 / 844` island `max-height: 120vw`; square `1 / 1` island `max-height: 100vw`). `fill` is EXE HUD only — do not stretch the play page to 100vh to "fill the phone".

## House (whatever project)

In **this** repo, one folder (the `--dir`). Same shape for a canvas toy, a WebGL demo, or a game.

1. **Copy then adapt.** Paste official `index.html` + its js/css/sprites into `vendor/` first. Play HTML is that official HTML with the smallest GitBrew patches. Keep official ids (`canvas`, `#stage`, `#messageBox`). Do not write a new runner (`showRunner(`, `gbRebuildHud`, `width: 100% !important`).
2. **Ready.** `<script src="/sandbox/_ready.js">` — GitBrew host path, not a path inside the agent repo. Do not boot `html,body { opacity:0 }`. Do not `display:none` `canvas` / `#scene`.
3. **Local only.** Relative `./vendor/…`. No `https://` stylesheets, scripts, fonts (Google Fonts / Typekit), iframes, or import maps. No `location.replace`. Vendor remote engines; do not link CDN copies. Play HTML must be the leaf.
4. **Ratio.** `aspect` is `phone` (390 / 844, default) or `square` (1 / 1). Size the world from viewport **width**. `html,body { height:100%; overflow:hidden }`. No `innerHeight/16`, no `height:100vh` + `min-width:100vw`, no `100vw`×`100vh` on canvas without `aspect-ratio`, no `object-fit:fill`. Square stage is `aspect-ratio: 1` or `min(100cqw, 100cqh)`, centered. Cover on the feed stays phone-tall even when play is square.
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

Put `cover.webp` + muted `cover.mp4` (both **390×844**, no controls) next to `play.html`. Do not list them in `officialFiles`.

Limits: play HTML ≤ 2M chars; each official file ≤ 2M chars (official `three.min.js` is expected); all play files together ≤ 20M; ≤ 40 official files. Images/audio/wasm: keep them relative under `vendor/` and referenced by basename from play HTML (utf8 text files — inline small assets as data URIs when the official demo already does).

Dock sibling (when the official demo has a panel):

```css
html, body { height: 100%; margin: 0; overflow: hidden; }
body { display: flex; flex-direction: column; }
#stage { flex: 1 1 auto; min-height: 0; display: block; }
#dock { flex: 0 0 auto; }
```

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

GitBrew stores the play files, puts the post on the feed, tags it with that login. `postId` is `u-{login}-{id}`. Same id + same owner overwrites.

```
GITHUB_TOKEN=… node /tmp/gitbrew-post.mjs edit \
  --url "$GITBREW_URL" \
  --post u-theirlogin-my-dot \
  --title-en "Dot" --title-zh "Dot" \
  --intro-en "…" --intro-zh "…"
```

List theirs: `node /tmp/gitbrew-post.mjs mine --url "$GITBREW_URL"`.
