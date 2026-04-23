// ============================================================
// TIM-IAL PURSUIT — game.js
// ============================================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;

// Playable area inside the dungeon image
const PLAY_LEFT = W * 0.117;
const PLAY_RIGHT = W * 0.895;
const PLAY_TOP = H * 0.16;
const PLAY_BOTTOM = H * 0.88;

// East door target (where the arrow points & where you walk through)
const E_DOOR_X = W * 0.882;
const E_DOOR_Y = H * 0.50; // nudged down to align with door art

const TIM_HEIGHT = 165;
const NPC_INTERACT_RADIUS = 140;
const NPC_COLLISION_RADIUS = 50;
const DOOR_INTERACT_RADIUS = 130;
const TRANSITION_HALF_MS = 360;

// Ending scene Tim
const ENDING_TIM_X = W * 0.50;
const ENDING_TIM_Y = H * 0.72;
const ENDING_TIM_HEIGHT = 150;

// ===== Image loading =====
const imgs = {};
function loadImage(name, src) {
  const img = new Image();
  img.src = src;
  imgs[name] = img;
}
const IMAGE_LIST = [
  ["tim", "assets/tim.png"],
  ["scroll", "assets/scroll.png"],
  ["ending", "assets/ending-scene.png"],
  ["room1Closed", "assets/room1-open.png"],
  ["room1Open", "assets/room1-closed.png"],
  ["roomMidClosed", "assets/room-mid-closed.png"],
  ["roomMidOpen", "assets/room-mid-open.png"],
];
for (const [n, s] of IMAGE_LIST) loadImage(n, s);
for (const npc of CONTENT.npcs) loadImage(npc.id, npc.sprite);
for (let i = 0; i <= 6; i++) loadImage(`wheel${i}`, `assets/memory-wheel-${i}.png`);

// ===== Helpers =====
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ===== Progress (persistent across playthroughs) =====
// Tracks which prompts the player has already seen and how many runs
// they've completed, so we can prefer fresh prompts on each playthrough
// and surface a "Memories Unlocked" counter on the title screen.
const progress = (() => {
  const KEY = "tim-ial-pursuit:progress:v1";
  const total = () => CONTENT.personalPrompts.length + CONTENT.workPrompts.length;
  const empty = () => ({ personal: [], work: [], runs: 0 });

  // Load the freshest state from localStorage. Called on module init AND
  // before every read used for UI (title counter, play-again hint) so a
  // second tab / reload / hidden-tab-restore can't display a stale value.
  const load = () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          personal: Array.isArray(parsed.personal) ? parsed.personal : [],
          work: Array.isArray(parsed.work) ? parsed.work : [],
          runs: Number.isFinite(parsed.runs) ? parsed.runs : 0,
        };
      }
    } catch (_) { /* localStorage may be unavailable; fall back to in-memory */ }
    return empty();
  };

  let state = load();

  const persist = () => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {}
  };

  // Merge another tab's state into ours rather than blindly overwriting,
  // so no progress is lost if both tabs happened to advance. Prompts are
  // matched by exact text.
  const mergeFromStorage = () => {
    const fresh = load();
    const mergeList = (a, b) => {
      const set = new Set(a);
      for (const item of b) set.add(item);
      return Array.from(set);
    };
    state = {
      personal: mergeList(state.personal, fresh.personal),
      work: mergeList(state.work, fresh.work),
      runs: Math.max(state.runs, fresh.runs),
    };
    persist();
  };

  // Only wipe once BOTH categories are fully seen. Resetting categories
  // independently caused the smaller pool (personal, 10 prompts) to recycle
  // noticeably sooner than the larger pool (work, 16), which is exactly what
  // we want to avoid. Now we keep accumulating seen-state until every prompt
  // has been visited at least once, then start the whole cycle fresh.
  const recycleIfAllExhausted = () => {
    const allPersonal = state.personal.length >= CONTENT.personalPrompts.length;
    const allWork = state.work.length >= CONTENT.workPrompts.length;
    if (allPersonal && allWork) {
      state.personal = [];
      state.work = [];
      persist();
    }
  };

  return {
    seenSet(kind) { return new Set(state[kind] || []); },
    markPromptSeen(prompt, kind) {
      if (!state[kind]) return;
      if (!state[kind].includes(prompt)) {
        state[kind].push(prompt);
        persist();
      }
    },
    completeRun() {
      state.runs += 1;
      persist();
    },
    runs() { return state.runs; },
    unlocked() { return state.personal.length + state.work.length; },
    total,
    recycleIfAllExhausted,
    // Pull the latest from localStorage before reading, so UI never shows a
    // stale count when state has changed elsewhere (other tab, prior page
    // load, etc.).
    refresh() { mergeFromStorage(); },
    reset() {
      state = empty();
      persist();
    },
  };
})();
function getDrawSize(img, maxH, maxW = 99999) {
  if (!img || !img.complete || !img.naturalWidth) return { w: 60, h: maxH };
  const s = Math.min(maxH / img.naturalHeight, maxW / img.naturalWidth);
  return { w: img.naturalWidth * s, h: img.naturalHeight * s };
}

