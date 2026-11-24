/**
 * Colossus Link
 *
 * Keeps the tokens of a Daggerheart colossus (framework + parts) together on the canvas.
 *
 * When one or more tokens of a colossus are moved:
 * - If every token of the colossus still touches another one afterwards, the move is a rearrangement and only the
 *   moved tokens move.
 * - If a single token ends up detached but within the snap distance of another token of the colossus, it snaps flush
 *   against the nearest one instead.
 * - Otherwise, the rest of the colossus follows the movement, keeping its formation.
 *
 * Only relies on the public colossus data of the system (`system.typeData.role` / `frameworkActor`), no system code
 * is modified.
 */

const MODULE_ID = 'cosmos-dh-tweaks';
const FOLLOW_FLAG = 'cosmoColossusLink';
const EPSILON = 1;

/** Groups already handled per update operation, so multi-token moves are evaluated only once. */
const handledOperations = new WeakMap();

/**
 * Snaps to perform once a movement has landed, keyed by the movement's initial ID.
 * The snap can't be issued from preMoveToken by rejecting the move: Foundry stops the token's movement after a
 * rejection, which also cancels the snap movement started in between.
 * @type {Map<string, { x: number, y: number }>}
 */
const pendingSnaps = new Map();

Hooks.once('init', () => {
    // Shown in the module's own settings window (see SETTINGS_LAYOUT in cosmos-dh-tweaks.mjs)
    game.settings.register(MODULE_ID, 'colossusLink', {
        name: 'COSMOS_DH_TWEAKS.Settings.ColossusLink.Name',
        hint: 'COSMOS_DH_TWEAKS.Settings.ColossusLink.Hint',
        scope: 'world',
        config: false,
        type: Boolean,
        default: false
    });

    game.settings.register(MODULE_ID, 'colossusSnapDistance', {
        name: 'COSMOS_DH_TWEAKS.Settings.ColossusSnapDistance.Name',
        hint: 'COSMOS_DH_TWEAKS.Settings.ColossusSnapDistance.Hint',
        scope: 'world',
        config: false,
        type: new foundry.data.fields.NumberField({ required: true, nullable: false, min: 0, max: 5, step: 0.5, initial: 1 }),
        default: 1
    });
});

Hooks.on('preMoveToken', onPreMoveToken);
Hooks.on('moveToken', onMoveToken);

/* -------------------------------------------- */

/**
 * @param {TokenDocument} document
 * @param {object} movement     TokenPreMovementOperation
 * @param {object} operation    The update operation
 * @returns {boolean|void}
 */
function onPreMoveToken(document, movement, operation) {
    if (game.system.id !== 'daggerheart') return;
    if (!game.settings.get(MODULE_ID, 'colossusLink')) return;
    if (operation[FOLLOW_FLAG]) return;
    // Only evaluate the first segment of a movement, later checkpoints are continuations of the same drag.
    if (movement.chain?.length) return;

    const group = getColossusGroup(document);
    if (!group || group.members.length < 2) return;

    let handled = handledOperations.get(operation);
    if (!handled) handledOperations.set(operation, (handled = new Set()));
    if (handled.has(group.key)) return;
    handled.add(group.key);

    const scene = document.parent;
    const grid = scene.grid;
    const finalPosition = movement.pending?.waypoints?.at(-1) ?? movement.destination;

    // Positions of all members after this operation
    const movedIds = new Set([document.id, ...Object.keys(operation.movement ?? {})]);
    const rects = new Map();
    for (const member of group.members) {
        let position = member._source;
        if (member === document) position = { ...member._source, ...finalPosition };
        else if (movedIds.has(member.id)) position = instructionDestination(member, operation.movement[member.id]);
        rects.set(member.id, toRect(position, grid));
    }

    // Still in one piece: this is a rearrangement
    if (isConnected([...rects.values()])) return;

    const movedMembers = group.members.filter(m => movedIds.has(m.id));
    const followers = group.members.filter(m => !movedIds.has(m.id));
    if (!followers.length) return;

    // A single token dropped close to the rest: snap it into contact
    const snapDistance = game.settings.get(MODULE_ID, 'colossusSnapDistance') * grid.size;
    if (movedMembers.length === 1 && snapDistance > 0) {
        const moved = rects.get(document.id);
        const others = followers.map(f => rects.get(f.id));
        const snap = findSnapPosition(moved, others, snapDistance + EPSILON);
        if (snap) {
            // Let the drop land, then slide the token into contact (see onMoveToken)
            if (snap.distance > EPSILON) pendingSnaps.set(movement.id, { x: snap.x, y: snap.y });
            return;
        }
    }

    // Moved far enough: drag the rest of the colossus along. Followers don't rotate, so neither does the leader.
    movement.autoRotate = false;
    moveFollowers(document, movement, followers);
}

/**
 * Performs a pending snap once the dropped token has arrived at its destination.
 * @param {TokenDocument} document
 * @param {object} movement     TokenMovementOperation
 * @param {object} operation
 * @param {User} user
 */
function onMoveToken(document, movement, operation, user) {
    if (!user.isSelf || !pendingSnaps.size) return;
    const key = movement.chain?.at(0) ?? movement.id;
    const snap = pendingSnaps.get(key);
    if (!snap || movement.pending?.waypoints?.length) return;
    pendingSnaps.delete(key);

    document
        .move(
            { x: snap.x, y: snap.y },
            { method: 'api', [FOLLOW_FLAG]: true, constrainOptions: { ignoreWalls: true, ignoreCost: true } }
        )
        .catch(err => console.error(`${MODULE_ID} | Failed to snap colossus token`, err));
}

