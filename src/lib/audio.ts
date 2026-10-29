import { loadSettings } from "./settings";

class SoundManager {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!this.ctx) {
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private isEnabled(): boolean {
    if (typeof window === "undefined") return false;
    const settings = loadSettings();
    return settings.soundEnabled !== false;
  }

  /**
   * Sound effect when a player flips the card or gets their secret/decoy role.
   * Plays the exact same sound for all players to maintain secrecy in social deduction.
   */
  playRoleReveal() {
    if (!this.isEnabled()) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // ✨ Crystal magical chord arpeggio for secret role verification
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + i * 0.06;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  }

  /**
   * Sound effect when passing phone to the next player
   */
  playNextPlayerPass() {
    if (!this.isEnabled()) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  /**
   * Sound effect when all players are done and DISCUSSION starts!
   * Energetic fanfare + ringing gong bell to alert the whole room.
   */
  playDiscussionStart() {
    if (!this.isEnabled()) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Energetic ascending fanfare brass/synth notes
    const fanfare = [
      { freq: 392.0, time: 0.0, dur: 0.12 },  // G4
      { freq: 523.25, time: 0.1, dur: 0.12 }, // C5
      { freq: 659.25, time: 0.2, dur: 0.12 }, // E5
      { freq: 783.99, time: 0.3, dur: 0.35 }, // G5 (accented)
      { freq: 1046.5, time: 0.42, dur: 0.4 }, // C6 (high finale)
    ];

    fanfare.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const st = now + time;

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, st);

      gain.gain.setValueAtTime(0, st);
      gain.gain.linearRampToValueAtTime(0.28, st + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, st + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(st);
      osc.stop(st + dur);
    });

    // 2. Resonant Boxing Bell / Gong chime effect
    const gongOsc1 = ctx.createOscillator();
    const gongOsc2 = ctx.createOscillator();
    const gongGain = ctx.createGain();

    gongOsc1.type = "sine";
    gongOsc1.frequency.setValueAtTime(880, now + 0.4);
    gongOsc1.frequency.exponentialRampToValueAtTime(440, now + 1.2);

    gongOsc2.type = "sine";
    gongOsc2.frequency.setValueAtTime(1320, now + 0.4);
    gongOsc2.frequency.exponentialRampToValueAtTime(660, now + 1.2);

    gongGain.gain.setValueAtTime(0, now + 0.4);
    gongGain.gain.linearRampToValueAtTime(0.25, now + 0.42);
    gongGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    gongOsc1.connect(gongGain);
    gongOsc2.connect(gongGain);
    gongGain.connect(ctx.destination);

    gongOsc1.start(now + 0.4);
    gongOsc2.start(now + 0.4);
    gongOsc1.stop(now + 1.5);
    gongOsc2.stop(now + 1.5);
  }

  /**
   * Sound effect for discussion countdown tick (subtle woodblock tick)
   */
  playTimerTick(isUrgent: boolean = false) {
    if (!this.isEnabled()) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(isUrgent ? 1100 : 750, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

    gain.gain.setValueAtTime(isUrgent ? 0.25 : 0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.045);
  }

  /**
   * Sound effect when timer expires ("Time's up!")
   */
  playTimerAlarm() {
    if (!this.isEnabled()) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [0, 0.15, 0.3].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const st = now + delay;

      osc.type = "square";
      osc.frequency.setValueAtTime(587.33, st); // D5

      gain.gain.setValueAtTime(0, st);
      gain.gain.linearRampToValueAtTime(0.18, st + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(st);
      osc.stop(st + 0.1);
    });
  }

  /**
   * Sound effect when voting starts or vote is locked
   */
  playVoteConfirm() {
    if (!this.isEnabled()) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  /**
   * Sound effect on verdict
   */
  playVerdict(isBroWin: boolean) {
    if (!this.isEnabled()) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    if (isBroWin) {
      // Victory fanfare
      const chord = [523.25, 659.25, 783.99, 1046.5];
      chord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const st = now + i * 0.08;

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, st);

        gain.gain.setValueAtTime(0, st);
        gain.gain.linearRampToValueAtTime(0.25, st + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, st + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(st);
        osc.stop(st + 0.6);
      });
    } else {
      // Fraud Escape / Bro defeat sting
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.4);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    }
  }

  /**
   * Sound effect for suspense heartbeat during dramatic voting reveal
   */
  playSuspenseHeartbeat() {
    if (!this.isEnabled()) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [0, 0.12].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const st = now + delay;

      osc.type = "sine";
      osc.frequency.setValueAtTime(i === 0 ? 90 : 70, st);
      osc.frequency.exponentialRampToValueAtTime(40, st + 0.1);

      gain.gain.setValueAtTime(0, st);
      gain.gain.linearRampToValueAtTime(0.35, st + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(st);
      osc.stop(st + 0.12);
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
export const playSuspenseHeartbeatSound = () => soundFx.playSuspenseHeartbeat();
