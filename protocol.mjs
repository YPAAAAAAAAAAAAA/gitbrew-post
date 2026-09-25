#!/usr/bin/env node
/**
 * Sandbox-green lock for creator posts. Same gate GitBrew runs on publish.
 *   node protocol.mjs check --dir ./the-post-folder
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const HOST_ASPECT = { phone: "390 / 844", square: "1 / 1" };

/** Official engines (three.min.js) are expected. Pack law is 20MB reachable play. */
export const MAX_OFFICIAL_FILE_CHARS = 2_000_000;
export const MAX_PLAY_HTML_CHARS = 2_000_000;
export const MAX_OFFICIAL_FILES = 80;
export const MAX_POST_CHARS = 20_000_000;
export const MAX_INTRO_CHARS = 500;
export const MIN_COVER_FPS = 24;
export const COVER_WIDTH = 390;
export const COVER_HEIGHT = 844;

/** Max ms from navigation to playable-ready (hub ready unit). */
export const MAX_READY_MS = 2000;

/** Same number as client `PLAY_ISLAND_VW` — phone play island max-height / width. */
export const PLAY_ISLAND_VW = 1.2;
/** Square island max-height / width (host `max-height: 100vw`). */
export const SQUARE_ISLAND_VW = 1.0;
/** Relative tolerance for island height checks (~1%). */
export const PLAY_ISLAND_TOLERANCE = 0.01;

export function playIslandVw(aspect) {
  return parseAspect(aspect) === "square" ? SQUARE_ISLAND_VW : PLAY_ISLAND_VW;
}

/** Max play-island height in CSS px for a given width (protocol / app SoT). */
export function maxPlayIslandHeight(width, aspect = "phone") {
  const w = Number(width);
  if (!(w > 0)) return 0;
  return playIslandVw(aspect) * w;
}

/**
 * Assert play or preview-host island size respects PLAY_ISLAND_VW.
 * Full-glass fill (height ≈ glassHeight ≫ island max) fails.
 * @returns {{ ok: true, maxHeight: number } | { ok: false, error: string, maxHeight: number }}
 */
export function checkPlayIslandSize(input) {
  const width = Number(input?.width);
  const height = Number(input?.height);
  const aspect = parseAspect(input?.aspect);
  const glassHeight = input?.glassHeight != null ? Number(input.glassHeight) : undefined;
  const maxHeight = maxPlayIslandHeight(width, aspect);
  const limit = maxHeight * (1 + PLAY_ISLAND_TOLERANCE);
  const vw = playIslandVw(aspect);
  const label = aspect === "square" ? "100vw" : `${PLAY_ISLAND_VW * 100}vw`;
  if (!(width > 0) || !(height >= 0) || Number.isNaN(height)) {
    return {
      ok: false,
      maxHeight,
      error: `area-limit: invalid play island size ${width}x${height}`,
    };
  }
  if (height > limit) {
    return {
      ok: false,
      maxHeight,
      error: `area-limit: play island ${Math.round(width)}x${Math.round(height)} exceeds ${label} (max ${maxHeight.toFixed(1)}px, PLAY_ISLAND_VW=${vw})`,
    };
  }
  if (
    glassHeight != null &&
    Number.isFinite(glassHeight) &&
    glassHeight > maxHeight * (1 + PLAY_ISLAND_TOLERANCE) &&
    height >= glassHeight * (1 - PLAY_ISLAND_TOLERANCE)
  ) {
    return {
      ok: false,
      maxHeight,
      error: `area-limit: play fills glass ${Math.round(glassHeight)}px > island max ${maxHeight.toFixed(1)}px (${label})`,
    };
  }
  return { ok: true, maxHeight };
}

/** Preview/host island CSS px: min(glassH, round(width * PLAY_ISLAND_VW)). */
export function previewIslandHeight(logicalW, logicalH, aspect = "phone") {
  const maxH = maxPlayIslandHeight(logicalW, aspect);
  return Math.min(Number(logicalH) || 0, Math.round(maxH));
}

/**
 * Static gate on preview-host HTML or server source.
 *
 * 3js phone + in-app tap-in chrome + play.html in a 120vw island.
 * Not the GitBrew app. Not a full-OLED iframe. No CylinderGeometry.
 */
export function assertPreviewHostAreaLimit(html) {
  const errors = [];
  const src = String(html ?? "");
  if (/preview-fullbleed-tapin-v1/.test(src) && !/WebGLRenderer|THREE\.Scene|GridHelper|3js-device/i.test(src)) {
    errors.push("area-limit: full-bleed-only /preview is rejected — need 3js device + tap-in chrome");
    return errors;
  }
  if (/CylinderGeometry/.test(src)) {
    errors.push("area-limit: MagSafe/CylinderGeometry dock forbidden (nobase)");
  }
  if (/\/preview\/_app\/\?gbPost=/.test(src)) {
    errors.push("area-limit: preview glass must be the post play.html, not the GitBrew app");
  }
  if (!/\/user-play\//.test(src) || !/play\.html/.test(src)) {
    errors.push("area-limit: preview host must embed /user-play/<id>/play.html in the glass");
  }
  if (!/ds-made-by/.test(src) || !/sandbox-more/.test(src)) {
    errors.push("area-limit: preview host must draw in-app tap-in chrome (made by + More)");
  }
  if (!/120cqw|PLAY_ISLAND_VW|120vw/.test(src)) {
    errors.push("area-limit: preview play island must cap at 120vw");
  }
  if (/gb-glass-2d|pinGlass2d|cssMatrix3d/.test(src)) {
    errors.push("area-limit: CSS3D glass only — no 2D overlay");
  }
  if (!/CSS3DObject/.test(src)) {
    errors.push("area-limit: CSS3DObject(screenHost) is the glass");
  }
  return errors;
}

