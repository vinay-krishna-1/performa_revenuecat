import * as Speech from 'expo-speech';

export class VoiceCoachService {
  private static instance: VoiceCoachService;
  private isSpeaking: boolean = false;
  private enabled: boolean = true;

  public static getInstance(): VoiceCoachService {
    if (!VoiceCoachService.instance) {
      VoiceCoachService.instance = new VoiceCoachService();
    }
    return VoiceCoachService.instance;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Speaks athletic guidance via native offline TTS without blocking audio playback.
   */
  public async speak(text: string) {
    if (!this.enabled) return;

    try {
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) {
        await Speech.stop();
      }

      Speech.speak(text, {
        language: 'en-US',
        pitch: 1.05,
        rate: 1.0,
      });
    } catch (e) {
      console.warn('[VoiceCoach] Speech error:', e);
    }
  }

  /**
   * Spoken split cue: "Kilometer 3: 5 minutes, 14 seconds"
   */
  public announceSplit(splitNumber: number, durationSeconds: number) {
    const mins = Math.floor(durationSeconds / 60);
    const secs = durationSeconds % 60;
    const text = `Kilometer ${splitNumber}. ${mins} minute${mins !== 1 ? 's' : ''}, ${secs} second${secs !== 1 ? 's' : ''}.`;
    this.speak(text);
  }

  /**
   * Spoken ghost status: "You are 14 seconds ahead of Arjun."
   */
  public announceGhostDelta(deltaSeconds: number, opponentName: string = 'your opponent') {
    const abs = Math.abs(deltaSeconds);
    if (abs < 3) {
      this.speak(`Neck and neck with ${opponentName}.`);
    } else if (deltaSeconds > 0) {
      this.speak(`${abs} seconds ahead of ${opponentName}.`);
    } else {
      this.speak(`${abs} seconds behind ${opponentName}. Pick up the cadence.`);
    }
  }
}