// ===== State =====
let state = "title";
let dialogueEntries = [];
let dialogueIndex = 0;
let transition = null;
let playAgainSelection = "yes";
let pendingScrollContinue = null;
let endingTimAt = 0;

let run = null;

const player = {
  cx: 0, cy: 0,
  speed: 3.6,
  walkPhase: 0,
  facing: "right",
  bobActive: false,
};

// Pick prompts for a single playthrough, with category-aware rules:
//   1. By default, 3 unseen personal + 3 unseen work.
//   2. If a category doesn't have 3 unseen prompts, top up those slots from
//      the OTHER category's unseen pool, so the player keeps seeing fresh
//      memories for as long as either pool has anything new to offer.
//   3. Only if BOTH pools are exhausted do we fall back to repeats (and at
//      that point `recycleIfAllExhausted` will have reset everything anyway).
// Each picked prompt keeps its original `kind` (personal/work) so we track
// seen-state against the correct pool even when it "borrows" a slot.
function pickPlaythroughPrompts() {
  const seenP = progress.seenSet("personal");
  const seenW = progress.seenSet("work");
  const unseenPersonal = shuffle(
    CONTENT.personalPrompts.filter(p => !seenP.has(p.prompt)).map(p => ({ ...p, kind: "personal" }))
  );
  const unseenWork = shuffle(
    CONTENT.workPrompts.filter(p => !seenW.has(p.prompt)).map(p => ({ ...p, kind: "work" }))
  );

  // Step 1: each category takes up to 3 of its own unseen prompts.
  const personalSlots = unseenPersonal.splice(0, 3);
  const workSlots = unseenWork.splice(0, 3);

  // Step 2: cross-fill shortfalls from the other category's remaining unseen.
  while (personalSlots.length < 3 && unseenWork.length > 0) {
    personalSlots.push(unseenWork.shift());
  }
  while (workSlots.length < 3 && unseenPersonal.length > 0) {
    workSlots.push(unseenPersonal.shift());
  }

  // Step 3: both pools truly empty? Repeat from seen as a last resort. This
  // should basically never trigger because recycleIfAllExhausted resets the
  // state before we get here.
  const stillShortP = 3 - personalSlots.length;
  const stillShortW = 3 - workSlots.length;
  if (stillShortP > 0) {
    const pool = shuffle(CONTENT.personalPrompts.map(p => ({ ...p, kind: "personal" })));
    personalSlots.push(...pool.slice(0, stillShortP));
  }
  if (stillShortW > 0) {
    const pool = shuffle(CONTENT.workPrompts.map(p => ({ ...p, kind: "work" })));
    workSlots.push(...pool.slice(0, stillShortW));
  }

  return [...personalSlots, ...workSlots];
}

function startRun() {
  // Only reset when BOTH categories are fully seen. This keeps personal from
  // recycling before the player has also seen all of work.
  progress.recycleIfAllExhausted();
  const prompts = shuffle(pickPlaythroughPrompts());
  const npcOrder = shuffle(CONTENT.npcs);

  // Room 0 = empty tutorial. Rooms 1-6 = NPCs.
  const tutorial = { isTutorial: true, doorOpen: false };
  const npcRooms = npcOrder.map((npc, i) => ({
    isTutorial: false,
    npc: { ...npc, visited: false, cx: W * 0.5, cy: H * 0.6 },
    prompt: prompts[i].prompt,
    answer: prompts[i].answer,
    kind: prompts[i].kind,
    doorOpen: false,
  }));

  run = {
    rooms: [tutorial, ...npcRooms],
    currentRoom: 0,
    collected: 0,
  };
}

function spawnPlayerInRoom(isTutorial = false) {
  if (isTutorial) {
    player.cx = W * 0.5;
    player.cy = H * 0.55;
  } else {
    player.cx = PLAY_LEFT + 80;
    player.cy = H * 0.55;
  }
  player.facing = "right";
}

