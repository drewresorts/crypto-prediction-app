# Quay Quest: Legend of the Nitty Amulets

A pixel-art, turn-based party RPG set between a South London estate and the small towns of the English provinces.
Kaz and Biggz go "cunch" to run a county-lines operation out of a house in Grimsworth, and find a Nitty Sage
living in the shed. He tells them about the **Nitty Amulet**: an off-white stone on an intricate copper setting
that grants power beyond your wildest dreams at the cost of the wearer's soul. Billionaire developer **Pulon Wrong**
wants it, and wants their estate. Find it first and destroy it.

Open `index.html` in a browser (or `dist/quay-quest.html`, a single self-contained file). No build step, no server.

## Controls
| Key | Action |
| --- | --- |
| Arrows / WASD | Move, pick menu items |
| Z / Enter / Space | Talk, confirm |
| X / Esc | Open menu, go back. Hold to fast-forward text |
| M | Sound on/off |

On phones a touch D-pad and A/B buttons appear under the screen. The game saves to the browser (Menu > Save,
and automatically on travel and rest).

## What's in it
- **Party system**: Kaz (Trapper), Biggz (Enforcer), Gaz (Nitty Knight) and Shay (Fraudster), each with their own
  stats, growth, six learnable skills, and weapon / garms / drip slots. Levelling gives stat growth, new skills and
  skill points; spend SP to rank skills up (+22% power per rank).
- **Turn-based combat**: speed-ordered turns, NRG-costed skills, buffs/debuffs (ATK, DEF, SPD, stun, sickness,
  taunt), area attacks, revives, stealing, items, guarding, fleeing. 30 enemy types, 9 bosses with a two-phase finale.
- **Five towns**: the Ends (Crestwell Estate), Grimsworth, Dregthorpe-on-Sea, Lower Piddlebrook and Blackwater Quay,
  with interiors, shops, chests, side quests and random encounters. Trains between towns take a day.
- **The trade**: buy product from Unc, sell it to customers (speech bubbles) and bulk buyers in the towns. Each town
  pays best for something different and prices move daily. Bag upgrades raise how much you can carry. Selling raises
  the town's **heat**; too hot and the Feds turn up.
- **Community trust**: the only thing keeping Wrong's bulldozers off the estate. It drains every day and when you deal
  or fight on the estate, and rises with donations at the community centre, side quests and beating Wrong's people.
  If it hits zero, the council signs and it's game over.
- **Two endings**, depending on what you do with the amulet.

## Art and sound
Every character, object, item and effect sprite was found with the
[Pixel Search](https://huggingface.co/spaces/cfahlgren1/pixel-search) Hugging Face space, which indexes the CC0
dataset [`Angais/pixel-art-atlas-1.4m`](https://huggingface.co/datasets/Angais/pixel-art-atlas-1.4m).
`tools/pixel_search.py` runs the space's own query pipeline (its published term vectors, subject vectors and caption
index) offline; `tools/picks.txt` records the exact search query and result rank for each of the 229 sprites, and
`assets/sprites.json` lists each one's dataset sprite id and caption. `tools/build_atlas.py` rebuilds
`assets/atlas.png` and `js/atlas.js` from those picks.

Ground, wall and roof tiles and the battle backdrops are drawn procedurally in `js/tiles.js` (the dataset holds single
objects, not tiling terrain). Music and sound effects are synthesised in the browser. The text font is a built-in 5x7
bitmap face.

## Code layout
| File | What |
| --- | --- |
| `js/engine.js` | Canvas, bitmap font, input, dialogue, menus, timers, chip-synth audio, saves |
| `js/tiles.js` | Procedural terrain and battle backgrounds |
| `js/data.js` | Characters, skills, items, enemies, encounter tables, shops, towns, music |
| `js/game.js` | Game state, stats, levelling, inventory, trade prices, days, trust |
| `js/world.js` | Map container, movement, NPCs, encounters, HUD |
| `js/battle.js` | Turn-based battles |
| `js/menus.js` | Pause menu, party screens, shops, trading, trains, title |
| `js/story.js` | Cutscenes, quest beats, customers, Feds, endings |
| `js/maps.js` | All map layouts |

`node tools/check_maps.js <dir>` renders every map and checks that every door, NPC and object is reachable and that
nothing references a missing sprite, item, skill or enemy. `python3 tools/build_single.py` regenerates `dist/`.

A work of fiction and satire.