/* -------------------------------------------- */

/**
 * Finds the framework and all linked part tokens on the same scene as the given token.
 * @param {TokenDocument} tokenDocument
 * @returns {{ key: string, members: TokenDocument[] } | null}
 */
function getColossusGroup(tokenDocument) {
    const actor = tokenDocument.actor;
    if (!isColossus(actor)) return null;

    const typeData = actor.system.typeData;
    const framework = typeData.role === 'framework' ? actor : typeData.frameworkActor;
    if (!framework) return null;

    const isFramework = a => a === framework || a.uuid === framework.uuid;
    const members = tokenDocument.parent.tokens.filter(t => {
        const a = t.actor;
        if (!isColossus(a)) return false;
        if (isFramework(a)) return true;
        const linked = a.system.typeData.role === 'part' ? a.system.typeData.frameworkActor : null;
        return Boolean(linked && isFramework(linked));
    });

    return { key: framework.uuid, members };
}

function isColossus(actor) {
    return actor?.type === 'adversary' && actor.system?.type === 'colossus' && Boolean(actor.system.typeData?.role);
}

/**
 * Resolves the final position of a token from a raw movement instruction of the same operation.
 */
function instructionDestination(tokenDocument, instruction) {
    const position = { ...tokenDocument._source };
    for (const waypoint of instruction?.waypoints ?? []) {
        for (const key of ['x', 'y', 'width', 'height']) {
            if (waypoint[key] !== undefined) position[key] = waypoint[key];
        }
    }
    return position;
}

/**
 * Moves the follower tokens along the same path as the leader, offset by their current relative position.
 */
function moveFollowers(leader, movement, followers) {
    const origin = movement.origin;
    const path = [...(movement.passed?.waypoints ?? []), ...(movement.pending?.waypoints ?? [])].filter(
        w => !w.intermediate
    );
    if (!path.length) return;

    const instructions = {};
    for (const follower of followers) {
        if (!follower.isOwner) continue;
        const source = follower._source;
        instructions[follower.id] = {
            waypoints: path.map(w => ({
                x: Math.round(source.x + (w.x - origin.x)),
                y: Math.round(source.y + (w.y - origin.y)),
                elevation: source.elevation + (w.elevation - origin.elevation),
                level: w.level,
                action: w.action,
                checkpoint: w.checkpoint,
                explicit: w.explicit
            })),
            method: movement.method === 'dragging' || movement.method === 'keyboard' ? movement.method : 'api',
            autoRotate: false,
            showRuler: false,
            constrainOptions: { ignoreWalls: true, ignoreCost: true }
        };
    }
    if (foundry.utils.isEmpty(instructions)) return;

    leader.parent
        .moveTokens(instructions, { [FOLLOW_FLAG]: true })
        .catch(err => console.error(`${MODULE_ID} | Failed to move colossus tokens`, err));
}

/* -------------------------------------------- */
/*  Geometry                                    */
/* -------------------------------------------- */

function toRect(position, grid) {
    return {
        x: position.x,
        y: position.y,
        w: position.width * grid.sizeX,
        h: position.height * grid.sizeY
    };
}

/** Distance between two rects along each axis (0 when overlapping on that axis). */
function gap(a, b) {
    const dx = Math.max(0, a.x - (b.x + b.w), b.x - (a.x + a.w));
    const dy = Math.max(0, a.y - (b.y + b.h), b.y - (a.y + a.h));
    return { dx, dy };
}

/** Rects touch when they overlap or share an edge or corner. */
function touches(a, b) {
    const { dx, dy } = gap(a, b);
    return dx <= EPSILON && dy <= EPSILON;
}

/** Whether two rects overlap with a positive area. */
function overlaps(a, b) {
    return (
        Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > EPSILON
        && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > EPSILON
    );
}

function isConnected(rects) {
    if (rects.length < 2) return true;
    const visited = new Set([0]);
    const queue = [0];
    while (queue.length) {
        const current = rects[queue.shift()];
        rects.forEach((rect, idx) => {
            if (visited.has(idx) || !touches(current, rect)) return;
            visited.add(idx);
            queue.push(idx);
        });
    }
    return visited.size === rects.length;
}

/**
 * Finds the closest position for `moved` that touches one of `others`, preferring positions that connect the whole
 * group and don't overlap any other token. Only positions within `maxDistance` pixels are considered.
 * @returns {{ x: number, y: number, distance: number } | null}
 */
function findSnapPosition(moved, others, maxDistance) {
    const candidates = others.map(target => {
        // Clamping the top-left corner into this range puts the rect flush against the target
        const x = Math.clamp(moved.x, target.x - moved.w, target.x + target.w);
        const y = Math.clamp(moved.y, target.y - moved.h, target.y + target.h);
        const rect = { ...moved, x, y };
        return {
            x,
            y,
            distance: Math.hypot(x - moved.x, y - moved.y),
            connected: isConnected([rect, ...others]),
            overlapping: others.some(o => overlaps(rect, o))
        };
    }).filter(c => c.distance <= maxDistance);

    candidates.sort(
        (a, b) =>
            Number(b.connected) - Number(a.connected)
            || Number(a.overlapping) - Number(b.overlapping)
            || a.distance - b.distance
    );
    return candidates[0] ?? null;
}