// ===== Input =====
const keys = Object.create(null);
const justPressed = new Set();
window.addEventListener("keydown", (e) => {
  if ([" ", "Enter", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Escape", "m", "M"].includes(e.key)) {
    e.preventDefault();
  }
  sfx.init();
  music.kickIfPaused();
  if (e.repeat) return;
  keys[e.key] = true;
  justPressed.add(e.key);
  if (e.key === "m" || e.key === "M") {
    const muted = sfx.toggleMute();
    music.setMuted(muted);
  }
  if (e.key === "r" || e.key === "R") {
    startResetHold();
  }
});
window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
  if (e.key === "r" || e.key === "R") {
    cancelResetHold();
  }
});
// If the tab loses focus mid-hold, cancel so the player can't accidentally
// wipe progress by leaving the page with R held down.
window.addEventListener("blur", cancelResetHold);

// Keep the in-memory progress state in sync with other tabs / windows.
// When localStorage is written in another tab, every other tab for this
// origin gets a `storage` event; refresh progress and re-render whichever
// counter is currently on screen so they never disagree.
window.addEventListener("storage", (e) => {
  if (e.key !== "tim-ial-pursuit:progress:v1") return;
  progress.refresh();
  if (state === "title") refreshMemCount();
  if (state === "playAgain") refreshPlayAgainHint();
});
function consume(k) {
  const had = justPressed.has(k);
  justPressed.delete(k);
  return had;
}

// ===== DOM refs =====
const el = {
  title: document.getElementById("title"),
  titleSub: document.getElementById("titleSub"),
  scroll: document.getElementById("scroll"),
  scrollText: document.getElementById("scrollText"),
  dialogue: document.getElementById("dialogue"),
  speakerName: document.getElementById("speakerName"),
  dialogueBody: document.getElementById("dialogueBody"),
  portrait: document.getElementById("portrait"),
  playAgain: document.getElementById("playAgain"),
  playYes: document.getElementById("playYes"),
  playNo: document.getElementById("playNo"),
  playAgainHint: document.getElementById("playAgainHint"),
  playAgainCount: document.getElementById("playAgainCount"),
  memCount: document.getElementById("memCount"),
  resetHint: document.getElementById("resetHint"),
  titleVersion: document.getElementById("titleVersion"),
  credits: document.getElementById("credits"),
  creditsList: document.getElementById("creditsList"),
};
// Render the version string from content.js once at startup; bumping
// CONTENT.version is enough to update it.
if (el.titleVersion) el.titleVersion.textContent = CONTENT.version || "";

function renderCredits() {
  const list = CONTENT.credits || [];
  const frag = document.createDocumentFragment();
  for (const entry of list) {
    const block = document.createElement("div");
    block.className = "credits-entry";
    const role = document.createElement("div");
    role.className = "credits-role";
    role.textContent = entry.role;
    block.appendChild(role);
    for (const name of entry.names) {
      const n = document.createElement("div");
      n.className = "credits-name";
      n.textContent = name;
      block.appendChild(n);
    }
    frag.appendChild(block);
  }
  el.creditsList.replaceChildren(frag);
}
renderCredits();
el.titleSub.textContent = CONTENT.subtitle;

function refreshMemCount() {
  // Always pull the latest state from localStorage before rendering, so
  // returning to the title from a run (or switching tabs) can't show stale
  // numbers.
  progress.refresh();
  // Only surface the counter (and the reset affordance) once the player has
  // completed at least one playthrough OR unlocked at least one memory.
  // First-timers shouldn't be greeted by a 0/26 score or a reset prompt.
  const show = progress.runs() >= 1 || progress.unlocked() > 0;
  if (!show) {
    el.memCount.classList.add("hidden");
    el.resetHint.classList.add("hidden");
    return;
  }
  el.memCount.textContent = `Memories unlocked: ${progress.unlocked()} / ${progress.total()}`;
  el.memCount.classList.remove("hidden");
  el.resetHint.textContent = "Hold R to reset progress";
  el.resetHint.classList.remove("hidden");
  el.resetHint.classList.remove("holding");
}

// Hold-to-confirm progress reset (only active on the title screen). The
// player must hold R for ~1.2s; releasing or leaving the title cancels.
const RESET_HOLD_MS = 1200;
let resetHoldStart = 0;
let resetHoldTimer = null;
function startResetHold() {
  if (state !== "title") return;
  if (!(progress.runs() >= 1 || progress.unlocked() > 0)) return;
  if (resetHoldTimer) return;
  resetHoldStart = performance.now();
  el.resetHint.classList.add("holding");
  el.resetHint.textContent = "Keep holding R...";
  resetHoldTimer = setTimeout(() => {
    progress.reset();
    refreshMemCount();
    el.resetHint.classList.remove("holding");
    el.resetHint.textContent = "Progress reset.";
    sfx.playSelect();
    // After a short beat, restore the default label (or hide if there's now
    // nothing to reset, which there won't be).
    setTimeout(() => refreshMemCount(), 1400);
    resetHoldTimer = null;
  }, RESET_HOLD_MS);
}
function cancelResetHold() {
  if (!resetHoldTimer) return;
  clearTimeout(resetHoldTimer);
  resetHoldTimer = null;
  el.resetHint.classList.remove("holding");
  // Restore the default label so it's clear the cancel worked.
  if (!el.resetHint.classList.contains("hidden")) {
    el.resetHint.textContent = "Hold R to reset progress";
  }
}

