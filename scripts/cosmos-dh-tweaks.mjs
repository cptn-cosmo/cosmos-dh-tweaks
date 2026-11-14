const MODULE_ID = "cosmos-dh-tweaks";

// Fear color gradients as [start, end]: tokens step from start to end across the row and the bar
// fades from a darkened start to end, like the system default. "default" leaves the system's look untouched.
const FEAR_THEMES = {
    default: null,
    crimson: ["#7f0a1a", "#e11d48"],
    ember: ["#a3170f", "#f59e0b"],
    gold: ["#8a4b08", "#facc15"],
    emerald: ["#065f46", "#84cc16"],
    frost: ["#1e3a8a", "#67e8f9"],
    violet: ["#3b0a8f", "#e040fb"],
    rose: ["#9d174d", "#fda4af"],
    shadow: ["#18181b", "#71717a"]
};

// Fear token icons. "skull" is the system default.
const FEAR_ICONS = {
    skull: "fa-solid fa-skull",
    skullCrossbones: "fa-solid fa-skull-crossbones",
    ghost: "fa-solid fa-ghost",
    eye: "fa-solid fa-eye",
    spider: "fa-solid fa-spider",
    dragon: "fa-solid fa-dragon",
    fire: "fa-solid fa-fire",
    bolt: "fa-solid fa-bolt",
    moon: "fa-solid fa-moon",
    heartCrack: "fa-solid fa-heart-crack",
    biohazard: "fa-solid fa-biohazard",
    radiation: "fa-solid fa-radiation",
    hourglass: "fa-solid fa-hourglass-half",
    crow: "fa-solid fa-crow",
    mask: "fa-solid fa-masks-theater",
    handFist: "fa-solid fa-hand-fist",
    star: "fa-solid fa-star",
    circle: "fa-solid fa-circle"
};

const FEAR_SHAPES = ["circle", "squircle", "square"];

const FA_STYLE = /^(fa-(solid|regular|light|thin|duotone|brands|sharp)|fas|far|fal|fat|fad|fab)$/i;

// Accept only Font Awesome class lists ("fa-ghost", "fa-solid fa-ghost", or just "ghost").
// Anything else falls back to the system skull.
function sanitizeFearIcon(value) {
    let classes = String(value ?? "").trim().split(/\s+/).filter(Boolean);
    if (classes.length === 1 && /^[a-z0-9-]+$/i.test(classes[0]) && !classes[0].startsWith("fa")) classes = [`fa-${classes[0]}`];
    classes = classes.filter(c => /^fa[a-z0-9-]*$/i.test(c));
    if (!classes.some(c => c.startsWith("fa-") && !FA_STYLE.test(c))) return FEAR_ICONS.skull;
    if (!classes.some(c => FA_STYLE.test(c))) classes.unshift("fa-solid");
    return classes.join(" ");
}

function fearSetting(key) {
    return game.settings.get(MODULE_ID, key);
}

function rerenderFearTracker() {
    if (ui.resources?.rendered) ui.resources.render();
}

