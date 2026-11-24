# Cosmo's Daggerheart Tweaks

A Foundry VTT v14 module that adds quality-of-life tweaks for the **Daggerheart** system.

## Requirements

* Foundry VTT v14
* The [Daggerheart](https://github.com/Foundryborne/daggerheart) system (tested with 2.12.8)
* Optional: the *Daggerheart Core Rulebook* module (`daggerheart-core`) for the sheet theme and token ring options

## Features

### 1. Token HUD Spotlight (On by default)
Adds a new Spotlight button directly to the default Token HUD menu:
* **Works Everywhere**: Spotlight can be requested, granted, and taken both in and out of combat (an active encounter is not required).
* **For Players**: Allows requesting or cancelling a spotlight request for their character. Out-of-combat requests are saved securely on the character actor.
* **For GMs**: Allows granting spotlight to or removing spotlight from any token. Toggling spotlight on a token will automatically clear its active spotlight request.
* **Real-time Updates**: The HUD button automatically reflects status changes in real-time if updated via the combat tracker, canvas settings, or other players.

### 2. Spotlight Request Canvas Indicator (On by default)
Displays a visual indicator on the canvas to make managing spotlight requests easier for the GM:
* **For GMs**: Shows a small, gold hand-sparkles badge overlay in the top-right corner of any token that is currently requesting spotlight.
* **Canvas Synchronization**: Instantly appears or disappears as players toggle their spotlight requests.

### 3. Minimal Countdown UI (On by default)
For GMs, minimizes the empty Countdown Tracker to a tiny square featuring a `+` icon. Clicking the `+` icon opens the system's native Countdown Edit dialog. (Hiding the empty tracker from players is built into the Daggerheart system.)

### 4. Fear Tracker Appearance
Restyle the system's Fear Tracker without replacing it. The GM picks the look for everyone:
* **Color gradient**: System Default, Crimson, Ember, Gold, Emerald, Frost, Violet, Rose, Shadow, or a custom start/end color. Tokens step through the gradient and the bar fades along it, like the system default.
* **Icon**: 18 Font Awesome icons (Skull is the system default), or any Font Awesome icon typed in by name.
* **Shape**: Circle (system default), Squircle, or Square tokens.
* **Max Fear Glow** (off by default): The tracker pulses when Fear reaches the world's maximum, including homebrew max values other than 12.

### 5. Daggerheart Core Rulebook Look (Requires the `daggerheart-core` module)
Switch to the sheet themes and token rings that ship with the Daggerheart Core Rulebook module from one place:
* **Sheet Theme**: Sets the default theme for all users (Core, The Witherwild, Five Banners Burning, Beast Feast, The Age of Umbra, Motherboard, Colossus of the Drylands) for every actor sheet type at once, and reopens open sheets so the change shows immediately.
* **Token Ring**: Picks one of the module's dynamic token rings. Requires a reload.
* Sheets given their own theme via *Configure Sheet* keep it. The token ring follows Foundry's *Dynamic Token Ring* setting. The options only appear when `daggerheart-core` is active.

### 6. Daggerheart Pause Icon (On by default)
Replaces Foundry's spinning pause icon with the static Daggerheart emblem from the system, and stops the "Game Paused" banner from pulsing.
* **No bundled artwork**: This module does not ship the Daggerheart logo or any other artwork. It only points the pause icon at the emblem the installed Daggerheart system already provides (`systems/daggerheart/assets/logos/DaggerheartLogo.webp`). Likewise, the sheet themes and token rings in feature 5 are the ones the `daggerheart-core` module provides.

### 7. Statblock Sheets
A replacement sheet for adversaries and environments that looks like the statblocks in the rulebook, using the same fonts, sizes and colors as the system's statblock embeds. It comes in a light (book) and a dark version: it follows the theme picked in *Configure Sheet*, or Foundry's interface theme when none is picked.
* **The statblock**: Uppercase name, the italic "Tier 3 Solo" line with its source, the description, Motives & Tactics (or Impulses), and the stat box with Difficulty, Thresholds, HP and Stress, the attack (`ATK: +3 | Claws: Melee | 2d10+4 phy`) and Experiences. Environments show Difficulty and Potential Adversaries. No portrait, no extra boxes.
* **Features as in the book**: A FEATURES heading with features written as *Name - Passive:* and their text running on after it. Click a name to collapse or expand it. The system's settings for showing descriptions expanded by default still apply.
* **Still playable**: A slim tab bar above the statblock (Effects, Notes, Potential Adversaries, Reaction Roll, sheet settings) and HP/Stress boxes below it. Features with actions get a line of text buttons under them to use each action, with the action's uses counter attached (click to use one, right-click to give one back). Click the attack name to roll it (right-click for damage and chat), right-click a feature to use, edit or delete it, and click an experience to post it to chat. Feature resources show next to the feature name.
* **Choosing it**: Pick *Statblock (Cosmo's Tweaks)* for a single actor via *Configure Sheet*, or make it the default for every adversary and environment in Foundry's *Sheet Settings* (Configure Settings > Core).

### 8. Colossus Token Linking (Off by default)
Keeps the framework and part tokens of a colossus adversary together on the canvas:
* **Rearrange freely**: If the tokens still touch (edges or corners) after a move, only the moved token moves.
* **Snapping**: A token dropped within *Colossus Snap Distance* grid spaces of the rest (default 1; on gridless scenes, one space is the scene's grid size) slides flush against the colossus once it lands, preferring a spot that reconnects the whole colossus.
* **Move together**: Drag a token further away and the rest of the colossus follows along the same path, keeping its formation. Followers ignore walls so the formation doesn't break.
* To move the colossus a short distance, select all of its tokens and move them together.

## Configuration

The GM opens **Configure Settings** > **Cosmo's Daggerheart Tweaks** > **Open Settings**. Every option applies to the whole world (GMs and players alike). The settings window has a tab per area:
* **Fear Tracker**: color gradient, icon, token shape, and the max-fear glow.
* **Spotlight**: Token HUD spotlight button and the GM's request indicator.
* **Sheets & Tokens**: Colossus token linking, plus the Daggerheart Core Rulebook sheet theme and token ring (only shown when `daggerheart-core` is active).
* **Interface**: Minimal Countdown UI and the Daggerheart pause icon.

Custom color and icon fields only appear when *Custom* is selected.

## Installation

In Foundry's **Install Module** dialog, paste this manifest URL:

```
https://github.com/cptn-cosmo/cosmos-dh-tweaks/releases/latest/download/module.json
```

## Upgrading from 1.x

* All options moved into the **Open Settings** window and now apply to the whole world. Previously per-user Fear Tracker choices reset to their defaults once.
* The Fear Tracker window tweaks (hidden title bar, scaling, position lock, right-click menu) were removed. The module now restyles the system's own Fear Tracker instead of replacing it, so the system's own positioning options apply.

## Releasing

Bump `version` in `module.json`, commit, then push an annotated tag matching it:

```sh
git tag -a vX.Y.Z -m "vX.Y.Z" -m "- change one" -m "- change two" && git push origin vX.Y.Z
```

The release workflow builds the zip, attaches it and the manifest to a GitHub release (tag message body becomes the notes), and registers the version with the Foundry package admin if the `FOUNDRYVTT_PACKAGE_RELEASE_TOKEN` secret is set.