// ===== State navigation =====
function gotoTitle() {
  state = "title";
  el.title.classList.remove("hidden");
  el.scroll.classList.add("hidden");
  el.dialogue.classList.add("hidden");
  el.playAgain.classList.add("hidden");
  if (el.credits) el.credits.classList.add("hidden");
  refreshMemCount();
  // Request dungeon music; it'll start at the first user keypress
  // (browser autoplay policy) and keeps playing into the dungeon.
  music.play("dungeon");
}

function gotoCredits() {
  if (state !== "title") return;
  cancelResetHold();
  state = "credits";
  if (el.credits) el.credits.classList.remove("hidden");
}
function dismissCredits() {
  if (el.credits) el.credits.classList.add("hidden");
  state = "title";
}

function gotoIntroScroll() {
  cancelResetHold();
  el.title.classList.add("hidden");
  el.playAgain.classList.add("hidden");
  startRun();
  showScroll(CONTENT.introScroll, () => {
    state = "play";
    spawnPlayerInRoom(true);
    music.play("dungeon");
  });
  state = "introScroll";
}

// Scroll pagination state. `showScroll` accepts either a single string or an
// array of entries; entries may themselves be strings or { text, big }
// objects (where `big: true` renders that page at emphasis size).
let scrollPages = [];
let scrollPageIndex = 0;

function showScroll(value, onContinue) {
  scrollPages = Array.isArray(value) ? value.slice() : [value];
  scrollPageIndex = 0;
  el.scroll.classList.remove("hidden");
  pendingScrollContinue = onContinue;
  renderScrollPage();
}
function renderScrollPage() {
  const entry = scrollPages[scrollPageIndex];
  const isObj = entry && typeof entry === "object";
  const text = isObj ? entry.text : String(entry || "");
  const big = !!(isObj && entry.big);
  el.scrollText.textContent = text;
  el.scrollText.classList.toggle("big", big);
  const hint = document.querySelector("#scroll .scroll-continue");
  if (hint) {
    const isLast = scrollPageIndex === scrollPages.length - 1;
    hint.textContent = isLast ? "[ press SPACE to continue ]" : "[ press SPACE for more \u2192 ]";
  }
}
function dismissScroll() {
  if (scrollPageIndex < scrollPages.length - 1) {
    scrollPageIndex++;
    sfx.playBlip();
    renderScrollPage();
    return;
  }
  el.scroll.classList.add("hidden");
  el.scrollText.classList.remove("big");
  if (pendingScrollContinue) {
    const cb = pendingScrollContinue;
    pendingScrollContinue = null;
    cb();
  }
}

function exitRoomEast() {
  startTransition(() => {
    if (run.currentRoom >= run.rooms.length - 1) {
      gotoEnding();
    } else {
      run.currentRoom++;
      const next = run.rooms[run.currentRoom];
      spawnPlayerInRoom(next.isTutorial);
      state = "play";
    }
  });
}

function startTransition(onMid) {
  transition = { phase: "out", startTime: performance.now(), onMid };
  state = "transition";
}
function updateTransition() {
  const now = performance.now();
  const elapsed = now - transition.startTime;
  if (transition.phase === "out" && elapsed >= TRANSITION_HALF_MS) {
    transition.onMid();
    transition.phase = "in";
    transition.startTime = now;
  } else if (transition.phase === "in" && elapsed >= TRANSITION_HALF_MS) {
    transition = null;
  }
}
function getTransitionAlpha() {
  if (!transition) return 0;
  const elapsed = performance.now() - transition.startTime;
  const t = Math.min(1, elapsed / TRANSITION_HALF_MS);
  return transition.phase === "out" ? t : 1 - t;
}

// Delay before the ending scroll auto-pops over the meadow scene. Long enough
// to hear the victory sting and see Tim arrive; short enough that pressing
// SPACE rarely feels necessary.
const ENDING_SCROLL_DELAY_MS = 1600;

