Hooks.once("init", () => {
    // Register settings
    game.settings.register("cosmos-dh-tweaks", "tokenHudSpotlight", {
        name: "COSMOS_DH_TWEAKS.Settings.TokenHudSpotlight.Name",
        hint: "COSMOS_DH_TWEAKS.Settings.TokenHudSpotlight.Hint",
        scope: "world",
        config: true,
        type: Boolean,
        default: true
    });

    game.settings.register("cosmos-dh-tweaks", "spotlightRequestIndicator", {
        name: "COSMOS_DH_TWEAKS.Settings.SpotlightRequestIndicator.Name",
        hint: "COSMOS_DH_TWEAKS.Settings.SpotlightRequestIndicator.Hint",
        scope: "world",
        config: true,
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

    game.settings.register("cosmos-dh-tweaks", "minimalCountdownUI", {
        name: "COSMOS_DH_TWEAKS.Settings.MinimalCountdownUI.Name",
        hint: "COSMOS_DH_TWEAKS.Settings.MinimalCountdownUI.Hint",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
        onChange: () => {
            if (ui.countdowns) ui.countdowns.render();
        }
    });

    game.settings.register("cosmos-dh-tweaks", "removeFearTitleBar", {
        name: "COSMOS_DH_TWEAKS.Settings.RemoveFearTitleBar.Name",
        hint: "COSMOS_DH_TWEAKS.Settings.RemoveFearTitleBar.Hint",
        scope: "client",
        config: true,
        type: Boolean,
        default: true,
        onChange: () => {
            if (ui.resources) {
                ui.resources.updateTitleBarStatus();
                ui.resources.adjustSizeToMaxFear();
            }
        }
    });

    game.settings.register("cosmos-dh-tweaks", "lockFearTrackerPosition", {
        scope: "client",
        config: false,
        type: Boolean,
        default: false
    });

    game.settings.register("cosmos-dh-tweaks", "resetFearPosition", {
        name: "COSMOS_DH_TWEAKS.Settings.ResetFearPosition.Name",
        hint: "COSMOS_DH_TWEAKS.Settings.ResetFearPosition.Hint",
        scope: "client",
        config: true,
        type: Boolean,
        default: false
    });

    game.settings.register("cosmos-dh-tweaks", "fearTrackerScale", {
        name: "COSMOS_DH_TWEAKS.Settings.FearTrackerScale.Name",
        hint: "COSMOS_DH_TWEAKS.Settings.FearTrackerScale.Hint",
        scope: "client",
        config: true,
        type: Number,
        range: {
            min: 0.5,
            max: 1.5,
            step: 0.05
        },
        default: 1.0,
        onChange: () => {
            if (ui.resources && ui.resources.rendered) {
                ui.resources.updateScale();
                ui.resources.adjustSizeToMaxFear();
            }
        }
    });

    game.settings.register("cosmos-dh-tweaks", "resetFearScale", {
        name: "COSMOS_DH_TWEAKS.Settings.ResetFearScale.Name",
        hint: "COSMOS_DH_TWEAKS.Settings.ResetFearScale.Hint",
        scope: "client",
        config: true,
        type: Boolean,
        default: false
    });

    // Override the FearTracker class in CONFIG
    const OriginalFearTracker = CONFIG.ui.resources;
    if (OriginalFearTracker) {
        class CosmoDhTweaksFearTracker extends OriginalFearTracker {
            async _onRender(context, options) {
                await super._onRender(context, options);
                
                if (!this._eventsBound) {
                    this._eventsBound = true;
                    
                    this.element.addEventListener('contextmenu', (e) => {
                        this._showContextMenu(e);
                    });

                    this.element.addEventListener('mousedown', (e) => {
                        const isLocked = game.settings.get("cosmos-dh-tweaks", "lockFearTrackerPosition");
                        if (isLocked) {
                            if (e.target.closest('header, .window-resize-handle')) {
                                e.preventDefault();
                                e.stopPropagation();
                                return;
                            }
                        }

                        const removeTitleBar = game.settings.get("cosmos-dh-tweaks", "removeFearTitleBar");
                        if (removeTitleBar && !isLocked) {
                            if (e.button !== 0) return;
                            if (e.target.closest('i, .controls, button, input, a, .window-resize-handle')) return;

                            e.preventDefault();
                            this._startDrag(e);
                        }
                    }, { capture: true });
                }

                this.updateTitleBarStatus();
                this.updateLockStatus();
                this.updateScale();
                this.adjustSizeToMaxFear();
            }

            updateScale() {
                if (!this.element) return;
                const scale = game.settings.get("cosmos-dh-tweaks", "fearTrackerScale") ?? 1.0;
                this.element.style.setProperty('--cosmo-fear-scale', scale);
            }

            updateTitleBarStatus() {
                if (!this.element) return;
                const removeTitleBar = game.settings.get("cosmos-dh-tweaks", "removeFearTitleBar");
                if (removeTitleBar) {
                    this.element.classList.add("cosmo-no-title-bar");
                } else {
                    this.element.classList.remove("cosmo-no-title-bar");
                }
            }

            updateLockStatus() {
                if (!this.element) return;
                const isLocked = game.settings.get("cosmos-dh-tweaks", "lockFearTrackerPosition");
                if (isLocked) {
                    this.element.classList.add("cosmo-position-locked");
                } else {
                    this.element.classList.remove("cosmo-position-locked");
                }
            }

            getLayoutMeasurements() {
                const content = this.element.querySelector('.window-content');
                const grid = this.element.querySelector('#resource-fear');
                const skulls = grid ? grid.querySelectorAll('i') : [];
                
                let skullW = 48;
                let skullH = 48;
                let gapX = 4;
                let gapY = 8;
                let padX = 16;
                let padY = 16;
                let headerH = 0;

                if (content) {
                    const style = window.getComputedStyle(content);
                    const parsedPadX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
                    const parsedPadY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
                    if (!isNaN(parsedPadX)) padX = parsedPadX;
                    if (!isNaN(parsedPadY)) padY = parsedPadY;
                }

                const header = this.element.querySelector('header.window-header');
                if (header && window.getComputedStyle(header).display !== 'none') {
                    headerH = header.offsetHeight || 30;
                }

                if (skulls.length > 0) {
                    const first = skulls[0];
                    const firstRect = first.getBoundingClientRect();
                    if (firstRect.width > 0) skullW = firstRect.width;
                    if (firstRect.height > 0) skullH = firstRect.height;
                    
                    if (skulls.length > 1) {
                        let second = null;
                        for (let i = 1; i < skulls.length; i++) {
                            const rect = skulls[i].getBoundingClientRect();
                            if (Math.abs(rect.top - firstRect.top) < 2 && rect.width > 0) {
                                second = rect;
                                break;
                            }
                        }
                        if (second) {
                            gapX = second.left - firstRect.right;
                        }
                        
                        let nextRow = null;
                        for (let i = 1; i < skulls.length; i++) {
                            const rect = skulls[i].getBoundingClientRect();
                            if (rect.top - firstRect.bottom > 2 && rect.width > 0) {
                                nextRow = rect;
                                break;
                            }
                        }
                        if (nextRow) {
                            gapY = nextRow.top - firstRect.bottom;
                        }
                    }
                }

                return { skullW, skullH, gapX, gapY, padX, padY, headerH };
            }

            calculatePerfectSize(targetWidth, measurements) {
                const scale = game.settings.get("cosmos-dh-tweaks", "fearTrackerScale") ?? 1.0;
                
                // Divide measurements by scale to work with unscaled base measurements
                const skullW = measurements.skullW / scale;
                const skullH = measurements.skullH / scale;
                const gapX = measurements.gapX / scale;
                const gapY = measurements.gapY / scale;
                const padX = measurements.padX / scale;
                const padY = measurements.padY / scale;
                const headerH = measurements.headerH / scale;

                const display = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.appearance).displayFear;
                const maxFear = this.maxFear;

                // Subtract the fixed border buffer from targetWidth before unscaling to get exact content size
                const targetWUnscaled = targetWidth ? Math.max(0, (targetWidth - 8) / scale) : 222;

                if (display === 'bar') {
                    const barElement = this.element.querySelector('#resource-fear');
                    const barH = barElement ? (barElement.getBoundingClientRect().height / scale) : 30;
                    const perfectH = barH + padY + headerH;
                    const minW = 200;
                    const perfectW = Math.max(minW, targetWUnscaled);
                    
                    return {
                        width: Math.ceil(perfectW * scale) + 8,
                        height: Math.ceil(perfectH * scale) + 6
                    };
                } else {
                    let cols = Math.round((targetWUnscaled - padX + gapX) / (skullW + gapX));
                    cols = Math.max(1, Math.min(maxFear, cols));

                    const perfectW = cols * skullW + (cols - 1) * gapX + padX;
                    const rows = Math.ceil(maxFear / cols);
                    const perfectH = rows * skullH + (rows - 1) * gapY + padY + headerH;

                    return {
                        width: Math.ceil(perfectW * scale) + 8,
                        height: Math.ceil(perfectH * scale) + 6
                    };
                }
            }

            adjustSizeToMaxFear() {
                if (!this.element) return;
                
                requestAnimationFrame(() => {
                    if (!this.element) return;
                    const measurements = this.getLayoutMeasurements();
                    const pos = this.position;
                    
                    const perfect = this.calculatePerfectSize(pos.width, measurements);
                    
                    if (Math.abs(pos.width - perfect.width) > 1 || Math.abs(pos.height - perfect.height) > 1) {
                        this.setPosition(perfect);
                    }
                });
            }

            setPosition(position = {}) {
                if (!this.element) return super.setPosition(position);

                const measurements = this.getLayoutMeasurements();
                if (position.width !== undefined || position.height !== undefined) {
                    const currentW = position.width !== undefined ? position.width : this.position.width;
                    const perfect = this.calculatePerfectSize(currentW, measurements);
                    
                    position.width = perfect.width;
                    position.height = perfect.height;
                }

                return super.setPosition(position);
            }

            _startDrag(e) {
                let isDragging = true;
                const startX = e.clientX;
                const startY = e.clientY;
                const pos = this.position;
                const startLeft = pos.left;
                const startTop = pos.top;

                const onMouseMove = (event) => {
                    if (!isDragging) return;
                    const dx = event.clientX - startX;
                    const dy = event.clientY - startY;

                    this.setPosition({
                        left: startLeft + dx,
                        top: startTop + dy
                    });
                };

                const onMouseUp = () => {
                    isDragging = false;
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                };

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            }

            _showContextMenu(e) {
                e.preventDefault();
                const existing = document.querySelector('.cosmo-fear-context-menu');
                if (existing) existing.remove();

                const isLocked = game.settings.get("cosmos-dh-tweaks", "lockFearTrackerPosition");
                const currentScale = game.settings.get("cosmos-dh-tweaks", "fearTrackerScale") ?? 1.0;
                const menu = document.createElement('div');
                menu.className = 'cosmo-fear-context-menu';
                
                const lockText = isLocked 
                    ? `<i class="fa-solid fa-lock-open"></i> ${game.i18n.localize("COSMOS_DH_TWEAKS.ContextMenu.UnlockPosition")}`
                    : `<i class="fa-solid fa-lock"></i> ${game.i18n.localize("COSMOS_DH_TWEAKS.ContextMenu.LockPosition")}`;
                    
                menu.innerHTML = `
                    <ul class="cosmo-context-menu-list">
                        <li class="cosmo-context-menu-item lock-toggle" data-action="toggle-lock">
                            ${lockText}
                        </li>
                        <li class="cosmo-context-menu-item reset-position" data-action="reset-position">
                            <i class="fa-solid fa-arrows-rotate"></i> ${game.i18n.localize("COSMOS_DH_TWEAKS.ContextMenu.ResetPosition")}
                        </li>
                        <li class="cosmo-context-menu-item reset-scale" data-action="reset-scale">
                            <i class="fa-solid fa-expand"></i> ${game.i18n.localize("COSMOS_DH_TWEAKS.ContextMenu.ResetScale")}
                        </li>
                        <li class="cosmo-context-menu-header">${game.i18n.localize("COSMOS_DH_TWEAKS.ContextMenu.ScaleHeader")}</li>
                        <li class="cosmo-context-menu-scale-controls">
                            <button class="scale-btn ${Math.abs(currentScale - 0.7) < 0.01 ? 'active' : ''}" data-scale="0.7">70%</button>
                            <button class="scale-btn ${Math.abs(currentScale - 0.85) < 0.01 ? 'active' : ''}" data-scale="0.85">85%</button>
                            <button class="scale-btn ${Math.abs(currentScale - 1.0) < 0.01 ? 'active' : ''}" data-scale="1.0">100%</button>
                            <button class="scale-btn ${Math.abs(currentScale - 1.15) < 0.01 ? 'active' : ''}" data-scale="1.15">115%</button>
                            <button class="scale-btn ${Math.abs(currentScale - 1.3) < 0.01 ? 'active' : ''}" data-scale="1.3">130%</button>
                        </li>
                    </ul>
                `;

                menu.style.position = 'fixed';
                menu.style.left = `${e.clientX}px`;
                menu.style.top = `${e.clientY}px`;
                menu.style.zIndex = 100000;

                document.body.appendChild(menu);

                menu.querySelector('[data-action="toggle-lock"]').addEventListener('click', async (event) => {
                    event.preventDefault();
                    const currentLock = game.settings.get("cosmos-dh-tweaks", "lockFearTrackerPosition");
                    await game.settings.set("cosmos-dh-tweaks", "lockFearTrackerPosition", !currentLock);
                    this.updateLockStatus();
                    menu.remove();
                });

                menu.querySelector('[data-action="reset-position"]').addEventListener('click', async (event) => {
                    event.preventDefault();
                    await game.user.unsetFlag(CONFIG.DH.id, 'app.resources.position');
                    if (this.rendered) {
                        const defaultPos = CONFIG.ui.resources.DEFAULT_OPTIONS.position;
                        await this.setPosition(defaultPos);
                    }
                    ui.notifications.info(game.i18n.localize("COSMOS_DH_TWEAKS.Settings.ResetFearPosition.Success"));
                    menu.remove();
                });

                menu.querySelector('[data-action="reset-scale"]').addEventListener('click', async (event) => {
                    event.preventDefault();
                    await game.settings.set("cosmos-dh-tweaks", "fearTrackerScale", 1.0);
                    this.updateScale();
                    this.adjustSizeToMaxFear();
                    ui.notifications.info(game.i18n.localize("COSMOS_DH_TWEAKS.Settings.ResetFearScale.Success"));
                    menu.remove();
                });

                menu.querySelectorAll('.scale-btn').forEach(btn => {
                    btn.addEventListener('click', async (event) => {
                        event.preventDefault();
                        const newScale = parseFloat(btn.dataset.scale);
                        await game.settings.set("cosmos-dh-tweaks", "fearTrackerScale", newScale);
                        this.updateScale();
                        this.adjustSizeToMaxFear();
                        menu.remove();
                    });
                });

                const closeMenu = (event) => {
                    if (!menu.contains(event.target)) {
                        menu.remove();
                        document.removeEventListener('click', closeMenu);
                        document.removeEventListener('contextmenu', closeMenu);
                    }
                };
                setTimeout(() => {
                    document.addEventListener('click', closeMenu);
                    document.addEventListener('contextmenu', closeMenu);
                }, 0);
            }
        }
        CONFIG.ui.resources = CosmoDhTweaksFearTracker;
    }

    // Override the Countdown class in CONFIG
    const OriginalCountdowns = CONFIG.ui.countdowns;
    if (OriginalCountdowns) {
        class CosmoDhTweaksCountdowns extends OriginalCountdowns {
            async _onRender(context, options) {
                await super._onRender(context, options);
                
                if (!game.settings.get("cosmos-dh-tweaks", "minimalCountdownUI")) {
                    this.element.classList.remove("cosmo-minimal-countdown");
                    const addBtn = this.element.querySelector(".cosmo-add-countdown");
                    if (addBtn) addBtn.remove();
                    return;
                }

                // Check if there are active countdowns using public API
                const countdownData = this._getCountdownData();
                let count = 0;
                for (const key of Object.keys(countdownData)) {
                    count += Object.keys(countdownData[key]).length;
                }
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
                } else {
                    // For players: if there are no countdowns, hide the UI completely.
                    if (!hasCountdowns) {
                        this.element.hidden = true;
                    }
                }
            }
        }
        CONFIG.ui.countdowns = CosmoDhTweaksCountdowns;
    }
});

