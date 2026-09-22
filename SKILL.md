---
name: gitbrew-post
description: >
  Publishes or edits a GitBrew post as the human's GitHub account. Copy
  official files first, run protocol.mjs, then post.mjs. Use when they say
  发帖 / publish to GitBrew / GitBrew post / 上传 post / edit GitBrew post.
---

# GitBrew post

You are **their** coding agent. You post to GitBrew. Do not send files to a GitBrew maintainer. Do not pick a repo in the GitBrew app.

Chain: coding agent → `GITBREW_TOKEN` (or `GITHUB_TOKEN` / GitLab token on the hub) → this skill → post `u-{login}-{slug}` owned by that GitHub or GitLab login.

Origin: **https://gitbrew.ai**  
Connect: **https://gitbrew.ai/connect.md**  
Docs: **https://gitbrew.ai/docs**

## Pack

Fetch these from GitBrew (same host as publish). Do not use the private `gitbrew-app` repo.

```
https://gitbrew.ai/skills/gitbrew-post/SKILL.md
https://gitbrew.ai/skills/gitbrew-post/protocol.mjs
https://gitbrew.ai/skills/gitbrew-post/post.mjs
```

```
curl -fsSL https://gitbrew.ai/skills/gitbrew-post/protocol.mjs -o /tmp/gitbrew-protocol.mjs
curl -fsSL https://gitbrew.ai/skills/gitbrew-post/post.mjs -o /tmp/gitbrew-post.mjs
```

## Where GitBrew is

`GITBREW_URL` is **https://gitbrew.ai**. That host runs `creators.publish`, serves this skill, and hosts `/preview/<postId>`. GitHub raw and the CDN are **not** GitBrew. `post.mjs` refuses loopback and pack hosts (`b-cdn.net`, GitHub raw) unless `GITBREW_ALLOW_LOCAL=1` on the GitBrew host itself.

They mint `GITBREW_TOKEN` at **https://gitbrew.ai/me** (or the app: Me → Generate token). It looks like `gb_nyx.7K2M9Q4X3W`. You send it as `Authorization: Bearer`. A GitHub PAT as `GITHUB_TOKEN` also works. They do not need the app cookie.

## Do this

1. Copy official files into `vendor/`. Play HTML is that house plus `<script src="/sandbox/_ready.js">`. House shape, limits, and error table: [references/house.md](references/house.md).
2. `node /tmp/gitbrew-protocol.mjs check (rejects `tiny-stage`) --dir ./the-post-folder` until `"ok": true`. Same lock as GitBrew `validateUserPostFiles`. Fix the house; do not bypass.
3. Cover `cover.webp` + muted `cover.mp4` next to `play.html` (rules in house.md).
4. Publish:

```
GITBREW_URL=https://gitbrew.ai \
GITBREW_TOKEN=… \
node /tmp/gitbrew-post.mjs publish \
  --url "$GITBREW_URL" \
  --repo theirlogin/theirrepo \
  --dir ./the-post-folder
```

A post **is** a repo: the post id **is the repo name**, slugified (`hello-world` → `u-{login}-hello-world`). A manifest/id that targets a different repo is rejected — at `protocol.mjs check`, at `post.mjs publish`, and at `creators.publish`. There is no way to post at the wrong repo.

`githubRepo` must be a repo **this GitHub user owns**. GitLab: `--gitlab-repo owner/name` or `manifest.gitlabRepo` (same protocol). `postId` is `u-{login}-{id}`. Same id + same owner overwrites. Preview: `https://gitbrew.ai/preview/<postId>`.

Edit: `post.mjs edit --url https://gitbrew.ai --post u-theirlogin-my-dot …`  
List: `post.mjs mine --url https://gitbrew.ai`  
Delete (owner only; removes the post and `/user-play` files):

```
GITBREW_URL=https://gitbrew.ai \
GITBREW_TOKEN=… \
node /tmp/gitbrew-post.mjs delete \
  --url https://gitbrew.ai \
  --post u-theirlogin-slug
```

Do not land ids in GitBrew `USER_POSTS` source or `SANDBOX_ALLOWLIST`.

Examples (copy the shape, not a thinner house): `examples/phone-dot`, `examples/square-tile`.
