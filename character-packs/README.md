# NBA character packs

Generated packs for the desktop companion app.

## Packs

- `spurs-gpt-image-wemby/`
- `spurs-pixel-shrimp/`
- `knicks-pixel-shrimp/`

Each pack follows the app's custom character format:

```text
pack.json
idle.png
watch.png
cheer.png
sad.png
flag.png
sleep.png
dance.png
```

All mood PNGs are `220x220`, RGBA, and have transparent corners.

## Installed location

The same packs were copied into:

```text
~/Library/Application Support/fanshrimp-nba/characters/
```

Open the app settings, click refresh if needed, then choose `Spurs Pixel Shrimp`
or `Knicks Pixel Shrimp`.

## Design note

These are team-inspired fan sprites: they use basketball colors and city
initial patches, but avoid copying official NBA logos or wordmarks. This keeps
the assets simpler, readable at the companion window size, and easier to ship.

`spurs-gpt-image-wemby/` is a GPT-Image generated Spurs star-player pack based
on a Victor Wembanyama-inspired chibi figurine. The source GPT-Image outputs
are kept in `_sources/`; the app-ready files are the seven PNGs in the pack
root.

The best fit for the current code is pixel pet style because `.shrimp-img`
already uses `image-rendering: pixelated`, the character window is small, and
the product identity is "basketball shrimp". Other viable directions:

- 3D blind-box chibi: more premium, but needs generated image consistency work.
- Player doll: stronger NBA signal, but more brittle across roster changes.
- Pet mascot: best long-term identity; can add team skins without changing the core character.