Hooks.on("renderTokenHUD", (tokenHUD, html, tokenData) => {
    if (!game.settings.get("cosmos-dh-tweaks", "tokenHudSpotlight")) return;

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
            : (token.actor?.getFlag("cosmos-dh-tweaks", "requestingSpotlight") || false);
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
            if (token.actor?.getFlag("cosmos-dh-tweaks", "requestingSpotlight")) {
                await token.actor.setFlag("cosmos-dh-tweaks", "requestingSpotlight", false);
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
                const isRequesting = !!token.actor?.getFlag("cosmos-dh-tweaks", "requestingSpotlight");
                await token.actor?.setFlag("cosmos-dh-tweaks", "requestingSpotlight", !isRequesting);
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
    if (!game.settings.get("cosmos-dh-tweaks", "tokenHudSpotlight")) return;
    if (canvas.tokens.hud.rendered && canvas.tokens.hud.object?.id === combatant.tokenId) {
        canvas.tokens.hud.render(true);
    }
});

// Re-render Token HUD if out-of-combat spotlight settings change
Hooks.on("updateSetting", (setting, change, options, userId) => {
    if (!game.settings.get("cosmos-dh-tweaks", "tokenHudSpotlight")) return;
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
    if (!game.settings.get("cosmos-dh-tweaks", "tokenHudSpotlight")) return;
    if (!game.settings.get("cosmos-dh-tweaks", "spotlightRequestIndicator")) {
        if (token.cosmoSpotlightIndicator) {
            token.cosmoSpotlightIndicator.visible = false;
        }
        return;
    }

    const inCombat = !!token.combatant;
    const requestingInCombat = token.combatant?.system.spotlight?.requesting;
    const requestingOutOfCombat = token.actor?.getFlag("cosmos-dh-tweaks", "requestingSpotlight");
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

Hooks.on("renderSettingsConfig", (app, html, data) => {
    const posInput = html.querySelector 
        ? html.querySelector('[name="cosmos-dh-tweaks.resetFearPosition"]') 
        : html.find('[name="cosmos-dh-tweaks.resetFearPosition"]')[0];
    
    if (posInput) {
        const formGroup = posInput.closest('.form-group');
        if (formGroup) {
            const formFields = formGroup.querySelector('.form-fields');
            if (formFields) {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'cosmo-reset-fear-pos-btn';
                button.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> ${game.i18n.localize("COSMOS_DH_TWEAKS.Settings.ResetFearPosition.ButtonText")}`;
                button.addEventListener('click', async (e) => {
                    e.preventDefault();
                    await game.user.unsetFlag(CONFIG.DH.id, 'app.resources.position');
                    if (ui.resources && ui.resources.rendered) {
                        const defaultPos = CONFIG.ui.resources.DEFAULT_OPTIONS.position;
                        await ui.resources.setPosition(defaultPos);
                    }
                    ui.notifications.info(game.i18n.localize("COSMOS_DH_TWEAKS.Settings.ResetFearPosition.Success"));
                });
                
                formFields.innerHTML = '';
                formFields.appendChild(button);
            }
        }
    }

    const scaleInput = html.querySelector 
        ? html.querySelector('[name="cosmos-dh-tweaks.resetFearScale"]') 
        : html.find('[name="cosmos-dh-tweaks.resetFearScale"]')[0];
    
    if (scaleInput) {
        const formGroup = scaleInput.closest('.form-group');
        if (formGroup) {
            const formFields = formGroup.querySelector('.form-fields');
            if (formFields) {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'cosmo-reset-fear-scale-btn';
                button.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> ${game.i18n.localize("COSMOS_DH_TWEAKS.Settings.ResetFearScale.ButtonText")}`;
                button.addEventListener('click', async (e) => {
                    e.preventDefault();
                    await game.settings.set("cosmos-dh-tweaks", "fearTrackerScale", 1.0);
                    if (ui.resources && ui.resources.rendered) {
                        ui.resources.updateScale();
                        ui.resources.adjustSizeToMaxFear();
                    }
                    ui.notifications.info(game.i18n.localize("COSMOS_DH_TWEAKS.Settings.ResetFearScale.Success"));
                });
                
                formFields.innerHTML = '';
                formFields.appendChild(button);
            }
        }
    }
});