function gotoEnding() {
  state = "endingScene";
  endingTimAt = performance.now();
  progress.completeRun();
  music.play("victory");
  sfx.playVictory();
  setTimeout(() => {
    if (state !== "endingScene") return;
    showScroll(CONTENT.endingScroll, () => gotoPlayAgainMenu());
    state = "endingScroll";
  }, ENDING_SCROLL_DELAY_MS);
}

function gotoPlayAgainMenu() {
  state = "playAgain";
  playAgainSelection = "yes";
  el.playAgain.classList.remove("hidden");
  updatePlayAgainSelection();
  refreshPlayAgainHint();
}

function refreshPlayAgainHint() {
  // Pull the freshest state before rendering so the count can never lag the
  // progress the player JUST made by finishing this run.
  progress.refresh();
  if (!el.playAgainHint || !el.playAgainCount) return;

  const unlocked = progress.unlocked();
  const total = progress.total();

  // Count line: always shown, big and factual.
  el.playAgainCount.textContent = `You have unlocked ${unlocked} of ${total} memories!`;

  // Nudge line: celebrate or encourage depending on where they are.
  if (unlocked >= total) {
    el.playAgainHint.textContent = `You've discovered every piece of Tim's story.`;
  } else {
    const remaining = total - unlocked;
    el.playAgainHint.textContent =
      `Play again to hear ${remaining === 1 ? "the last one" : "more of them"}!`;
  }
}
function updatePlayAgainSelection() {
  el.playYes.classList.toggle("selected", playAgainSelection === "yes");
  el.playNo.classList.toggle("selected", playAgainSelection === "no");
}

// ===== Dialogue =====
// Split a value into pages. Accepts arrays, or strings using `||` or a line
// of `---` as an explicit page break. Long single-string entries are also
// auto-wrapped if they exceed AUTO_PAGE_CHARS (so authors don't HAVE to
// paginate manually).
const AUTO_PAGE_CHARS = 320;
function toPages(value) {
  if (value == null) return [""];
  let parts;
  if (Array.isArray(value)) {
    parts = value.map(p => String(p).trim()).filter(Boolean);
  } else {
    parts = String(value)
      .split(/\s*\|\|\s*|\n\s*---+\s*\n/)
      .map(p => p.trim())
      .filter(Boolean);
  }
  if (!parts.length) return [""];
  const out = [];
  for (const p of parts) {
    if (p.length <= AUTO_PAGE_CHARS) { out.push(p); continue; }
    // Auto-split on sentence boundaries to stay under the page budget.
    const sentences = p.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [p];
    let buf = "";
    for (const s of sentences) {
      const t = s.trim();
      if (!t) continue;
      if (buf && (buf.length + 1 + t.length) > AUTO_PAGE_CHARS) {
        out.push(buf); buf = t;
      } else {
        buf = buf ? `${buf} ${t}` : t;
      }
    }
    if (buf) out.push(buf);
  }
  return out;
}

// Tim's portrait (shown in the dialogue box whenever Tim is speaking).
const TIM_SPRITE = "assets/tim.png";

function buildDialogueEntries(room) {
  const entries = [];
  const npcName = room.npc.name;
  const makeTim = text => ({ speaker: "Tim", text, who: "tim" });
  const makeNpc = text => ({ speaker: npcName, text, who: "npc" });

  // 1) Intro back-and-forth (NPC reacts → Tim responds → NPC agrees to help).
  //    Each step may be { npc: "..." } or { tim: "..." }; long steps still
  //    honor `||` and auto-pagination via toPages().
  const intro = room.npc.intro;
  if (Array.isArray(intro)) {
    for (const step of intro) {
      if (step && typeof step.npc === "string") {
        for (const t of toPages(step.npc)) entries.push(makeNpc(t));
      } else if (step && typeof step.tim === "string") {
        for (const t of toPages(step.tim)) entries.push(makeTim(t));
      }
    }
  } else if (typeof room.npc.flavor === "string") {
    // Back-compat: if someone still has old-style `flavor`, treat as NPC text.
    for (const t of toPages(room.npc.flavor)) entries.push(makeNpc(t));
  }

  // 2) Tim asks the memory question.
  const question = CONTENT.questionTemplate.replace("{prompt}", room.prompt);
  for (const t of toPages(question)) entries.push(makeTim(t));

  // 3) NPC recounts the memory.
  for (const t of toPages(room.answer)) entries.push(makeNpc(t));

  return entries;
}