Hooks.once("init", () => {
    // Register settings
    game.settings.register(MODULE_ID, "tokenHudSpotlight", {
        name: "COSMOS_DH_TWEAKS.Settings.TokenHudSpotlight.Name",
        hint: "COSMOS_DH_TWEAKS.Settings.TokenHudSpotlight.Hint",
        scope: "world",
        config: false,
        type: Boolean,
        default: true
    });

    game.settings.register(MODULE_ID, "spotlightRequestIndicator", {
        name: "COSMOS_DH_TWEAKS.Settings.SpotlightRequestIndicator.Name",
        hint: "COSMOS_DH_TWEAKS.Settings.SpotlightRequestIndicator.Hint",
        scope: "world",
        config: false,
        type: Boolean,
        default: true,
        onChange: () => {
            if (canvas.ready) {
                for (const token of canvas.tokens.placeables) {
                    if (token.refresh) token.refresh();
                    else if (token.renderFlags) token.renderFlags.set({ refreshState: true });
                }
            }
        }
    });

    game.settings.register(MODULE_ID, "minimalCountdownUI", {
        name: "COSMOS_DH_TWEAKS.Settings.MinimalCountdownUI.Name",
        hint: "COSMOS_DH_TWEAKS.Settings.MinimalCountdownUI.Hint",
        scope: "world",
        config: false,
        type: Boolean,
        default: true,
        onChange: () => {
            if (ui.countdowns) ui.countdowns.render();
        }
    });

    const L = "COSMOS_DH_TWEAKS.Settings";

    game.settings.register(MODULE_ID, "fearColorTheme", {
        name: `${L}.FearColorTheme.Name`,
        hint: `${L}.FearColorTheme.Hint`,
        scope: "world",
        config: false,
        type: String,
        choices: Object.fromEntries([...Object.keys(FEAR_THEMES), "custom"].map(k => [k, `${L}.FearColorTheme.Choices.${k}`])),
        default: "default",
        onChange: rerenderFearTracker
    });

    game.settings.register(MODULE_ID, "fearCustomColor", {
        name: `${L}.FearCustomColor.Name`,
        hint: `${L}.FearCustomColor.Hint`,
        scope: "world",
        config: false,
        type: new foundry.data.fields.ColorField({ nullable: false, initial: "#0947b3" }),
        default: "#0947b3",
        onChange: rerenderFearTracker
    });

    game.settings.register(MODULE_ID, "fearCustomColorEnd", {
        name: `${L}.FearCustomColorEnd.Name`,
        hint: `${L}.FearCustomColorEnd.Hint`,
        scope: "world",
        config: false,
        type: new foundry.data.fields.ColorField({ nullable: false, initial: "#c701fc" }),
        default: "#c701fc",
        onChange: rerenderFearTracker
    });

    game.settings.register(MODULE_ID, "fearIcon", {
        name: `${L}.FearIcon.Name`,
        hint: `${L}.FearIcon.Hint`,
        scope: "world",
        config: false,
        type: String,
        choices: Object.fromEntries([...Object.keys(FEAR_ICONS), "custom"].map(k => [k, `${L}.FearIcon.Choices.${k}`])),
        default: "skull",
        onChange: rerenderFearTracker
    });

    game.settings.register(MODULE_ID, "fearCustomIcon", {
        name: `${L}.FearCustomIcon.Name`,
        hint: `${L}.FearCustomIcon.Hint`,
        scope: "world",
        config: false,
        type: String,
        default: "fa-solid fa-skull",
        onChange: rerenderFearTracker
    });

    game.settings.register(MODULE_ID, "fearTokenShape", {
        name: `${L}.FearTokenShape.Name`,
        hint: `${L}.FearTokenShape.Hint`,
        scope: "world",
        config: false,
        type: String,
        choices: Object.fromEntries(FEAR_SHAPES.map(k => [k, `${L}.FearTokenShape.Choices.${k}`])),
        default: "circle",
        onChange: rerenderFearTracker
    });

    game.settings.register(MODULE_ID, "fearMaxGlow", {
        name: `${L}.FearMaxGlow.Name`,
        hint: `${L}.FearMaxGlow.Hint`,
        scope: "world",
        config: false,
        type: Boolean,
        default: false,
        onChange: rerenderFearTracker
    });

    // Override the Countdown class in CONFIG
    const OriginalCountdowns = CONFIG.ui.countdowns;
    if (OriginalCountdowns) {
        class CosmoDhTweaksCountdowns extends OriginalCountdowns {
            async _onRender(context, options) {
                await super._onRender(context, options);
                
                if (!game.settings.get(MODULE_ID, "minimalCountdownUI")) {
                    this.element.classList.remove("cosmo-minimal-countdown");
                    const addBtn = this.element.querySelector(".cosmo-add-countdown");
                    if (addBtn) addBtn.remove();
                    return;
                }

                // Count the countdowns this user can see, the same way the system does (its helper is private).
                const countdowns = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns)?.countdowns ?? {};
                const count = Object.values(countdowns).filter(countdown => countdown?.visible).length;
                const hasCountdowns = count > 0;

                if (game.user.isGM) {
                    if (!hasCountdowns) {
                        this.element.classList.add("cosmo-minimal-countdown");
                        let addBtn = this.element.querySelector(".cosmo-add-countdown");
                        if (!addBtn) {
                            const header = this.element.querySelector("header.countdowns-header");
                            if (header) {
                                addBtn = document.createElement("a");
                                addBtn.className = "cosmo-add-countdown";
                                addBtn.setAttribute("data-tooltip", game.i18n.localize("COSMOS_DH_TWEAKS.Countdown.add"));
                                addBtn.innerHTML = '<i class="fa-solid fa-plus"></i><span class="cosmo-add-label">' + game.i18n.localize("COSMOS_DH_TWEAKS.Countdown.add") + '</span>';
                                addBtn.addEventListener("click", (e) => {
                                    e.preventDefault();
                                    new game.system.api.applications.ui.CountdownEdit().render(true);
                                });
                                header.appendChild(addBtn);
                            }
                        }
                    } else {
                        this.element.classList.remove("cosmo-minimal-countdown");
                        const addBtn = this.element.querySelector(".cosmo-add-countdown");
                        if (addBtn) addBtn.remove();
                    }
                }
                // Players: the system already hides the widget when they can't see any countdowns.
            }
        }
        CONFIG.ui.countdowns = CosmoDhTweaksCountdowns;
    }
});