/** House artifact: coding agent must prove they read gitbrew-post skill (hard rules). */

/** Live web /preview host marker (3js device + real app iframe). Not a JEV unit — separate check-preview. */
export const PREVIEW_DEVICE_TAPIN_MARKER = "3js-device-css3d-drag";
/** More → native GitHub sheet port: the hub passes the live github.com page through here. */
export const PREVIEW_GH_PASSTHROUGH_PREFIX = "/preview/_gh/";
/** Single source of truth for the sheet's polish/anchor pass (the app's native sheet). */
export const PREVIEW_GH_POLISH_MM = "src-tauri/gen/apple/Sources/gitbrew/GitHubBrowser.mm";
/** Deploy ZIP copy — Zeabur skips src-tauri; hub reads this if the repo path is missing. */
export const PREVIEW_GH_SHIPPED_MM = "server/preview-host/native/GitHubBrowser.mm";
export const PREVIEW_GH_POLISH_NAME = "kGBPolishAndAnchorJS";

/**
 * Decode `static NSString *const <name> = @"…" "…";` from Objective-C source (adjacent literals
 * concatenated, C escapes decoded). Same decoder as server/preview-host/github-sheet.ts.
 */
export function extractObjcStringConst(src, name) {
  const m = new RegExp(`static\\s+NSString\\s*\\*\\s*const\\s+${name}\\s*=`).exec(String(src || ""));
  if (!m) throw new Error(`${name} not found`);
  let i = m.index + m[0].length;
  let out = "";
  let literals = 0;
  const n = src.length;
  const esc = { '"': '"', "\\": "\\", "'": "'", n: "\n", t: "\t", r: "\r", "?": "?" };
  for (;;) {
    while (i < n) {
      if (/\s/.test(src[i])) i++;
      else if (src.startsWith("//", i)) { const e = src.indexOf("\n", i); i = e < 0 ? n : e + 1; }
      else if (src.startsWith("/*", i)) { const e = src.indexOf("*/", i + 2); if (e < 0) throw new Error(`${name}: unterminated comment`); i = e + 2; }
      else break;
    }
    if (i >= n) throw new Error(`${name}: unexpected end of source`);
    if (src[i] === ";") break;
    if (src[i] === "@" && src[i + 1] === '"') i++;
    if (src[i] !== '"') throw new Error(`${name}: expected string literal at offset ${i}`);
    i++;
    for (;;) {
      if (i >= n) throw new Error(`${name}: unterminated literal`);
      const c = src[i];
      if (c === '"') { i++; break; }
      if (c === "\n") throw new Error(`${name}: newline inside literal`);
      if (c === "\\") {
        const e = src[i + 1];
        if (!(e in esc)) throw new Error(`${name}: unsupported escape \\${e}`);
        out += esc[e];
        i += 2;
        continue;
      }
      out += c;
      i++;
    }
    literals++;
  }
  if (!literals || !out) throw new Error(`${name}: empty`);
  return out;
}

/** Local GitHubBrowser.mm (repo checkout) for the byte-for-byte polish check, or "". */
export function findGithubBrowserMm(explicit) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const tries = [
    explicit,
    process.env.GITBREW_GITHUB_BROWSER_MM,
    path.resolve(here, "../../../..", PREVIEW_GH_POLISH_MM),
    path.resolve(process.cwd(), PREVIEW_GH_POLISH_MM),
    path.resolve(process.cwd(), PREVIEW_GH_SHIPPED_MM),
    path.resolve(here, "../../../..", PREVIEW_GH_SHIPPED_MM),
  ].filter(Boolean);
  for (const t of tries) {
    try {
      if (fs.statSync(t).isFile()) return t;
    } catch {
      /* next */
    }
  }
  return "";
}
/** @deprecated full-bleed-only path — check-preview fails closed if this appears without device. */
export const PREVIEW_FULLBLEED_MARKER = "preview-fullbleed-tapin-v1";

/** Canonical public preview URL shape. */
export function previewPostUrl(base, postId) {
  const b = String(base || "https://gitbrew.ai").replace(/\/$/, "");
  const id = String(postId || "").trim().toLowerCase();
  return `${b}/preview/${id}`;
}

/**
 * Machine-check live `/preview/<id>` HTML.
 * GitBrew infra (not the agent's job): 3js device frame, tap-in chrome, cover slot, More GitHub sheet.
 * Agent job: the play.html house **inside** the island.
 * Does NOT change JEV 12/12 publish units — call via `protocol.mjs check-preview`.
 * @param {{ html?: string, url?: string, appHtml?: string, hostJs?: string, sheetJs?: string, mmPath?: string }} opts
 * @returns {Promise<{ ok: boolean, url?: string, marker: string, errors: string[], hints: Record<string, boolean> }>}
 */