function openDialogue(room) {
  state = "dialogue";
  dialogueEntries = buildDialogueEntries(room);
  dialogueIndex = 0;
  el.dialogue.classList.remove("hidden");
  showDialogueEntry(room);
}
function showDialogueEntry(room) {
  const entry = dialogueEntries[dialogueIndex];
  el.speakerName.textContent = entry.speaker;
  el.dialogueBody.textContent = entry.text;

  // Swap the portrait to match who's currently talking. Tim gets his own
  // sprite; NPCs with `flipX` get horizontally mirrored in the portrait too
  // so they stay facing Tim (matching their in-dungeon orientation).
  if (entry.who === "tim") {
    el.portrait.style.backgroundImage = `url("${TIM_SPRITE}")`;
    el.portrait.classList.remove("flipped");
  } else {
    el.portrait.style.backgroundImage = `url("${room.npc.sprite}")`;
    el.portrait.classList.toggle("flipped", !!room.npc.flipX);
  }

  // Continue hint shows page progress when there's more to read.
  const hint = document.getElementById("continueHint");
  if (hint) {
    const isLast = dialogueIndex === dialogueEntries.length - 1;
    hint.textContent = isLast ? "[ SPACE ]" : "[ SPACE ]  more \u2192";
  }
}
function advanceDialogue(room) {
  dialogueIndex++;
  if (dialogueIndex >= dialogueEntries.length) {
    closeDialogue(room);
  } else {
    sfx.playBlip();
    showDialogueEntry(room);
  }
}
function closeDialogue(room) {
  el.dialogue.classList.add("hidden");
  if (!room.npc.visited) {
    room.npc.visited = true;
    run.collected++;
    room.doorOpen = true;
    progress.markPromptSeen(room.prompt, room.kind);
    sfx.playChime();
    setTimeout(() => sfx.playDoor(), 520);
  }
  state = "play";
}

function nearDoor() {
  return Math.hypot(player.cx - E_DOOR_X, player.cy - E_DOOR_Y) < DOOR_INTERACT_RADIUS;
}
function nearNPC(npc) {
  return Math.hypot(player.cx - npc.cx, player.cy - npc.cy) < NPC_INTERACT_RADIUS;
}

function tryOpenTutorialDoor(room) {
  if (room.doorOpen) return;
  room.doorOpen = true;
  sfx.playChime();
  setTimeout(() => sfx.playDoor(), 200);
}

// ===== Update =====
function update() {
  if (state === "title") {
    if (consume(" ") || consume("Enter")) {
      sfx.playSelect();
      gotoIntroScroll();
    } else if (consume("c") || consume("C")) {
      sfx.playBlip();
      gotoCredits();
    }
    justPressed.clear(); return;
  }

  if (state === "credits") {
    if (consume(" ") || consume("Enter") || consume("Escape")) {
      sfx.playBlip();
      dismissCredits();
    }
    justPressed.clear(); return;
  }

  if (state === "introScroll" || state === "endingScroll") {
    if (consume(" ") || consume("Enter")) {
      sfx.playSelect();
      dismissScroll();
    }
    justPressed.clear(); return;
  }

  if (state === "transition") { updateTransition(); justPressed.clear(); return; }

  if (state === "endingScene") {
    if (consume(" ") || consume("Enter")) {
      showScroll(CONTENT.endingScroll, () => gotoPlayAgainMenu());
      state = "endingScroll";
    }
    justPressed.clear(); return;
  }

  if (state === "playAgain") {
    if (consume("ArrowLeft") || consume("ArrowRight")) {
      playAgainSelection = playAgainSelection === "yes" ? "no" : "yes";
      updatePlayAgainSelection();
      sfx.playBlip();
    }
    if (consume(" ") || consume("Enter")) {
      sfx.playSelect();
      el.playAgain.classList.add("hidden");
      if (playAgainSelection === "yes") gotoIntroScroll();
      else gotoTitle();
    }
    justPressed.clear(); return;
  }

  if (state === "dialogue") {
    const room = run.rooms[run.currentRoom];
    if (consume(" ") || consume("Enter")) advanceDialogue(room);
    justPressed.clear(); return;
  }

  // ====== state === "play" ======
  const room = run.rooms[run.currentRoom];
  let dx = 0, dy = 0;
  if (keys.ArrowLeft) { dx -= player.speed; player.facing = "left"; }
  if (keys.ArrowRight) { dx += player.speed; player.facing = "right"; }
  if (keys.ArrowUp) dy -= player.speed;
  if (keys.ArrowDown) dy += player.speed;
  if (dx && dy) { dx *= 0.7071; dy *= 0.7071; }

  const newCx = clamp(player.cx + dx, PLAY_LEFT + 30, PLAY_RIGHT - 5);
  const newCy = clamp(player.cy + dy, PLAY_TOP + 30, PLAY_BOTTOM - 10);

  if (room.isTutorial) {
    player.cx = newCx;
    player.cy = newCy;
  } else {
    const npc = room.npc;
    if (Math.hypot(newCx - npc.cx, newCy - npc.cy) > NPC_COLLISION_RADIUS) {
      player.cx = newCx; player.cy = newCy;
    } else {
      if (Math.hypot(newCx - npc.cx, player.cy - npc.cy) > NPC_COLLISION_RADIUS) player.cx = newCx;
      if (Math.hypot(player.cx - npc.cx, newCy - npc.cy) > NPC_COLLISION_RADIUS) player.cy = newCy;
    }
  }

  if (dx || dy) player.walkPhase += 0.3;
  player.bobActive = !!(dx || dy);

  // Walk through east door (only if open)
  if (room.doorOpen) {
    const dxd = player.cx - E_DOOR_X;
    const dyd = player.cy - E_DOOR_Y;
    if (Math.abs(dxd) < 38 && Math.abs(dyd) < 100) {
      exitRoomEast();
      justPressed.clear();
      return;
    }
  }

  // SPACE to interact
  if (consume(" ") || consume("Enter")) {
    if (room.isTutorial) {
      if (!room.doorOpen && nearDoor()) tryOpenTutorialDoor(room);
    } else {
      if (nearNPC(room.npc)) openDialogue(room);
    }
  }

  justPressed.clear();
}

