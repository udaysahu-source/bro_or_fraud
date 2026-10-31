import { loadSettings } from "./settings";

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!this.ctx) {
      this.ctx = new AudioContextClass();

      // Dynamics compressor prevents distortion/clipping while maximizing loudness on phone speakers
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(10, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(6, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.18, this.ctx.currentTime);

      // Master gain node provides clean volume boost for group room audibility
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.2, this.ctx.currentTime);

      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private getDestination(): AudioNode | null {
    const ctx = this.getContext();
    if (!ctx) return null;
    return this.masterGain || ctx.destination;
  }

  private isEnabled(): boolean {
    if (typeof window === "undefined") return false;
    const settings = loadSettings();
    return settings.soundEnabled !== false;
  }

  /**
   * Sound effect when a player flips the card or gets their secret/decoy role.
   * Plays the exact same sound for all players to maintain secrecy in social deduction.
   * High-contrast crystal chime arpeggio audible across the room.
   */
  playRoleReveal() {
    if (!this.isEnabled()) return;
    const ctx = this.getContext();
    const dest = this.getDestination();
    if (!ctx || !dest) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + i * 0.06;

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.75, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  }

  /**
   * Sound effect when passing phone to the next player.
   * Bright, snappy upward swipe tone.
   */
  playNextPlayerPass() {
    if (!this.isEnabled()) return;
    const ctx = this.getContext();
    const dest = this.getDestination();
    if (!ctx || !dest) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(1040, now + 0.14);

    gain.gain.setValueAtTime(0.85, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * Sound effect when all players are done and DISCUSSION starts!
   * High-energy fanfare + resonant boxing bell chime so the entire room is alerted.
   */
  playDiscussionStart() {
    if (!this.isEnabled()) return;
    const ctx = this.getContext();
    const dest = this.getDestination();
    if (!ctx || !dest) return;

    const now = ctx.currentTime;

    // 1. Energetic ascending fanfare
    const fanfare = [
      { freq: 392.0, time: 0.0, dur: 0.12 }, // G4
      { freq: 523.25, time: 0.1, dur: 0.12 }, // C5
      { freq: 659.25, time: 0.2, dur: 0.12 }, // E5
      { freq: 783.99, time: 0.3, dur: 0.35 }, // G5 (accented)
      { freq: 1046.5, time: 0.42, dur: 0.45 }, // C6 (high finale)
    ];

    fanfare.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const st = now + time;

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, st);

      gain.gain.setValueAtTime(0, st);
      gain.gain.linearRampToValueAtTime(0.88, st + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, st + dur);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(st);
      osc.stop(st + dur);
    });

    // 2. Resonant Bell / Gong chime effect tuned for smartphone speakers (880Hz + 1320Hz + 1760Hz)
    const gongFreqs = [880, 1320, 1760];
    gongFreqs.forEach((freq, idx) => {
      const gongOsc = ctx.createOscillator();
      const gongGain = ctx.createGain();
      const st = now + 0.4;

      gongOsc.type = "sine";
      gongOsc.frequency.setValueAtTime(freq, st);
      gongOsc.frequency.exponentialRampToValueAtTime(freq * 0.5, st + 1.2);

      const peak = idx === 0 ? 0.9 : 0.6;
      gongGain.gain.setValueAtTime(0, st);
      gongGain.gain.linearRampToValueAtTime(peak, st + 0.02);
      gongGain.gain.exponentialRampToValueAtTime(0.001, st + 1.4);

      gongOsc.connect(gongGain);
      gongGain.connect(dest);

      gongOsc.start(st);
      gongOsc.stop(st + 1.4);
    });
  }

  /**
   * Sound effect for discussion countdown tick.
   * Sharp, punchy click with high-mid frequency that carries through background conversation.
   */
  playTimerTick(isUrgent: boolean = false) {
    if (!this.isEnabled()) return;
    const ctx = this.getContext();
    const dest = this.getDestination();
    if (!ctx || !dest) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isUrgent ? "square" : "triangle";
    osc.frequency.setValueAtTime(isUrgent ? 1200 : 850, now);
    osc.frequency.exponentialRampToValueAtTime(isUrgent ? 300 : 250, now + 0.045);

    gain.gain.setValueAtTime(isUrgent ? 0.88 : 0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Sound effect when timer expires ("Time's up!").
   * Loud, urgent two-tone alarm pattern that rings across the room.
   */
  playTimerAlarm() {
    if (!this.isEnabled()) return;
    const ctx = this.getContext();
    const dest = this.getDestination();
    if (!ctx || !dest) return;

    const now = ctx.currentTime;
    const alertTones = [
      { delay: 0, freq: 784.0 }, // G5
      { delay: 0.12, freq: 1046.5 }, // C6
      { delay: 0.24, freq: 784.0 }, // G5
      { delay: 0.36, freq: 1046.5 }, // C6
      { delay: 0.48, freq: 1318.5 }, // E6
    ];

    alertTones.forEach(({ delay, freq }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const st = now + delay;

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, st);

      gain.gain.setValueAtTime(0, st);
      gain.gain.linearRampToValueAtTime(0.92, st + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.11);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(st);
      osc.stop(st + 0.11);
    });
  }

  /**
   * Sound effect when voting starts or a vote is locked in.
   * Firm, authoritative confirmation thud.
   */
  playVoteConfirm() {
    if (!this.isEnabled()) return;
    const ctx = this.getContext();
    const dest = this.getDestination();
    if (!ctx || !dest) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.16);

    gain.gain.setValueAtTime(0.85, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * Sound effect on verdict.
   * Loud victory fanfare or dramatic sting.
   */
  playVerdict(isBroWin: boolean) {
    if (!this.isEnabled()) return;
    const ctx = this.getContext();
    const dest = this.getDestination();
    if (!ctx || !dest) return;

    const now = ctx.currentTime;
    if (isBroWin) {
      // Triumphant victory fanfare chord
      const chord = [523.25, 659.25, 783.99, 1046.5];
      chord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const st = now + i * 0.08;

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, st);

        gain.gain.setValueAtTime(0, st);
        gain.gain.linearRampToValueAtTime(0.9, st + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, st + 0.65);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(st);
        osc.stop(st + 0.65);
      });
    } else {
      // Dramatic Fraud Escape sting
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.45);

      gain.gain.setValueAtTime(0.88, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.55);
    }
  }

  /**
   * Sound effect for suspense heartbeat during dramatic voting reveal.
   * Tuned with mid-bass punch so it is clearly felt and heard on mobile phone speakers.
   */
  playSuspenseHeartbeat() {
    if (!this.isEnabled()) return;
    const ctx = this.getContext();
    const dest = this.getDestination();
    if (!ctx || !dest) return;

    const now = ctx.currentTime;
    [0, 0.12].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const st = now + delay;

      osc.type = "triangle";
      osc.frequency.setValueAtTime(i === 0 ? 160 : 130, st);
      osc.frequency.exponentialRampToValueAtTime(60, st + 0.12);

      gain.gain.setValueAtTime(0, st);
      gain.gain.linearRampToValueAtTime(0.85, st + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.14);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(st);
      osc.stop(st + 0.14);
    });
  }
}

export const soundFx = new SoundManager();

export const playRoleRevealSound = () => soundFx.playRoleReveal();
export const playPassTurnSound = () => soundFx.playNextPlayerPass();
export const playDiscussionStartSound = () => soundFx.playDiscussionStart();
export const playTimerTickSound = (isUrgent: boolean = false) => soundFx.playTimerTick(isUrgent);
export const playTimerAlarmSound = () => soundFx.playTimerAlarm();
export const playVoteConfirmSound = () => soundFx.playVoteConfirm();
export const playVerdictSound = (isBroWin: boolean) => soundFx.playVerdict(isBroWin);
export const playVictorySound = () => soundFx.playVerdict(true);
export const playSuspenseHeartbeat = () => soundFx.playSuspenseHeartbeat();
export const playSuspenseHeartbeatSound = () => soundFx.playSuspenseHeartbeat();