Hooks.on("renderTokenHUD", (tokenHUD, html, tokenData) => {
    if (!game.settings.get(MODULE_ID, "tokenHudSpotlight")) return;

    const token = tokenHUD.object;
    if (!token) return;

    const isGM = game.user.isGM;
    let active = false;

    if (isGM) {
        // Determine if currently spotlighted
        const isSpotlighted = game.combat 
            ? (game.combat.combatant?.tokenId === token.id)
            : game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.SpotlightTracker)?.spotlightedTokens.has(token.document.uuid);
        active = isSpotlighted;
    } else {
        // Players: only proceed if they own the token
        if (!token.document.isOwner) return;
        const combatant = token.combatant;
        active = combatant 
            ? (combatant.system.spotlight?.requesting || false)
            : (token.actor?.getFlag(MODULE_ID, "requestingSpotlight") || false);
    }

    const title = isGM
        ? (active ? game.i18n.localize("COSMOS_DH_TWEAKS.Spotlight.take") : game.i18n.localize("COSMOS_DH_TWEAKS.Spotlight.grant"))
        : (active ? game.i18n.localize("COSMOS_DH_TWEAKS.Spotlight.cancel") : game.i18n.localize("COSMOS_DH_TWEAKS.Spotlight.request"));

    const activeClass = active ? "active" : "";
    const iconClass = active ? "fa-hand-sparkles" : "fa-hand";

    // Build the button element
    const button = document.createElement("div");
    button.className = `control-icon cosmo-spotlight-hud-btn ${activeClass}`;
    button.setAttribute("title", title);
    button.innerHTML = `<i class="fa-solid ${iconClass}"></i>`;

    button.addEventListener("click", async (event) => {
        event.preventDefault();
        
        if (isGM) {
            // Trigger GM spotlight toggle
            if (game.system.api?.macros?.spotlightCombatant) {
                await game.system.api.macros.spotlightCombatant(token);
            } else {
                // Fallback manual update if macro is missing
                const combatantCombat = token.combatant
                    ? game.combat
                    : game.combats.find(combat => combat.combatants.some(x => x.token && x.token.id === token.document.id));
                if (combatantCombat) {
                    const combatant = combatantCombat.combatants.find(x => x.token.id === token.document.id);
                    if (!combatantCombat.active) {
                        await combatantCombat.activate();
                        if (combatantCombat.combatant?.id !== combatant.id) ui.combat.setCombatantSpotlight(combatant.id);
                    } else {
                        ui.combat.setCombatantSpotlight(combatant.id);
                    }
                } else {
                    if (game.combat) await ui.combat.clearTurn();
                    const spotlightTracker = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.SpotlightTracker);
                    const isSpotlighted = spotlightTracker.spotlightedTokens.has(token.document.uuid);
                    if (!isSpotlighted) {
                        // Clear previous spotlight manually
                        const previouslySpotlightedUuid = spotlightTracker.spotlightedTokens.size > 0 ? spotlightTracker.spotlightedTokens.first() : null;
                        if (previouslySpotlightedUuid) {
                            spotlightTracker.updateSource({ spotlightedTokens: [] });
                            await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.SpotlightTracker, spotlightTracker);
                            const previousToken = await foundry.utils.fromUuid(previouslySpotlightedUuid);
                            if (previousToken?.object) previousToken.object.renderFlags.set({ refreshTurnMarker: true });
                        }
                    }
                    spotlightTracker.updateSource({
                        spotlightedTokens: isSpotlighted ? [] : [token.document.uuid]
                    });
                    await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.SpotlightTracker, spotlightTracker);
                    token.renderFlags.set({ refreshTurnMarker: true });
                }
            }

            // Clear spotlight request indicator if GM grants/takes spotlight
            if (token.actor?.getFlag(MODULE_ID, "requestingSpotlight")) {
                await token.actor.setFlag(MODULE_ID, "requestingSpotlight", false);
            }
        } else {
            // Player requesting / cancelling spotlight
            const combatant = token.combatant;
            if (combatant) {
                const isRequesting = combatant.system.spotlight.requesting;
                const characters = game.combat.turns?.filter(x => !x.isNPC) ?? [];
                const orderValues = characters.map(character => character.system.spotlight.requestOrderIndex || 0);
                const maxRequestIndex = Math.max(...orderValues, 0);

                await combatant.update({
                    'system.spotlight': {
                        requesting: !isRequesting,
                        requestOrderIndex: !isRequesting ? maxRequestIndex + 1 : 0
                    }
                });
            } else {
                // Out of combat request
                const isRequesting = !!token.actor?.getFlag(MODULE_ID, "requestingSpotlight");
                await token.actor?.setFlag(MODULE_ID, "requestingSpotlight", !isRequesting);
            }
        }
        
        // Rerender HUD to update icon state
        tokenHUD.render(true);
    });

    // In Foundry, HUD HTML can be jQuery. Find col.left and append.
    // Supports both jQuery and HTMLElement.
    const leftCol = html.find ? html.find('.col.left') : html.querySelector('.col.left');
    if (leftCol && leftCol.append) {
        leftCol.append(button);
    } else if (leftCol) {
        leftCol.appendChild(button);
    }
});

