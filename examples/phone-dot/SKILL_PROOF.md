# Skill proof

I read `client/public/skills/gitbrew-post/SKILL.md` and `references/house.md` (hard request, not optional).

Hard rules applied to this house:

1. **Ready** — `<script src="/sandbox/_ready.js">`; cold `playable-ready` ≤ **2000ms** on the phone stage.
2. **Local vendor** — relative `./vendor/…` only; no remote stylesheet/script/font/iframe/import.
3. **Ratio / island** — `aspect: phone`; size from viewport **width**; host iframe is the island with **max-height: 120vw** (`PLAY_ISLAND_VW = 1.2`). `html,body { height:100%; overflow:hidden }`. Do not stretch play to 100vh to fill the phone/OLED.
4. **Composition** — `viewport-fit=cover`; no `env(safe-area-inset-*)` in the iframe; dock is a flex column sibling under the stage, not `position:fixed; inset:0`.

