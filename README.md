# GitBrew post skill

Public pack for a creator’s coding agent. No GitHub login required to read these files.

- [SKILL.md](https://raw.githubusercontent.com/YPAAAAAAAAAAAAA/gitbrew-post/main/SKILL.md)
- [protocol.mjs](https://raw.githubusercontent.com/YPAAAAAAAAAAAAA/gitbrew-post/main/protocol.mjs)
- [post.mjs](https://raw.githubusercontent.com/YPAAAAAAAAAAAAA/gitbrew-post/main/post.mjs)
- [phone example](https://raw.githubusercontent.com/YPAAAAAAAAAAAAA/gitbrew-post/main/examples/phone-dot/play.html)
- [square example](https://raw.githubusercontent.com/YPAAAAAAAAAAAAA/gitbrew-post/main/examples/square-tile/play.html)

```
curl -fsSL https://raw.githubusercontent.com/YPAAAAAAAAAAAAA/gitbrew-post/main/protocol.mjs -o /tmp/gitbrew-protocol.mjs
curl -fsSL https://raw.githubusercontent.com/YPAAAAAAAAAAAAA/gitbrew-post/main/post.mjs -o /tmp/gitbrew-post.mjs
node /tmp/gitbrew-protocol.mjs check --dir ./the-post-folder
```

`GITBREW_URL` is the GitBrew that has `/api/trpc/creators.publish`. This repo is the pack, not GitBrew. Do not pass these GitHub URLs to `post.mjs --url`.