// Re-render Token HUD if open and its token is updated in combatant spotlight
Hooks.on("updateCombatant", (combatant, change, options, userId) => {
    if (!game.settings.get(MODULE_ID, "tokenHudSpotlight")) return;
    if (canvas.tokens.hud.rendered && canvas.tokens.hud.object?.id === combatant.tokenId) {
        canvas.tokens.hud.render(true);
    }
});

// Re-render Token HUD if out-of-combat spotlight settings change
Hooks.on("updateSetting", (setting, change, options, userId) => {
    if (!game.settings.get(MODULE_ID, "tokenHudSpotlight")) return;
    const key = setting.key || setting.id;
    if (key === "daggerheart.SpotlightTracker" || key === `${CONFIG.DH.id}.SpotlightTracker`) {
        if (canvas.tokens.hud.rendered) {
            canvas.tokens.hud.render(true);
        }
    }
});

// Trigger token refresh when Actor changes their requestingSpotlight flag
Hooks.on("updateActor", (actor, change, options, userId) => {
    if (!game.ready) return;
    const tokens = actor.getActiveTokens();
    for (const token of tokens) {
        if (token.refresh) token.refresh();
        else if (token.renderFlags) token.renderFlags.set({ refreshState: true });
    }
    if (canvas.tokens.hud.rendered && canvas.tokens.hud.object?.actor?.id === actor.id) {
        canvas.tokens.hud.render(true);
    }
});

// Trigger token refresh when Token changes
Hooks.on("updateToken", (tokenDoc, change, options, userId) => {
    if (!game.ready) return;
    const token = tokenDoc.object;
    if (token) {
        if (token.refresh) token.refresh();
        else if (token.renderFlags) token.renderFlags.set({ refreshState: true });
    }
    if (canvas.tokens.hud.rendered && canvas.tokens.hud.object?.id === tokenDoc.id) {
        canvas.tokens.hud.render(true);
    }
});

