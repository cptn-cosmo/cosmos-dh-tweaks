# Cosmo's Daggerheart Tweaks

A Foundry VTT v14 module that adds quality-of-life tweaks for the **Daggerheart** system.

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
Reduces screen clutter by optimizing the Countdown Tracker widget:
* **For Players**: Hides the countdown widget completely if there are no active/visible countdowns.
* **For GMs**: Minimizes the countdown widget to a tiny square featuring a `+` icon when empty. Clicking the `+` icon opens the system's native Countdown Edit dialog.

### 4. Fear Tracker Customizations (On by default)
Enhances the Daggerheart Fear Tracker with improved layout options, sizing, and a convenient context menu:
* **Clean Borderless Layout**: Hides the Fear Tracker's title bar for a cleaner look. When the title bar is hidden, you can still move the tracker by clicking and dragging any empty space on it.
* **Right-Click Context Menu**: Right-clicking the Fear Tracker opens a quick-access menu to lock/unlock position, reset position or scale, and scale the UI.
* **Position Locking**: Lock the Fear Tracker's position to prevent accidental dragging or resizing.
* **Flexible Sizing & Scaling**: Scale the Fear Tracker and all of its elements (70%, 85%, 100%, 115%, or 130%) to fit your screen.
* **Perfect-Fit Auto-Resizing**: Dynamically resizes the tracker window to perfectly fit the current number of Fear tokens/rows without leaving empty borders or margins.
* **Position & Scale Resets**: Settings and buttons to instantly restore the tracker back to its default position and scale.

## Configuration

All features can be toggled on or off independently under **Configure Settings** > **Cosmo's Daggerheart Tweaks**. 
* The *Spotlight Request Canvas Indicator* is grouped together with the HUD button option.
* The Fear Tracker settings allow you to hide the title bar, scale the tracker, or reset its scale and position. Position locking can also be toggled directly from the tracker's right-click context menu.


## Installation

In Foundry's **Install Module** dialog, paste this manifest URL:

```
https://github.com/cptn-cosmo/cosmos-dh-tweaks/releases/latest/download/module.json
```

## Releasing

Bump `version` in `module.json`, commit, then push an annotated tag matching it:

```sh
git tag -a v1.2.0 -m "v1.2.0" -m "- change one" -m "- change two" && git push origin v1.2.0
```

The release workflow builds the zip, attaches it and the manifest to a GitHub release (tag message body becomes the notes), and registers the version with the Foundry package admin if the `FOUNDRYVTT_PACKAGE_RELEASE_TOKEN` secret is set.
