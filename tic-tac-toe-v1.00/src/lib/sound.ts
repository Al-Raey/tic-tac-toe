let context: AudioContext | null = null;
export type SoundEvent = 'move' | 'win' | 'draw' | 'click';
export function playSound(event: SoundEvent): boolean {
  try {
    const AudioContextConstructor = window.AudioContext;
    if (!AudioContextConstructor) return false;
    context ??= new AudioContextConstructor();
    if (context.state === 'suspended') void context.resume();
    const now = context.currentTime;
    const notes: Record<SoundEvent, { frequency: number; duration: number; type: OscillatorType; gain: number }[]> = {
      move: [{ frequency: 480, duration: 0.07, type: 'sine', gain: 0.035 }],
      click: [{ frequency: 320, duration: 0.04, type: 'sine', gain: 0.018 }],
      draw: [{ frequency: 260, duration: 0.13, type: 'triangle', gain: 0.025 }, { frequency: 220, duration: 0.18, type: 'triangle', gain: 0.022 }],
      win: [{ frequency: 440, duration: 0.09, type: 'sine', gain: 0.03 }, { frequency: 554, duration: 0.12, type: 'sine', gain: 0.03 }, { frequency: 659, duration: 0.2, type: 'sine', gain: 0.03 }],
    };
    notes[event].forEach((note, index) => {
      const oscillator = context!.createOscillator();
      const gain = context!.createGain();
      const start = now + index * 0.085;
      oscillator.type = note.type;
      oscillator.frequency.setValueAtTime(note.frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(note.gain, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + note.duration);
      oscillator.connect(gain); gain.connect(context!.destination);
      oscillator.start(start); oscillator.stop(start + note.duration + 0.02);
    });
    return true;
  } catch { return false; }
}