// ===== Render =====
function getRoomImage(room) {
  if (room.isTutorial) return room.doorOpen ? imgs.room1Open : imgs.room1Closed;
  return room.doorOpen ? imgs.roomMidOpen : imgs.roomMidClosed;
}

function render() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  if (state === "title") return;

  if (state === "endingScene" || state === "endingScroll" || state === "playAgain") {
    if (imgs.ending && imgs.ending.complete && imgs.ending.naturalWidth) {
      ctx.drawImage(imgs.ending, 0, 0, W, H);
    }
    drawEndingTim();
    return;
  }

  if (run) {
    const room = run.rooms[run.currentRoom];
    const roomImg = getRoomImage(room);
    if (roomImg && roomImg.complete && roomImg.naturalWidth) {
      ctx.drawImage(roomImg, 0, 0, W, H);
    }

    if (room.doorOpen) drawExitArrow();

    if (room.isTutorial) {
      drawPlayer();
    } else {
      const npcY = room.npc.cy;
      if (player.cy < npcY) { drawPlayer(); drawNPC(room.npc); }
      else { drawNPC(room.npc); drawPlayer(); }
    }

    drawHUD();
    drawTooltip(room);
  }

  const a = getTransitionAlpha();
  if (a > 0) {
    ctx.fillStyle = `rgba(0,0,0,${a})`;
    ctx.fillRect(0, 0, W, H);
  }

  if (sfx.muted) drawMutedBadge();
}

