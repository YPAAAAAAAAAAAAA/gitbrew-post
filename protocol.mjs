#!/usr/bin/env node
/**
 * Sandbox-green lock for creator posts. Same gate GitBrew runs on publish.
 *   node protocol.mjs check --dir ./the-post-folder
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const HOST_ASPECT = { phone: "390 / 844", square: "1 / 1" };

/** Official engines (three.min.js) are expected. Pack law is 20MB reachable play. */
export const MAX_OFFICIAL_FILE_CHARS = 2_000_000;
export const MAX_PLAY_HTML_CHARS = 2_000_000;
export const MAX_OFFICIAL_FILES = 40;
export const MAX_POST_CHARS = 20_000_000;

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

  const unique = [...new Set(errors)];
  return { ok: unique.length === 0, id, pasted: unique.length === 0, errors: unique };
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
  return validateUserPostFiles({
    id: manifest.id,
    title: manifest.title,
    playHtml: manifest.playHtml,
    playHtmlContent: fs.existsSync(playPath) ? fs.readFileSync(playPath, "utf8") : "",
    officialFiles,
    aspect: manifest.aspect,
  });
}

function arg(name, fallback = "") {
  const i = process.argv.indexOf(`--${name}`);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return fallback;
}

function ranAsCli() {
  try {
    const self = fileURLToPath(import.meta.url);
    const entry = process.argv[1] ? path.resolve(process.argv[1]) : "";
    return path.resolve(self) === entry;
  } catch {
    return false;
  }
}

function cli() {
  const cmd = process.argv[2];
  if (cmd !== "check") {
    console.error("usage: node protocol.mjs check --dir ./the-post-folder");
    process.exit(2);
  }
  const dir = arg("dir") || process.argv[3];
  if (!dir) {
    console.error("usage: node protocol.mjs check --dir ./the-post-folder");
    process.exit(2);
  }
  const r = validateUserPost(dir);
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.ok ? 0 : 1);
}

if (ranAsCli()) cli();
