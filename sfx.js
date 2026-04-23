// =========================================================
// SFX — synthesized sound effects via WebAudio
// =========================================================

const sfx = {
  ctx: null,
  muted: false,
  volume: 0.35,

  init() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
  },

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  },

  // pure tone with envelope
  _tone(freq, when, dur, wave = "sine", vol = 0.3) {
    const osc = this.ctx.createOscillator();
    osc.type = wave;
    osc.frequency.value = freq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(vol * this.volume, when + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0008, when + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(when);
    osc.stop(when + dur + 0.05);
  },

  // pleasant rising chord — memory collected
  playChime() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((f, i) => this._tone(f, t + i * 0.07, 0.55, "sine", 0.32));
    notes.forEach((f, i) => this._tone(f * 2, t + i * 0.07, 0.45, "sine", 0.12));
  },

  // wooden door open — filtered noise burst with a low thud
  playDoor() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // noise sweep
    const noise = this.ctx.createBufferSource();
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.7, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.exponentialRampToValueAtTime(180, t + 0.55);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.45 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    noise.connect(filter).connect(gain).connect(this.ctx.destination);
    noise.start(t);
    noise.stop(t + 0.7);

    // low thud
    this._tone(70, t, 0.4, "sine", 0.5);
  },

  // tiny dialogue advance / menu nav blip
  playBlip() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    this._tone(520, this.ctx.currentTime, 0.05, "square", 0.18);
  },

  // confirmation
  playSelect() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this._tone(523, t, 0.08, "square", 0.25);
    this._tone(784, t + 0.07, 0.12, "square", 0.25);
  },

  // big victory flourish
  playVictory() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const seq = [523, 659, 784, 1047, 1319];
    seq.forEach((f, i) => this._tone(f, t + i * 0.12, 0.7, "triangle", 0.32));
  },
};

// Music handler — gracefully no-ops if mp3 files don't exist yet
const music = {
  dungeon: new Audio("assets/song-dungeon.mp3"),
  victory: new Audio("assets/song-victory.mp3"),
  current: null,
  muted: false,

  init() {
    this.dungeon.loop = true;
    this.dungeon.volume = 0.22;
    this.victory.loop = true;
    this.victory.volume = 0.55;
    this.dungeon.addEventListener("error", () => {});
    this.victory.addEventListener("error", () => {});
  },

  play(track) {
    this.current = track;
    if (this.muted) return;
    if (track === "dungeon") {
      this.victory.pause();
      this.dungeon.currentTime = this.dungeon.currentTime || 0;
      this.dungeon.play().catch(() => {});
    } else if (track === "victory") {
      this.dungeon.pause();
      this.victory.currentTime = 0;
      this.victory.play().catch(() => {});
    } else {
      this.dungeon.pause();
      this.victory.pause();
    }
  },

  setMuted(m) {
    this.muted = m;
    if (m) {
      this.dungeon.pause();
      this.victory.pause();
    } else if (this.current) {
      this.play(this.current);
    }
  },

  // Browsers gate autoplay until the user interacts. Call this on any
  // user input to kick off the requested track if it failed to start.
  kickIfPaused() {
    if (this.muted || !this.current) return;
    const track = this.current === "dungeon" ? this.dungeon : this.victory;
    if (track.paused) track.play().catch(() => {});
  },
};

music.init();