function drawTooltip(room) {
  let text = null;
  if (room.isTutorial) {
    if (!room.doorOpen && nearDoor()) text = "[ SPACE ]  Open the door";
  } else {
    if (!room.npc.visited && nearNPC(room.npc)) {
      text = `[ SPACE ]  Talk to ${room.npc.name}`;
    }
  }
  if (!text) return;

  ctx.font = "bold 26px 'Patrick Hand', cursive";
  ctx.textAlign = "center";
  const padX = 18, padY = 12;
  const tw = ctx.measureText(text).width;
  const bw = tw + padX * 2;
  const bh = 50;

  const x = player.cx - bw / 2;
  const y = player.cy - TIM_HEIGHT - 70;

  // bubble
  ctx.fillStyle = "#fffaf0";
  roundRect(x, y, bw, bh, 10); ctx.fill();
  ctx.strokeStyle = "#1a1210"; ctx.lineWidth = 3;
  roundRect(x, y, bw, bh, 10); ctx.stroke();

  // tail
  ctx.fillStyle = "#fffaf0";
  ctx.beginPath();
  ctx.moveTo(player.cx - 10, y + bh);
  ctx.lineTo(player.cx + 10, y + bh);
  ctx.lineTo(player.cx, y + bh + 12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#1a1210";
  ctx.beginPath();
  ctx.moveTo(player.cx - 10, y + bh);
  ctx.lineTo(player.cx, y + bh + 12);
  ctx.lineTo(player.cx + 10, y + bh);
  ctx.stroke();
  // re-cover the seam
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(player.cx - 9, y + bh - 1, 18, 3);

  ctx.fillStyle = "#1a1210";
  ctx.textBaseline = "middle";
  ctx.fillText(text, player.cx, y + bh / 2);
  ctx.textBaseline = "alphabetic";
}

function drawNPC(npc) {
  const img = imgs[npc.id];
  if (!img.complete || !img.naturalWidth) return;
  const cfg = CONTENT.npcs.find(n => n.id === npc.id);
  const maxH = cfg.maxHeight || 110;
  const { w, h } = getDrawSize(img, maxH, maxH * 1.7);

  ctx.fillStyle = "rgba(0,0,0,0.32)";
  ctx.beginPath();
  ctx.ellipse(npc.cx, npc.cy, w * 0.36, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  if (cfg.flipX) {
    ctx.save();
    ctx.translate(npc.cx, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(img, -w / 2, npc.cy - h, w, h);
    ctx.restore();
  } else {
    ctx.drawImage(img, npc.cx - w / 2, npc.cy - h, w, h);
  }

  if (!npc.visited) {
    const t = performance.now() * 0.006;
    const cy = npc.cy - h - 16 + Math.sin(t) * 2;
    ctx.fillStyle = `rgba(255, 200, 60, ${0.55 + Math.sin(t) * 0.25})`;
    ctx.beginPath(); ctx.arc(npc.cx, cy, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff5c4";
    ctx.beginPath(); ctx.arc(npc.cx, cy, 4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#1a1210"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(npc.cx, cy, 9, 0, Math.PI * 2); ctx.stroke();
  }
}

function drawPlayer(opts = {}) {
  const img = imgs.tim;
  if (!img.complete || !img.naturalWidth) return;
  const targetH = opts.height || TIM_HEIGHT;
  const { w, h } = getDrawSize(img, targetH);
  const cx = opts.cx ?? player.cx;
  const cy = opts.cy ?? player.cy;
  const facing = opts.facing ?? player.facing;
  const bob = (player.bobActive && opts.cx === undefined) ? Math.sin(player.walkPhase) * 1.5 : 0;
  ctx.fillStyle = "rgba(0,0,0,0.32)";
  ctx.beginPath(); ctx.ellipse(cx, cy, w * 0.4, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  if (facing === "left") { ctx.translate(cx, 0); ctx.scale(-1, 1); ctx.translate(-cx, 0); }
  ctx.drawImage(img, cx - w / 2, cy - h + bob, w, h);
  ctx.restore();
}

function drawEndingTim() {
  drawPlayer({ cx: ENDING_TIM_X, cy: ENDING_TIM_Y, height: ENDING_TIM_HEIGHT, facing: "right" });
}

function drawHUD() {
  // Memory wheel only (room counter intentionally removed)
  const wheelImg = imgs[`wheel${run.collected}`];
  const size = 130;
  const x = W - size - 32;
  const y = 22;
  ctx.fillStyle = "rgba(244, 239, 226, 0.92)";
  roundRect(x - 12, y - 12, size + 24, size + 46, 10); ctx.fill();
  ctx.strokeStyle = "#1a1210"; ctx.lineWidth = 2.5;
  roundRect(x - 12, y - 12, size + 24, size + 46, 10); ctx.stroke();
  if (wheelImg && wheelImg.complete && wheelImg.naturalWidth) {
    ctx.drawImage(wheelImg, x, y, size, size);
  }
  ctx.fillStyle = "#1a1210";
  ctx.font = "bold 18px 'Patrick Hand', cursive";
  ctx.textAlign = "center";
  ctx.fillText(`${run.collected} / 6 memories`, x + size / 2, y + size + 26);
}

function drawExitArrow() {
  const t = performance.now() * 0.005;
  const bob = Math.sin(t) * 5;
  const x = E_DOOR_X - 78 + bob;
  const y = E_DOOR_Y;
  // SOLID arrow, fully opaque, with thick black outline
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 38, y - 26);
  ctx.lineTo(x - 38, y - 10);
  ctx.lineTo(x - 70, y - 10);
  ctx.lineTo(x - 70, y + 10);
  ctx.lineTo(x - 38, y + 10);
  ctx.lineTo(x - 38, y + 26);
  ctx.closePath();
  ctx.fillStyle = "#ffce2b";
  ctx.fill();
  ctx.strokeStyle = "#1a1210";
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawMutedBadge() {
  ctx.fillStyle = "rgba(244, 239, 226, 0.85)";
  roundRect(W - 64, H - 38, 48, 22, 4); ctx.fill();
  ctx.strokeStyle = "#1a1210"; ctx.lineWidth = 1.5;
  roundRect(W - 64, H - 38, 48, 22, 4); ctx.stroke();
  ctx.fillStyle = "#1a1210";
  ctx.font = "11px 'Patrick Hand', cursive";
  ctx.textAlign = "center";
  ctx.fillText("MUTED", W - 40, H - 23);
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ===== Boot =====
function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}
gotoTitle();
requestAnimationFrame(loop);
