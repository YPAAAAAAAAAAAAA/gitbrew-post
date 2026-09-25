# House / JEV units

GitBrew `validateUserPostFiles` errors map onto named JEV checklist units. Agents should fix the failed unit, not bypass the gate.

| unit | protocol lines |
| --- | --- |
| `id` | `id must be a short slug`, id too long / unsafe, `post id must be the repo name ("…")`, post owned |
| `official_files` | `need official html`, `too thin`, `too many official files`, `bad official file`, size |
| `play_html` | missing/too large play html, `rebuilt wrapper`, `does not reference`, `hop`, `demolished house`, `hide-stage`, `opacity-0 boot` |
| `ready_hook` | `missing /sandbox/_ready.js`, ready.js must be host path |
| `remote` | `remote stylesheet` / `script` / `font` / `widget` / iframe / import |
| `aspect` | `camera-landscape`, `stretch-canvas`, `square stage must be 1:1` |
| `composition` | `composition-viewport` / `fill` / `safe-area` / `dock` / `overlay` |
| `title` | `title must be bilingual and ≤42`, intro limits |
| `cover` | required coverStill+coverLoop; `cover-still` / `cover-loop` / fps/dims — blank, size, 390×844 (no GitHub OG) |
| `ready` | probeUserPlayReady / readyMs — no `playable-ready` |
| `cdn` | R2/Bunny upload failures |

Feedback shape: see SKILL.md **JEV checklist units**.
