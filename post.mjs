#!/usr/bin/env node
/**
 * Run by the creator's coding agent. Uses GITHUB_TOKEN.
 *   node post.mjs publish --url $GITBREW_URL --repo owner/name --dir ./post
 *   node post.mjs edit --url $GITBREW_URL --post u-login-slug --title-en X --title-zh Y
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

function arg(name, fallback = "") {
  const i = process.argv.indexOf(`--${name}`);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return fallback;
}

function die(msg, code = 2) {
  console.error(msg);
  process.exit(code);
}

function hostOf(raw) {
  try {
    return new URL(raw).hostname.replace(/^\[|\]$/g, "").toLowerCase();
  } catch {
    return "";
  }
}

function isLoopback(raw) {
  const host = hostOf(raw);
  return host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "0.0.0.0";
}

function isPackHost(raw) {
  const host = hostOf(raw);
  return (
    host.endsWith("githubusercontent.com") ||
    host.endsWith("github.io") ||
    host.endsWith("b-cdn.net") ||
    host.endsWith("r2.dev") ||
    host.endsWith("myqcloud.com")
  );
}

const cmd = process.argv[2];
const url = (arg("url") || process.env.GITBREW_URL || "").replace(/\/$/, "");
const token = arg("token") || process.env.GITHUB_TOKEN || "";
if (!url) die("Pass --url or GITBREW_URL — the GitBrew origin this skill was fetched from.");
if (isLoopback(url) && process.env.GITBREW_ALLOW_LOCAL !== "1") {
  die("Refusing localhost. GITBREW_URL is the live GitBrew, not the agent's machine. Set GITBREW_ALLOW_LOCAL=1 only if you are that server.");
}
if (isPackHost(url)) {
  die("That URL is the skill pack, not GitBrew. Pass --url of the GitBrew that has /api/trpc.");
}
if (!token) die("Set GITHUB_TOKEN (the creator's GitHub token, not a GitBrew password).");

async function gitbrewFetch(href, init) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 20_000);
  try {
    return await fetch(href, { ...init, signal: ac.signal });
  } catch (e) {
    const name = e && typeof e === "object" && "name" in e ? String(e.name) : "";
    die(name === "AbortError" ? "GitBrew request timed out" : String(e && e.message ? e.message : e), 1);
  } finally {
    clearTimeout(timer);
  }
}

async function readJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    die(`GitBrew returned non-JSON (${res.status}): ${text.slice(0, 200)}`, 1);
  }
}

function unwrap(body) {
  if (body && body.error) {
    const err = body.error.json ?? body.error;
    const msg = err && err.message ? err.message : JSON.stringify(err, null, 2);
    die(msg, 1);
  }
  return body.result?.data?.json ?? body.result?.data;
}

async function trpc(path, payload) {
  const res = await gitbrewFetch(`${url}/api/trpc/${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ json: payload }),
  });
  return unwrap(await readJson(res));
}

async function get(path, input) {
  const href = new URL(`${url}/api/trpc/${path}`);
  if (input !== undefined) href.searchParams.set("input", JSON.stringify({ json: input }));
  const res = await gitbrewFetch(href, { headers: { authorization: `Bearer ${token}` } });
  return unwrap(await readJson(res));
}

async function main() {
  if (cmd === "publish") {
    const dir = arg("dir");
    const repo = arg("repo");
    if (!dir || !repo) die("publish needs --dir and --repo owner/name");
    const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
    const playHtml = manifest.playHtml || "play.html";
    const playPath = join(dir, playHtml);
    if (!existsSync(playPath)) die(`missing ${playHtml}`, 1);
    const official = manifest.officialFiles || [];
    if (!Array.isArray(official) || official.length === 0) die("manifest.officialFiles is required", 1);
    const officialFiles = official.map((p) => {
      const fp = join(dir, p);
      if (!existsSync(fp)) die(`missing official file ${p}`, 1);
      return { path: p, content: readFileSync(fp, "utf8") };
    });
    const posted = await trpc("creators.publish", {
      id: manifest.id,
      title: manifest.title,
      intro: manifest.intro,
      githubRepo: repo,
      playHtml,
      playHtmlContent: readFileSync(playPath, "utf8"),
      officialFiles,
      aspect: manifest.aspect === "square" ? "square" : "phone",
    });
    console.log(JSON.stringify(posted, null, 2));
    return;
  }
  if (cmd === "edit") {
    const postId = arg("post");
    const titleEn = arg("title-en");
    const titleZh = arg("title-zh");
    if (!postId || !titleEn || !titleZh) die("edit needs --post u-login-slug --title-en --title-zh");
    const edited = await trpc("creators.editCopy", {
      postId,
      title: { en: titleEn, zh: titleZh },
      intro: { en: arg("intro-en"), zh: arg("intro-zh") },
    });
    console.log(JSON.stringify(edited, null, 2));
    return;
  }
  if (cmd === "mine") {
    const me = await get("auth.me");
    const login = me?.githubLogin;
    if (!login) die("GitHub token did not identify a user", 1);
    const page = await get("creators.get", { login });
    console.log(JSON.stringify(page, null, 2));
    return;
  }
  die("usage: node post.mjs publish|edit|mine ...");
}

main().catch((e) => die(String(e && e.message ? e.message : e), 1));