export async function checkLivePreviewHost(opts = {}) {
  const errors = [];
  let html = opts.html != null ? String(opts.html) : "";
  let url = opts.url ? String(opts.url) : "";
  async function pull(target) {
    const r = await fetch(target, {
      headers: { Accept: "text/html, */*", "Cache-Control": "no-cache" },
      redirect: "follow",
    });
    const text = await r.text();
    if (!r.ok) throw new Error(`HTTP ${r.status} for ${target}`);
    return text;
  }
  if (!html) {
    if (!url) {
      return {
        ok: false,
        marker: PREVIEW_DEVICE_TAPIN_MARKER,
        errors: ["preview-host: need --url or html"],
        hints: {},
      };
    }
    try {
      html = await pull(url);
    } catch (e) {
      return {
        ok: false,
        url,
        marker: PREVIEW_DEVICE_TAPIN_MARKER,
        errors: [`preview-host: fetch failed — ${e && e.message ? e.message : e}`],
        hints: {},
      };
    }
  }

  if (url) {
    try {
      const host = new URL(url).hostname;
      if (host === "gitbrew-sync.zeabur.app" || /\.zeabur\.app$/i.test(host)) {
        errors.push("preview-host: public URL is https://gitbrew.ai/preview/<id> — not the zeabur.app host");
      }
    } catch {
      /* ignore */
    }
  }

  const markerHit =
    html.includes(`content="${PREVIEW_DEVICE_TAPIN_MARKER}"`) ||
    html.includes(`data-gb-preview="${PREVIEW_DEVICE_TAPIN_MARKER}"`);
  if (!markerHit) {
    errors.push(`preview-host: missing marker ${PREVIEW_DEVICE_TAPIN_MARKER}`);
  }
  if (/preview-fullbleed-tapin-v1/.test(html) && !/3js-device|WebGLRenderer|GridHelper|#void|#css3d/i.test(html)) {
    errors.push("preview-host: full-bleed-only host without device shell — restore 3js phone/iPad");
  }
  const needDevice = [
    [/WebGLRenderer|THREE\.Scene|new THREE\./, "Three.js renderer/scene"],
    [/GridHelper/, "product-void GridHelper"],
    [/id="btn-phone"/, "phone toggle"],
    [/id="btn-ipad"/, "iPad toggle"],
    [/\/user-play\//, "post /user-play/ iframe"],
    [/play\.html/, "play.html"],
    [/ds-made-by/, "made-by chrome"],
    [/sandbox-exit/, "sandbox-exit"],
    [/sandbox-uploader/, "sandbox-uploader"],
    [/sandbox-topic-title/, "sandbox-topic-title"],
    [/sandbox-top-right/, "sandbox-top-right"],
    [/sandbox-more/, "More"],
    [/--safe-top|safeTop/, "safe-top chrome offset"],
    [/120cqw|PLAY_ISLAND_VW|play-island/, "120vw play island"],
    [/CSS3DObject/, "CSS3D glass"],
    [/#css3d iframe \{ pointer-events: auto/, "CSS3D iframe draggable"],
  ];
  for (const [re, label] of needDevice) {
    if (!re.test(html)) errors.push(`preview-host: missing ${label}`);
  }
  if (/CylinderGeometry/.test(html)) {
    errors.push("preview-host: MagSafe/CylinderGeometry dock forbidden (nobase)");
  }
  const forbidden = [
    [/\/preview\/_app\/\?gbPost=/, "GitBrew app iframe"],
    [/Loading README…/, "self-drawn README"],
    [/gb-glass-2d/, "2D overlay (not allowed)"],
    [/pinGlass2d/, "2D pin (not allowed)"],
  ];
  for (const [re, label] of forbidden) {
    if (re.test(html)) errors.push(`preview-host: hand-written chrome still present (${label})`);
  }

  let sheetJs = opts.sheetJs != null ? String(opts.sheetJs) : "";
  if (!sheetJs && /\/preview\/_host\/sheet\.js/.test(html) && url) {
    try {
      const origin = new URL(url).origin;
      sheetJs = await pull(`${origin}/preview/_host/sheet.js`);
    } catch (e) {
      errors.push(`preview-host: sheet script fetch failed — ${e && e.message ? e.message : e}`);
    }
  }
  const sheetBlob = `${html}\n${sheetJs}`;
  // More = the native GitHub sheet: the live github.com page through the hub pass-through.
  const selfDrawn = [
    [/\/api\/preview\/readme/, "/api/preview/readme"],
    [/renderMarkdown|renderBlocks/, "markdown renderer"],
    [/No README in this repository|Loading README…/, "self-drawn README states"],
    [/gb-uisheet-body/, "gb-uisheet-body"],
  ];
  for (const [re, label] of selfDrawn) {
    if (re.test(sheetBlob)) errors.push(`preview-host: old self-drawn README sheet still present (${label})`);
  }
  if (!sheetBlob.includes(PREVIEW_GH_PASSTHROUGH_PREFIX.replace(/\/$/, ""))) {
    errors.push(`preview-host: More must open the live github.com page through ${PREVIEW_GH_PASSTHROUGH_PREFIX}`);
  }
  if (!/eval-polish/.test(sheetBlob)) {
    errors.push("preview-host: GitHub sheet must run kGBPolishAndAnchorJS (eval-polish) like gbPolishAndAnchor");
  }
  if (!/github_open_sheet/.test(sheetBlob)) {
    errors.push("preview-host: parent must listen for github_open_sheet");
  }
  if (!/gb-native-sheet-done|>Done</.test(sheetBlob)) {
    errors.push("preview-host: UISheet needs a Done control");
  }

  function postIdOf() {
    const fromPlay = html.match(/\/user-play\/([^/"']+)\/play\.html/);
    if (fromPlay) return fromPlay[1];
    const fromConst = html.match(/PREVIEW_POST_ID\s*=\s*"([^"]+)"/);
    if (fromConst) return fromConst[1];
    if (url) {
      try {
        const parts = new URL(url).pathname.split("/").filter(Boolean);
        if (parts[0] === "preview" && parts[1] && parts[1] !== "_app" && parts[1] !== "_host") return parts[1];
      } catch { /* ignore */ }
    }
    return "";
  }

  const id = postIdOf();
  let origin = "";
  if (url) {
    try { origin = new URL(url).origin; } catch { origin = ""; }
  }

  // Live pass-through + polish source of truth (needs --url so the hub can be asked).
  let ghPassthrough = null;
  let polishMatchesMm = null;
  let polishSource = "";
  if (origin && id) {
    let repoUrl = "";
    try {
      const r = await fetch(`${origin}/preview/${encodeURIComponent(id)}?format=json`, {
        headers: { Accept: "application/json", "Cache-Control": "no-cache" },
      });
      const j = r.ok ? await r.json() : null;
      repoUrl = j && typeof j.githubUrl === "string" ? j.githubUrl : "";
    } catch (e) {
      errors.push(`preview-host: post json fetch failed — ${e && e.message ? e.message : e}`);
    }
    let served = null;
    try {
      const r = await fetch(`${origin}/preview/_gh-polish.json`, { headers: { "Cache-Control": "no-cache" } });
      served = r.ok ? await r.json() : null;
      if (!served || !served.ok || typeof served.js !== "string") {
        errors.push(`preview-host: /preview/_gh-polish.json did not return ${PREVIEW_GH_POLISH_NAME} (HTTP ${r.status})`);
        served = null;
      } else {
        polishSource = String(served.source || "");
        if (polishSource !== PREVIEW_GH_POLISH_MM) {
          errors.push(`preview-host: polish must be extracted from ${PREVIEW_GH_POLISH_MM}, hub says ${polishSource || "nothing"}`);
        }
        const sha = crypto.createHash("sha256").update(served.js, "utf8").digest("hex");
        if (served.sha256 !== sha) errors.push("preview-host: served polish sha256 does not match its js");
      }
    } catch (e) {
      errors.push(`preview-host: polish fetch failed — ${e && e.message ? e.message : e}`);
    }
    const mm = findGithubBrowserMm(opts.mmPath);
    if (served && mm) {
      try {
        const raw = fs.readFileSync(mm);
        const local = extractObjcStringConst(raw.toString("utf8"), PREVIEW_GH_POLISH_NAME);
        polishMatchesMm = local === served.js;
        if (!polishMatchesMm) {
          errors.push(`preview-host: live ${PREVIEW_GH_POLISH_NAME} differs from ${mm} (not byte-for-byte)`);
        }
        // The hub also reports the sha256 of the whole .mm it read (repo path or the verbatim deploy copy).
        if (served.mmSha256) {
          const localMmSha = crypto.createHash("sha256").update(raw).digest("hex");
          if (served.mmSha256 !== localMmSha) {
            polishMatchesMm = false;
            errors.push(`preview-host: hub's GitHubBrowser.mm (${served.shipped || "?"}) is not byte-for-byte ${mm}`);
          }
        }
      } catch (e) {
        errors.push(`preview-host: could not read ${PREVIEW_GH_POLISH_NAME} from ${mm} — ${e && e.message ? e.message : e}`);
      }
    }
    let slug = null;
    try {
      const u = new URL(repoUrl);
      const segs = u.pathname.split("/").filter(Boolean);
      if (u.hostname.toLowerCase() === "github.com" && segs.length >= 2) slug = `${segs[0]}/${segs[1]}`;
    } catch {
      slug = null;
    }
    if (!slug) {
      errors.push("preview-host: post has no github.com repo, so More cannot open the GitHub sheet");
    } else {
      try {
        const passUrl = `${origin}${PREVIEW_GH_PASSTHROUGH_PREFIX}${slug}`;
        const r = await fetch(passUrl, { headers: { Accept: "text/html", "Cache-Control": "no-cache" } });
        const body = await r.text();
        const xfo = r.headers.get("x-frame-options");
        const csp = String(r.headers.get("content-security-policy") || "");
        const problems = [];
        if (r.status !== 200) problems.push(`HTTP ${r.status}`);
        if (r.headers.get("x-gb-sheet") !== "passthrough") problems.push("x-gb-sheet != passthrough");
        // github.com's own `DENY` must be gone. The gitbrew.ai front adds `SAMEORIGIN` to every response;
        // that still lets the same-origin preview page frame the pass-through, so it is allowed.
        if (xfo && !/^\s*sameorigin\s*$/i.test(xfo)) problems.push(`x-frame-options ${xfo}`);
        if (!/\bsandbox\b/.test(csp) || /frame-ancestors 'none'/.test(csp)) problems.push(`csp "${csp}"`);
        if (!/^https:\/\/github\.com\//.test(String(r.headers.get("x-gb-sheet-upstream") || ""))) problems.push("upstream is not github.com");
        if (!/<base href="https:\/\/github\.com\//i.test(body)) problems.push("no <base href=https://github.com/>");
        if (!/github\.githubassets\.com/.test(body)) problems.push("not GitHub's own page (no githubassets)");
        if (!/markdown-body/.test(body)) problems.push("no rendered README (markdown-body)");
        if (!/js-header-wrapper|repository-content|repository-container-header|HeaderMenu/.test(body)) {
          problems.push("no GitHub repo chrome (README-only fragment)");
        }
        if (/<script[^>]+src=["']https:\/\/github\.githubassets\.com/i.test(body)) {
          problems.push("GitHub boot scripts still present (would hydrate away SSR chrome)");
        }
        if (!/window\.__gbSheet=/.test(body) || !/eval-polish/.test(body)) problems.push("sheet bridge not injected");
        if (served && r.headers.get("x-gb-sheet-polish-sha256") !== served.sha256) problems.push("page polish sha differs from /preview/_gh-polish.json");
        ghPassthrough = problems.length === 0;
        if (problems.length) errors.push(`preview-host: ${passUrl} is not the live github.com pass-through — ${problems.join("; ")}`);
      } catch (e) {
        ghPassthrough = false;
        errors.push(`preview-host: GitHub pass-through fetch failed — ${e && e.message ? e.message : e}`);
      }
    }
  }

  const hints = {
    marker: markerHit,
    device: /WebGLRenderer|GridHelper|3js-device/i.test(html),
    playIframe: /\/user-play\//.test(html) && /play\.html/.test(html),
    noAppIframe: !/\/preview\/_app\/\?gbPost=/.test(html),
    noHandChrome: !forbidden.some(([re]) => re.test(html)),
    moreOpensGithubPassthrough: sheetBlob.includes("/preview/_gh") && (url ? ghPassthrough === true : true),
    ghPassthroughLive: ghPassthrough,
    noSelfDrawnReadme: !selfDrawn.some(([re]) => re.test(sheetBlob)),
    polishFromMm: polishSource === PREVIEW_GH_POLISH_MM || null,
    polishMatchesMm,
    noCylinder: !/CylinderGeometry/.test(html),
    noPlayIsland: !/play-island/i.test(html),
  };
  return {
    ok: errors.length === 0,
    url: url || undefined,
    marker: PREVIEW_DEVICE_TAPIN_MARKER,
    errors,
    hints,
  };
}

export const SKILL_PROOF_FILE = "SKILL_PROOF.md";
export const SKILL_PROOF_MIN_CHARS = 120;

/**
 * Fail closed: SKILL_PROOF.md must exist, be non-empty, and cite hard skill rules
 * (ready ≤2s, local vendor, ratio/120vw island, composition).
 */
export function validateSkillProofContent(raw) {
  const errors = [];
  const text = String(raw ?? "").trim();
  if (!text) {
    errors.push(
      `skill-proof missing: ${SKILL_PROOF_FILE} required — coding agent must read gitbrew-post SKILL.md and write a short proof`,
    );
    return errors;
  }
  if (text.replace(/\s+/g, "").length < SKILL_PROOF_MIN_CHARS) {
    errors.push(
      `skill-proof empty: ${SKILL_PROOF_FILE} too thin (min ${SKILL_PROOF_MIN_CHARS} non-whitespace chars) — prove you read the skill`,
    );
  }
  const lower = text.toLowerCase();
  const need = [
    {
      ok: /ready|playable-ready|2000|_ready/.test(lower),
      err: "skill-proof incomplete: must cite ready hard rule (ready ≤2000ms / /sandbox/_ready.js / playable-ready)",
    },
    {
      ok: /vendor|local only|no https|remote/.test(lower),
      err: "skill-proof incomplete: must cite local-vendor hard rule (relative ./vendor, no remote css/js/font)",
    },
    {
      ok: /120vw|play_island_vw|play-island|island|max-height:\s*120/.test(lower) || (/ratio/.test(lower) && /120|1\.2/.test(lower)),
      err: "skill-proof incomplete: must cite ratio/island hard rule (phone max-height 120vw / PLAY_ISLAND_VW=1.2)",
    },
    {
      ok: /composition|viewport-fit|overflow:\s*hidden|dock/.test(lower),
      err: "skill-proof incomplete: must cite composition hard rule (viewport-fit=cover / overflow:hidden / dock sibling)",
    },
  ];
  for (const n of need) {
    if (!n.ok) errors.push(n.err);
  }
  return errors;
}

export function validateSkillProofFile(dir) {
  const p = path.join(dir, SKILL_PROOF_FILE);
  if (!fs.existsSync(p)) {
    return [
      `skill-proof missing: ${SKILL_PROOF_FILE} required — coding agent must read gitbrew-post SKILL.md and write a short proof`,
    ];
  }
  return validateSkillProofContent(fs.readFileSync(p, "utf8"));
}

/**
 * Machine-enforce skill Ratio / 120vw island (PLAY_ISLAND_VW).
 * Pass measured play-island CSS px (host iframe box). Full-glass fill fails.
 */
export function pushPlayIslandGate(input, aspect, errors) {
  const w = input?.islandWidth ?? input?.islandW;
  const h = input?.islandHeight ?? input?.islandH;
  if (w == null || h == null) return;
  const r = checkPlayIslandSize({
    width: w,
    height: h,
    glassHeight: input?.glassHeight ?? input?.glassH,
    aspect,
  });
  if (!r.ok) errors.push(r.error);
}



const DEMOLISH = [
  /showRunner\s*\(/,
  /width:\s*100%\s*!important/,
  /function\s+gbRebuildHud/,
];

const REMOTE_FONT = /fonts\.googleapis|fonts\.gstatic|use\.typekit|kit\.fontawesome/i;
const REMOTE_WIDGET = /addthis|plusone|googletagmanager|google-analytics|www\.google-analytics/i;

export function safeRelPath(rel) {
  const cleaned = String(rel ?? "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\\/g, "/");
  if (!cleaned || cleaned.includes("\0")) return null;
  if (path.isAbsolute(cleaned)) return null;
  const parts = cleaned.split("/");
  if (parts.some((p) => p === "" || p === "." || p === "..")) return null;
  return cleaned;
}

export function readManifest(dir) {
  const raw = fs.readFileSync(path.join(dir, "manifest.json"), "utf8");
  const m = JSON.parse(raw);
  if (!m.id || !m.playHtml || !Array.isArray(m.officialFiles)) {
    throw new Error("invalid user-post manifest");
  }
  return m;
}

function nonWs(s) {
  return s.replace(/\s+/g, "").length;
}

function compact(s) {
  return s.replace(/\s+/g, " ").trim();
}

function stripChrome(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
}

function officialIds(html) {
  const ids = [...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]);
  return [...new Set(ids)].filter((id) => !/^(html|head|body)$/i.test(id));
}

export function parseAspect(raw) {
  const s = String(raw ?? "phone")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  if (s === "square" || s === "1 / 1" || s === "1/1") return "square";
  return "phone";
}

export function hostAspect(aspect) {
  return HOST_ASPECT[aspect] ?? HOST_ASPECT.phone;
}

function playKeepsOfficialPage(play, officialHtml) {
  const ids = officialIds(officialHtml);
  if (ids.length > 0) {
    return ids.some(
      (id) =>
        play.includes(`id="${id}"`) ||
        play.includes(`id='${id}'`) ||
        new RegExp(`\\bid\\s*=\\s*${id}\\b`).test(play),
    );
  }
  const body = compact(stripChrome(officialHtml));
  if (body.length < 32) return compact(stripChrome(play)).length >= 32;
  return compact(play).includes(body.slice(0, Math.min(48, body.length)));
}

function hasDock(html) {
  return /gb-dock|id=["']dock["']|map-panel|peak-panel|ava-panel|flower-panel/.test(html);
}

function pushRatio(joined, html, aspect, errors) {
  if (/innerHeight\s*\/\s*16/.test(joined) || /setCanvasFixedSize\(\s*vec2\(\s*1280\s*,\s*720/.test(joined)) {
    errors.push("camera-landscape");
  }
  if (/canvas\s*\{[^}]{0,200}height:\s*100vh/i.test(joined) && /min-width:\s*100vw/i.test(joined)) {
    errors.push("stretch-canvas");
  }
  const stageRule = /(?:canvas|#stage|#scene)\s*\{[^}]{0,280}\}/gi;
  let stretchFill = false;
  for (const m of joined.matchAll(stageRule)) {
    const rule = m[0];
    if (/width:\s*100vw/i.test(rule) && /height:\s*100vh/i.test(rule) && !/aspect-ratio/i.test(rule)) {
      stretchFill = true;
    }
  }
  if (stretchFill) errors.push("stretch-canvas");
  if (/(?:canvas|#stage)\s*\{[^}]{0,200}object-fit:\s*fill/i.test(joined)) {
    errors.push("stretch-canvas");
  }
  if (aspect === "square") {
    const square =
      /aspect-ratio:\s*1(?:\s*\/\s*1)?/i.test(joined) ||
      /min\(\s*100cqw\s*,\s*100cqh\s*\)/i.test(joined) ||
      (/(?:canvas|#stage|#map|#scene)\s*\{[^}]{0,240}width:\s*100vw/i.test(joined) &&
        /(?:canvas|#stage|#map|#scene)\s*\{[^}]{0,240}height:\s*100vw/i.test(joined));
    if (!square) errors.push("square stage must be 1:1 (aspect-ratio:1 or min(cqw,cqh)), centered");
    if (/(?:canvas|#stage|#map)\s*\{[^}]{0,240}height:\s*100vh/i.test(joined)) {
      errors.push("stretch-canvas");
    }
  }
  if (!/viewport-fit\s*=\s*cover/i.test(html)) {
    errors.push("composition-viewport");
  }
  if (!/html[\s\S]{0,800}height:\s*100%/i.test(joined) && !/html\s*,\s*body[^{]{0,60}\{[^}]*height:\s*100%/i.test(joined)) {
    errors.push("composition-fill");
  }
  if (!/overflow:\s*hidden/i.test(joined)) {
    errors.push("composition-fill");
  }
}

function pushComposition(html, joined, _aspect, errors) {
  if (/env\(\s*safe-area-inset/i.test(joined)) {
    errors.push("composition-safe-area");
  }
  if (hasDock(html) && !/flex-direction:\s*column/i.test(joined)) {
    errors.push("composition-dock");
  }
  if (
    /(?:#overlay|#veil|(?:^|[^\w-])\.modal)\s*\{[^}]{0,200}position:\s*fixed[^}]{0,160}(?:inset:\s*0|top:\s*0[^}]{0,80}bottom:\s*0)/i.test(
      joined,
    )
  ) {
    errors.push("composition-overlay");
  }
}

function pushRemote(html, errors) {
  const links = [...html.matchAll(/<link\b[^>]*>/gi)];
  if (links.some((m) => /stylesheet/i.test(m[0]) && /href=["']https?:/i.test(m[0]))) {
    errors.push("remote stylesheet");
  }
  if (/<script[^>]+src=["']https?:/i.test(html)) errors.push("remote script");
  if (/<iframe[^>]+src=["']https?:/i.test(html)) errors.push("remote iframe");
  if (/from\s+["']https?:\/\//.test(html) || /importmap[\s\S]{0,400}https?:\/\//i.test(html)) {
    errors.push("remote import");
  }
  if (REMOTE_FONT.test(html)) errors.push("remote font");
  if (REMOTE_WIDGET.test(html)) errors.push("remote widget");
}

export function validateUserPostFiles(input) {
  const errors = [];
  const id = String(input.id ?? "").trim();
  if (!/^[a-z0-9][a-z0-9-]{1,31}$/.test(id)) {
    errors.push("id must be a short slug");
  }
  const playHtml = safeRelPath(input.playHtml);
  if (!playHtml) errors.push("invalid play html path");
  const files = input.officialFiles ?? [];
  if (files.length === 0) errors.push("no official files listed");
  if (files.length > MAX_OFFICIAL_FILES) errors.push(`too many official files (max ${MAX_OFFICIAL_FILES})`);
  for (const f of files) {
    const rel = safeRelPath(f.path);
    if (!rel || !f.content) errors.push(`bad official file: ${f.path}`);
    else if (f.content.length > MAX_OFFICIAL_FILE_CHARS) {
      errors.push(`official file too large: ${f.path} (max ${MAX_OFFICIAL_FILE_CHARS} chars)`);
    }
  }
  const html = input.playHtmlContent ?? "";
  if (html.length > MAX_PLAY_HTML_CHARS) {
    errors.push(`play html too large (max ${MAX_PLAY_HTML_CHARS} chars)`);
  }
  const postChars = html.length + files.reduce((n, f) => n + (f.content ? f.content.length : 0), 0);
  if (postChars > MAX_POST_CHARS) {
    errors.push(`play payload too large (max ${MAX_POST_CHARS} chars)`);
  }

  const htmlFiles = files.filter((f) => /\.html?$/i.test(f.path) && safeRelPath(f.path));
  const codeFiles = files.filter((f) => /\.(js|css)$/i.test(f.path) && safeRelPath(f.path));
  if (htmlFiles.length === 0) {
    errors.push("need official html in officialFiles (paste official index.html first)");
  }
  if (codeFiles.length === 0) {
    errors.push("need official js or css in officialFiles");
  }
  for (const f of htmlFiles) {
    if (nonWs(f.content) < 40) errors.push(`official html too thin: ${f.path}`);
  }
  for (const f of codeFiles) {
    const min = /\.css$/i.test(f.path) ? 40 : 80;
    if (nonWs(f.content) < min) errors.push(`official file too thin: ${f.path}`);
  }

  if (!html.trim()) errors.push("missing play html");

  const blobs = [html, ...files.map((f) => f.content)];
  for (const blob of blobs) {
    for (const re of DEMOLISH) {
      if (re.test(blob)) errors.push(`demolished house: ${re}`);
    }
  }

  if (html) {
    if (!/\/sandbox\/_ready(?:\.v\d+)?\.js/.test(html) && !/playable-ready/.test(html)) {
      errors.push("missing /sandbox/_ready.js");
    }
    if (/client\/public\/sandbox\/_ready/.test(html)) {
      errors.push("ready.js must be /sandbox/_ready.js on GitBrew, not the agent repo path");
    }
    pushRemote(html, errors);
    if (/location\.replace\s*\(/.test(html) || /location(?:\.href)?\s*=\s*['"]https?:/.test(html)) {
      errors.push("hop: play html must be the leaf, not a redirect");
    }
    const aspect = parseAspect(input.aspect);
    const joined = [html, ...files.map((f) => f.content)].join("\n");
    pushRatio(joined, html, aspect, errors);
    pushComposition(html, joined, aspect, errors);
    if (/(?:#scene|canvas)\s*\{[^}]{0,120}display:\s*none/i.test(html)) {
      errors.push("hide-stage");
    }
    if (/html\s*,\s*body[^{]{0,40}\{[^}]{0,120}opacity:\s*0/i.test(html)) {
      errors.push("opacity-0 boot");
    }
    if (playHtml) {
      for (const f of files) {
        const rel = safeRelPath(f.path);
        if (!rel || /\.html?$/i.test(rel)) continue;
        const base = path.posix.basename(rel);
        if (base && !html.includes(base)) {
          errors.push(`play html does not reference ${base}`);
        }
      }
    }
    if (htmlFiles[0] && !playKeepsOfficialPage(html, htmlFiles[0].content)) {
      errors.push("play html is a rebuilt wrapper, not the official page");
    }
  }

  const titleOk =
    (input.title?.en?.length ?? 0) > 0 &&
    (input.title?.en?.length ?? 0) <= 42 &&
    (input.title?.zh?.length ?? 0) > 0 &&
    (input.title?.zh?.length ?? 0) <= 42;
  if (!titleOk) errors.push("title must be bilingual and ≤42");
  const introEn = input.intro?.en ?? "";
  const introZh = input.intro?.zh ?? "";
  if (introEn.length > MAX_INTRO_CHARS || introZh.length > MAX_INTRO_CHARS) {
    errors.push(`intro must be ≤${MAX_INTRO_CHARS} per language`);
  }

  const aspectForIsland = parseAspect(input.aspect);
  pushPlayIslandGate(input, aspectForIsland, errors);
  if (input.skillProofContent != null || input.requireSkillProof) {
    for (const e of validateSkillProofContent(input.skillProofContent)) errors.push(e);
  }

  const unique = [...new Set(errors)];
  return {
    ok: unique.length === 0,
    id,
    pasted: unique.length === 0,
    errors: unique,
    playIslandVw: PLAY_ISLAND_VW,
  };
}

export function validateUserPost(dir) {
  let manifest;
  try {
    manifest = readManifest(dir);
  } catch (e) {
    return {
      ok: false,
      id: path.basename(dir),
      pasted: false,
      errors: [e instanceof Error ? e.message : "manifest"],
    };
  }
  const playPath = path.join(dir, manifest.playHtml);
  const officialFiles = manifest.officialFiles.map((rel) => ({
    path: rel,
    content: fs.existsSync(path.join(dir, rel)) ? fs.readFileSync(path.join(dir, rel), "utf8") : "",
  }));
  const islandWidth = Number(arg("island-w") || "") || undefined;
  const islandHeight = Number(arg("island-h") || "") || undefined;
  const glassHeight = Number(arg("glass-h") || "") || undefined;
  const checked = validateUserPostFiles({
    id: manifest.id,
    title: manifest.title,
    intro: manifest.intro,
    playHtml: manifest.playHtml,
    playHtmlContent: fs.existsSync(playPath) ? fs.readFileSync(playPath, "utf8") : "",
    officialFiles,
    aspect: manifest.aspect,
    islandWidth,
    islandHeight,
    glassHeight,
    // On CLI `check`, skill proof is mandatory (skill is a hard request).
    requireSkillProof: process.argv[2] === "check",
    skillProofContent:
      fs.existsSync(path.join(dir, SKILL_PROOF_FILE))
        ? fs.readFileSync(path.join(dir, SKILL_PROOF_FILE), "utf8")
        : process.argv[2] === "check"
          ? ""
          : undefined,
  });
  const checking = process.argv[2] === "check";
  const hasLoop = fs.existsSync(path.join(dir, "cover.mp4"));
  const hasStill = ["cover.webp", "cover.png"].some((n) => fs.existsSync(path.join(dir, n)));
  const coverErrors = checking || hasLoop || hasStill ? validateCoverFiles(dir) : [];
  const errors = [...checked.errors, ...coverErrors];
  const unique = [...new Set(errors)];
  return {
    ok: unique.length === 0,
    id: checked.id,
    pasted: unique.length === 0,
    errors: unique,
    playIslandVw: PLAY_ISLAND_VW,
  };
}

function probeVideo(file) {
  const r = spawnSync(
    "ffprobe",
    ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,avg_frame_rate", "-of", "json", file],
    { encoding: "utf8" },
  );
  if (r.status !== 0) return null;
  try {
    const stream = JSON.parse(r.stdout || "{}").streams?.[0];
    if (!stream) return null;
    const [a, b] = String(stream.avg_frame_rate || "0/1").split("/").map(Number);
    const fps = b ? a / b : a || 0;
    return { width: Number(stream.width) || 0, height: Number(stream.height) || 0, fps };
  } catch {
    return null;
  }
}

/** Cover is the STAGE only: 390×844, ≥24fps, no GitBrew chrome (back, title, rail). */
export function validateCoverFiles(dir) {
  const errors = [];
  const loop = path.join(dir, "cover.mp4");
  const still = ["cover.webp", "cover.png"].map((n) => path.join(dir, n)).find((p) => fs.existsSync(p));
  if (!still) errors.push("cover-still missing: cover.webp (or cover.png) must be the 390×844 stage, no GitBrew chrome");
  if (!fs.existsSync(loop)) {
    errors.push("cover-loop missing: cover.mp4 must be a 390×844 ≥24fps stage recording, no GitBrew chrome");
    return errors;
  }
  const meta = probeVideo(loop);
  if (!meta) {
    errors.push("cover-loop unreadable: install ffprobe or record a real mp4");
    return errors;
  }
  if (meta.width !== COVER_WIDTH || meta.height !== COVER_HEIGHT) {
    errors.push(`cover-loop must be ${COVER_WIDTH}×${COVER_HEIGHT} (got ${meta.width}×${meta.height}) — crop the stage, not the GitBrew chrome`);
  }
  if (meta.fps < MIN_COVER_FPS) {
    errors.push(`cover-loop fps ${meta.fps.toFixed(1)} < ${MIN_COVER_FPS} — record the live stage, not a flipbook`);
  }
  return errors;
}

function arg(name, fallback = "") {
  const i = process.argv.indexOf(`--${name}`);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return fallback;
}

function ranAsCli() {
  try {
    if (!process.argv[1]) return false;
    const self = fs.realpathSync(fileURLToPath(import.meta.url));
    const entry = fs.realpathSync(path.resolve(process.argv[1]));
    return self === entry;
  } catch {
    return false;
  }
}

function cli() {
  const cmd = process.argv[2];
  if (cmd === "check-island") {
    const w = Number(arg("w") || arg("island-w"));
    const h = Number(arg("h") || arg("island-h"));
    const glassH = arg("glass-h") !== "" ? Number(arg("glass-h")) : undefined;
    const aspect = arg("aspect") || "phone";
    if (!(w > 0) || !(h >= 0)) {
      console.error("usage: node protocol.mjs check-island --w 402 --h 482 [--glass-h 874] [--aspect phone]");
      process.exit(2);
    }
    const r = checkPlayIslandSize({ width: w, height: h, glassHeight: glassH, aspect });
    const out = {
      ok: r.ok,
      playIslandVw: PLAY_ISLAND_VW,
      maxHeight: r.maxHeight,
      errors: r.ok ? [] : [r.error],
    };
    console.log(JSON.stringify(out, null, 2));
    process.exit(r.ok ? 0 : 1);
  }
  if (cmd === "check-preview") {
    const htmlFile = arg("html-file");
    const url =
      arg("url") ||
      (arg("post-id") || arg("id")
        ? previewPostUrl(arg("base") || arg("gitbrew-url") || "https://gitbrew.ai", arg("post-id") || arg("id"))
        : "");
    if (!url && !htmlFile) {
      console.error("usage: node protocol.mjs check-preview --url https://gitbrew.ai/preview/<postId>");
      console.error("       node protocol.mjs check-preview --post-id u-login-slug [--base https://gitbrew.ai]");
      console.error("       node protocol.mjs check-preview --html-file preview.html [--app-html index.html --host-js tauri-host.js --sheet-js sheet.js]");
      process.exit(2);
    }
    const opts = { url };
    if (htmlFile) opts.html = fs.readFileSync(htmlFile, "utf8");
    if (arg("app-html")) opts.appHtml = fs.readFileSync(arg("app-html"), "utf8");
    if (arg("host-js")) opts.hostJs = fs.readFileSync(arg("host-js"), "utf8");
    if (arg("sheet-js")) opts.sheetJs = fs.readFileSync(arg("sheet-js"), "utf8");
    if (arg("mm")) opts.mmPath = arg("mm");
    checkLivePreviewHost(opts).then((r) => {
      console.log(JSON.stringify(r, null, 2));
      process.exit(r.ok ? 0 : 1);
    });
    return;
  }
  if (cmd !== "check") {
    console.error("usage: node protocol.mjs check --dir ./the-post-folder [--island-w 402 --island-h 482 --glass-h 874]");
    console.error("       node protocol.mjs check-island --w 402 --h 482 [--glass-h 874]");
    console.error("       node protocol.mjs check-preview --url https://gitbrew.ai/preview/<postId>");
    process.exit(2);
  }
  const dir = arg("dir") || process.argv[3];
  if (!dir) {
    console.error("usage: node protocol.mjs check --dir ./the-post-folder [--island-w 402 --island-h 482 --glass-h 874]");
    process.exit(2);
  }
  const r = validateUserPost(dir);
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.ok ? 0 : 1);
}

if (ranAsCli()) cli();