// Render the GM's spotlight request indicator on the token canvas
Hooks.on("refreshToken", (token, options) => {
    if (!game.ready) return;
    if (!game.user?.isGM) return;
    if (!game.settings.get(MODULE_ID, "tokenHudSpotlight")) return;
    if (!game.settings.get(MODULE_ID, "spotlightRequestIndicator")) {
        if (token.cosmoSpotlightIndicator) {
            token.cosmoSpotlightIndicator.visible = false;
        }
        return;
    }

    const inCombat = !!token.combatant;
    const requestingInCombat = token.combatant?.system.spotlight?.requesting;
    const requestingOutOfCombat = token.actor?.getFlag(MODULE_ID, "requestingSpotlight");
    const isRequesting = inCombat ? requestingInCombat : requestingOutOfCombat;

    if (isRequesting) {
        // Safe check to reconstruct if it was destroyed or detached
        const isDestroyed = token.cosmoSpotlightIndicator && (token.cosmoSpotlightIndicator.destroyed || !token.children.includes(token.cosmoSpotlightIndicator));
        if (isDestroyed) {
            token.cosmoSpotlightIndicator = null;
        }

        if (!token.cosmoSpotlightIndicator) {
            const container = new PIXI.Container();
            container.name = "cosmoSpotlightIndicator";

            // Draw a background circle (gold)
            const bg = new PIXI.Graphics();
            bg.beginFill(0xc5a45e, 0.9);
            bg.lineStyle(1.5, 0xffffff, 1);
            bg.drawCircle(0, 0, 11);
            bg.endFill();
            container.addChild(bg);

            // FontAwesome hand-sparkles SVG data URI
            const handSparklesSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" width="640" height="512">
  <path fill="#ffffff" d="M320 0c17.7 0 32 14.3 32 32l0 208c0 8.8 7.2 16 16 16s16-7.2 16-16l0-176c0-17.7 14.3-32 32-32s32 14.3 32 32l0 176c0 8.8 7.2 16 16 16s16-7.2 16-16l0-112c0-17.7 14.3-32 32-32s32 14.3 32 32l0 178.2c-19.2 5.4-34.7 20.4-40.4 40.3l-6.5 22.7-22.7 6.5c-25.2 7.2-42.5 30.2-42.5 56.4 0 22.1 12.4 42 31.4 51.9-27.5 17.8-60.2 28.1-95.4 28.1l-19.2 0c-59.6 0-116.9-22.9-160-64L76.4 341c-16-15.2-16.6-40.6-1.4-56.6s40.6-16.6 56.6-1.4l60.5 57.6c0-1.5-.1-3.1-.1-4.6l0-272c0-17.7 14.3-32 32-32s32 14.3 32 32l0 176c0 8.8 7.2 16 16 16s16-7.2 16-16l0-208c0-17.7 14.3-32 32-32zm-7.3 326.6c-1.1-3.9-4.7-6.6-8.7-6.6s-7.6 2.7-8.7 6.6l-7.3 25.4-25.4 7.3c-3.9 1.1-6.6 4.7-6.6 8.7s2.7 7.6 6.6 8.7l25.4 7.3 7.3 25.4c1.1 3.9 4.7 6.6 8.7 6.6s7.6-2.7 8.7-6.6l7.3-25.4 25.4-7.3c3.9-1.1 6.6-4.7 6.6-8.7s-2.7-7.6-6.6-8.7l-25.4-7.3-7.3-25.4zM104 120l48.3 13.8c4.6 1.3 7.7 5.5 7.7 10.2s-3.1 8.9-7.7 10.2L104 168 90.2 216.3c-1.3 4.6-5.5 7.7-10.2 7.7s-8.9-3.1-10.2-7.7L56 168 7.7 154.2C3.1 152.9 0 148.7 0 144s3.1-8.9 7.7-10.2L56 120 69.8 71.7C71.1 67.1 75.3 64 80 64s8.9 3.1 10.2 7.7L104 120zM584 408l48.3 13.8c4.6 1.3 7.7 5.5 7.7 10.2s-3.1 8.9-7.7 10.2L584 456 570.2 504.3c-1.3 4.6-5.5 7.7-10.2 7.7s-8.9-3.1-10.2-7.7L536 456 487.7 442.2c-4.6-1.3-7.7-5.5-7.7-10.2s3.1-8.9 7.7-10.2L536 408 549.8 359.7c1.3-4.6 5.5-7.7 10.2-7.7s8.9 3.1 10.2 7.7L584 408z"/>
</svg>
`;
            const svgDataUri = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(handSparklesSvg)));
            const handTexture = PIXI.Texture.from(svgDataUri);
            const handSprite = new PIXI.Sprite(handTexture);
            handSprite.anchor.set(0.5);
            handSprite.width = 13;
            handSprite.height = 13 / (640 / 512);
            handSprite.position.set(0, -0.5);
            container.addChild(handSprite);

            token.cosmoSpotlightIndicator = token.addChild(container);
        }

        // Position the indicator at the top-right of the token container
        const size = token.w || 50;
        token.cosmoSpotlightIndicator.position.set(size - 10, 10);
        token.cosmoSpotlightIndicator.visible = true;
    } else {
        if (token.cosmoSpotlightIndicator) {
            token.cosmoSpotlightIndicator.visible = false;
        }
    }
});

Hooks.on("destroyToken", (token) => {
    if (token.cosmoSpotlightIndicator) {
        token.cosmoSpotlightIndicator = null;
    }
});
// Fear tracker appearance: recolor, reshape and swap the token icon on the system's own tracker.
Hooks.on("renderFearTracker", (app, element) => {
    const root = element ?? app.element;
    if (!root) return;

    const theme = fearSetting("fearColorTheme");
    const colors = theme === "custom"
        ? [fearSetting("fearCustomColor")?.toString(), fearSetting("fearCustomColorEnd")?.toString()]
        : FEAR_THEMES[theme];
    const tokens = root.querySelectorAll("#resource-fear .fear-tokens a.fear-token");
    if (colors?.[0] && colors?.[1]) {
        const [from, to] = colors;
        root.classList.add("cosmo-fear-themed");
        root.style.setProperty("--cosmo-fear-from", from);
        root.style.setProperty("--cosmo-fear-to", to);
        root.style.setProperty("--primary-color-fear", to);
        const steps = Math.max(1, tokens.length - 1);
        tokens.forEach((token, index) => {
            const pct = Math.round((Number(token.dataset.index ?? index) / steps) * 100);
            token.style.setProperty("--primary-color-fear", `color-mix(in oklab, ${from}, ${to} ${pct}%)`);
        });
    } else {
        root.classList.remove("cosmo-fear-themed");
        for (const v of ["--cosmo-fear-from", "--cosmo-fear-to", "--primary-color-fear"]) root.style.removeProperty(v);
        tokens.forEach(token => token.style.removeProperty("--primary-color-fear"));
    }

    const shape = fearSetting("fearTokenShape");
    for (const s of FEAR_SHAPES) root.classList.toggle(`cosmo-fear-shape-${s}`, s === shape && s !== "circle");

    // Pulse when fear is at the world's configured maximum (homebrew max fear, not always 12).
    const atMax = app.maxFear > 0 && app.currentFear >= app.maxFear;
    root.classList.toggle("cosmo-fear-max-glow", fearSetting("fearMaxGlow") && atMax);

    const iconKey = fearSetting("fearIcon");
    const icon = iconKey === "custom" ? sanitizeFearIcon(fearSetting("fearCustomIcon")) : (FEAR_ICONS[iconKey] ?? FEAR_ICONS.skull);
    for (const i of root.querySelectorAll("#resource-fear .fear-tokens i.fear-token")) {
        i.className = `fear-token ${icon}`;
    }
});

/* -------------------------------------------- */
/*  Daggerheart Core Rulebook look              */
/* -------------------------------------------- */
// One-click switches for the actor sheet themes and token rings shipped by the daggerheart-core module.
// Both are world settings set by the GM. The sheet theme is pushed into every user's own "core.sheetThemes"; the
// ring mirrors "core.dynamicTokenRing" and follows changes made in Core settings.

const DH_CORE_ID = "daggerheart-core";
const MIXED = "";
let syncingCoreLook = false;

function dhCoreActive() {
    return !!game.modules.get(DH_CORE_ID)?.active;
}

// Actor types whose registered sheets include the daggerheart-core themes, with that sheet's theme list.
function dhCoreSheetThemes() {
    const types = [];
    let themes = {};
    for (const [type, sheets] of Object.entries(CONFIG.Actor.sheetClasses ?? {})) {
        const sheet = Object.values(sheets).find(s => s.themes && (DH_CORE_ID in s.themes));
        if (!sheet) continue;
        types.push(type);
        themes = { ...themes, ...sheet.themes };
    }
    return { types, themes };
}

function dhCoreRings() {
    const labels = CONFIG.Token?.ring?.configLabels ?? {};
    return Object.fromEntries(Object.entries(labels).filter(([id]) => {
        const sheet = CONFIG.Token.ring.getConfig?.(id)?.spritesheet ?? "";
        return sheet.startsWith(`modules/${DH_CORE_ID}/`) || (!sheet && id.startsWith("daggerheart-"));
    }));
}

function currentDhCoreRing() {
    const ring = game.settings.get("core", "dynamicTokenRing");
    return ring in dhCoreRings() ? ring : MIXED;
}

// Runs on every client: Foundry keeps default sheet themes per user (client setting), so each client copies the
// GM's world-wide choice into its own defaults.
async function applyDhCoreTheme(theme) {
    if (theme === MIXED || !(theme in dhCoreSheetThemes().themes)) return;
    const { types } = dhCoreSheetThemes();
    const setting = foundry.utils.deepClone(game.settings.get("core", "sheetThemes") ?? {});
    setting.defaults ??= {};
    setting.defaults.Actor ??= {};
    if (types.every(type => setting.defaults.Actor[type] === theme)) return;
    for (const type of types) setting.defaults.Actor[type] = theme;
    await game.settings.set("core", "sheetThemes", setting);

    // Themes are baked in when a sheet is created, so reopen any open actor sheets.
    for (const app of foundry.applications.instances.values()) {
        if (app.document instanceof Actor && app.rendered) app.document._onSheetChange({ sheetOpen: true });
    }
}

async function applyDhCoreRing(ring) {
    if (syncingCoreLook || ring === MIXED || !game.user.isGM) return;
    if (game.settings.get("core", "dynamicTokenRing") !== ring) await game.settings.set("core", "dynamicTokenRing", ring);
}

// Pull the ring choice back from Foundry's own setting without re-applying it.
async function syncDhCoreRing() {
    if (!dhCoreActive() || !game.user.isGM) return;
    syncingCoreLook = true;
    try {
        const ring = currentDhCoreRing();
        if (game.settings.get(MODULE_ID, "dhCoreTokenRing") !== ring) await game.settings.set(MODULE_ID, "dhCoreTokenRing", ring);
    } finally {
        syncingCoreLook = false;
    }
}

Hooks.once("init", () => {
    if (!dhCoreActive()) return;
    const L = "COSMOS_DH_TWEAKS.Settings";

    game.settings.register(MODULE_ID, "dhCoreSheetTheme", {
        name: `${L}.DhCoreSheetTheme.Name`,
        hint: `${L}.DhCoreSheetTheme.Hint`,
        scope: "world",
        config: false,
        type: new foundry.data.fields.StringField({
            required: true,
            blank: true,
            initial: MIXED,
            choices: () => ({ [MIXED]: game.i18n.localize(`${L}.DhCoreSheetTheme.Unchanged`), ...dhCoreSheetThemes().themes })
        }),
        onChange: applyDhCoreTheme
    });

    game.settings.register(MODULE_ID, "dhCoreTokenRing", {
        name: `${L}.DhCoreTokenRing.Name`,
        hint: `${L}.DhCoreTokenRing.Hint`,
        scope: "world",
        config: false,
        type: new foundry.data.fields.StringField({
            required: true,
            blank: true,
            initial: MIXED,
            choices: () => ({ [MIXED]: game.i18n.localize(`${L}.DhCoreTokenRing.Other`), ...dhCoreRings() })
        }),
        requiresReload: true,
        onChange: applyDhCoreRing
    });
});

Hooks.once("ready", () => {
    if (!dhCoreActive()) return;
    applyDhCoreTheme(game.settings.get(MODULE_ID, "dhCoreSheetTheme"));
    syncDhCoreRing();
});
Hooks.on("updateSetting", setting => { if (setting.key === "core.dynamicTokenRing") syncDhCoreRing(); });

/* -------------------------------------------- */
/*  Daggerheart pause icon                      */
/* -------------------------------------------- */
// Swap Foundry's spinning pause icon for the Daggerheart emblem shipped with the system, without spin or pulse.

Hooks.once("init", () => {
    game.settings.register(MODULE_ID, "daggerheartPauseIcon", {
        name: "COSMOS_DH_TWEAKS.Settings.DaggerheartPauseIcon.Name",
        hint: "COSMOS_DH_TWEAKS.Settings.DaggerheartPauseIcon.Hint",
        scope: "world",
        config: false,
        type: Boolean,
        default: true,
        onChange: () => ui.pause?.render()
    });
});

Hooks.once("init", () => {
    const BasePause = CONFIG.ui.pause;
    if (!BasePause) return;
    CONFIG.ui.pause = class CosmoDhTweaksGamePause extends BasePause {
        async _prepareContext(options) {
            const context = await super._prepareContext(options);
            if (game.settings.get(MODULE_ID, "daggerheartPauseIcon")) {
                context.icon = `systems/${game.system.id}/assets/logos/DaggerheartLogo.webp`;
                context.spin = false;
            }
            return context;
        }

        _replaceHTML(result, content, options) {
            super._replaceHTML(result, content, options);
            content.classList.toggle("cosmo-dh-pause", game.settings.get(MODULE_ID, "daggerheartPauseIcon"));
        }
    };
});

/* -------------------------------------------- */
/*  Settings window                             */
/* -------------------------------------------- */
// All of the module's settings live in one tabbed window, opened from the module's entry in Configure Settings.

// Tabs > sections > rows of setting keys; keys in the same row sit side by side. Settings that aren't registered
// (e.g. daggerheart-core is inactive) or that the user may not change (world settings for players) are dropped,
// along with any row, section or tab left empty.
const SETTINGS_LAYOUT = [
    {
        id: "fear", icon: "fa-solid fa-skull", sections: [
            { id: "color", rows: [["fearColorTheme"], ["fearCustomColor", "fearCustomColorEnd"]] },
            { id: "icon", rows: [["fearIcon", "fearTokenShape"], ["fearCustomIcon"]] },
            { id: "effects", rows: [["fearMaxGlow"]] }
        ]
    },
    {
        id: "spotlight", icon: "fa-solid fa-hand-sparkles", sections: [
            { id: "hud", rows: [["tokenHudSpotlight"], ["spotlightRequestIndicator"]] }
        ]
    },
    {
        id: "themes", icon: "fa-solid fa-palette", sections: [
            { id: "dhCore", rows: [["dhCoreSheetTheme"], ["dhCoreTokenRing"]] }
        ]
    },
    {
        id: "interface", icon: "fa-solid fa-display", sections: [
            { id: "widgets", rows: [["minimalCountdownUI"], ["daggerheartPauseIcon"]] }
        ]
    }
];

// Fields that only apply when another select is set to "custom".
const CUSTOM_DEPENDS_ON = {
    fearCustomColor: "fearColorTheme",
    fearCustomColorEnd: "fearColorTheme",
    fearCustomIcon: "fearIcon"
};

function settingField(setting) {
    const fields = foundry.data.fields;
    let field;
    if (setting.type instanceof fields.DataField) field = setting.type;
    else if (setting.type === Boolean) field = new fields.BooleanField({ initial: setting.default ?? false });
    else field = new fields.StringField({ required: true, choices: setting.choices });
    field.name = `${setting.namespace}.${setting.key}`;
    field.label ||= game.i18n.localize(setting.name ?? "");
    field.hint ||= game.i18n.localize(setting.hint ?? "");
    return field;
}

function canEditSetting(setting) {
    return setting.scope !== CONST.SETTING_SCOPES.WORLD || game.user.can("SETTINGS_MODIFY");
}

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

class CosmoDhTweaksSettings extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: "cosmos-dh-tweaks-settings",
        tag: "form",
        classes: ["cosmo-dh-tweaks-settings"],
        window: {
            title: "COSMOS_DH_TWEAKS.SettingsWindow.Title",
            icon: "fa-solid fa-sliders",
            contentClasses: ["standard-form"]
        },
        position: { width: 560, height: "auto" },
        form: {
            handler: CosmoDhTweaksSettings.#onSubmit,
            closeOnSubmit: true
        },
        actions: {
            resetDefaults: CosmoDhTweaksSettings.#onResetDefaults
        }
    };

    static PARTS = {
        tabs: { template: "templates/generic/tab-navigation.hbs" },
        body: { template: `modules/${MODULE_ID}/templates/settings.hbs`, scrollable: [""] },
        footer: { template: "templates/generic/form-footer.hbs" }
    };

    #layout() {
        const T = "COSMOS_DH_TWEAKS.SettingsWindow";
        const entry = key => {
            const setting = game.settings.settings.get(`${MODULE_ID}.${key}`);
            if (!setting || !canEditSetting(setting)) return null;
            const dependsOn = CUSTOM_DEPENDS_ON[key];
            return {
                key,
                field: settingField(setting),
                value: game.settings.get(MODULE_ID, key),
                dependsOn,
                hidden: !!dependsOn && game.settings.get(MODULE_ID, dependsOn) !== "custom"
            };
        };
        return SETTINGS_LAYOUT.map(tab => ({
            ...tab,
            label: `${T}.Tabs.${tab.id}`,
            sections: tab.sections.map(section => ({
                legend: `${T}.Sections.${tab.id}.${section.id}`,
                rows: section.rows
                    .map(keys => keys.map(entry).filter(Boolean))
                    .filter(entries => entries.length)
                    .map(entries => ({ entries, multi: entries.length > 1 }))
            })).filter(section => section.rows.length)
        })).filter(tab => tab.sections.length);
    }

    _getTabsConfig(group) {
        if (group !== "primary") return super._getTabsConfig(group);
        const tabs = this.#layout().map(({ id, icon, label }) => ({ id, icon, label }));
        return { tabs, initial: tabs[0]?.id ?? null };
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        const tabs = this._prepareTabs("primary");
        context.tabs = tabs;
        context.panels = this.#layout().map(tab => ({ ...tab, ...tabs[tab.id] }));
        context.buttons = [
            { type: "button", action: "resetDefaults", icon: "fa-solid fa-arrow-rotate-left", label: "COSMOS_DH_TWEAKS.SettingsWindow.Reset" },
            { type: "submit", icon: "fa-solid fa-floppy-disk", label: "COSMOS_DH_TWEAKS.SettingsWindow.Save" }
        ];
        return context;
    }

    async _onRender(context, options) {
        await super._onRender(context, options);
        for (const key of new Set(Object.values(CUSTOM_DEPENDS_ON))) {
            const select = this.element.querySelector(`.cosmo-setting[data-key="${key}"] select`);
            if (!select) continue;
            const dependents = this.element.querySelectorAll(`.cosmo-setting[data-depends-on="${key}"]`);
            const sync = () => {
                for (const el of dependents) el.hidden = select.value !== "custom";
                this.setPosition({ height: "auto" });
            };
            select.addEventListener("change", sync);
            sync();
        }
    }

    static async #onResetDefaults() {
        for (const [key, setting] of game.settings.settings.entries()) {
            if (setting.namespace !== MODULE_ID) continue;
            const input = this.form.elements[key];
            if (!input) continue;
            if (input.type === "checkbox") input.checked = !!setting.default;
            else input.value = setting.type?.initial ?? setting.default ?? "";
            input.dispatchEvent(new Event("change", { bubbles: true }));
        }
    }

    static async #onSubmit(_event, _form, formData) {
        let requiresClientReload = false;
        let requiresWorldReload = false;
        for (const [key, value] of Object.entries(formData.object)) {
            const setting = game.settings.settings.get(key);
            if (!setting || setting.namespace !== MODULE_ID || !canEditSetting(setting)) continue;
            const prior = game.settings.get(MODULE_ID, setting.key);
            if (foundry.utils.equals(prior?.toString?.() ?? prior, value?.toString?.() ?? value)) continue;
            try {
                await game.settings.set(MODULE_ID, setting.key, value);
            } catch (error) {
                ui.notifications.error(error.message ?? error);
                continue;
            }
            const world = setting.scope === CONST.SETTING_SCOPES.WORLD;
            requiresClientReload ||= !world && setting.requiresReload;
            requiresWorldReload ||= world && setting.requiresReload;
        }
        if (requiresClientReload || requiresWorldReload) {
            await foundry.applications.settings.SettingsConfig.reloadConfirm({ world: requiresWorldReload });
        }
    }
}

Hooks.once("init", () => {
    game.settings.registerMenu(MODULE_ID, "settingsWindow", {
        name: "COSMOS_DH_TWEAKS.SettingsWindow.MenuName",
        label: "COSMOS_DH_TWEAKS.SettingsWindow.MenuLabel",
        hint: "COSMOS_DH_TWEAKS.SettingsWindow.MenuHint",
        icon: "fa-solid fa-sliders",
        type: CosmoDhTweaksSettings,
        restricted: true
    });
});
