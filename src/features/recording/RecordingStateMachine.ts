import { RecordingState } from '../../types';

export class RecordingStateMachine {
  private currentState: RecordingState = 'IDLE';
  private listeners: ((state: RecordingState) => void)[] = [];

  constructor(initialState: RecordingState = 'IDLE') {
    this.currentState = initialState;
  }

  public getState(): RecordingState {
    return this.currentState;
  }

  public canTransitionTo(nextState: RecordingState): boolean {
    switch (this.currentState) {
      case 'IDLE':
        return nextState === 'PREPARING' || nextState === 'COUNTDOWN';
      case 'PREPARING':
        return nextState === 'COUNTDOWN' || nextState === 'IDLE';
      case 'COUNTDOWN':
        return nextState === 'RECORDING' || nextState === 'IDLE';
      case 'RECORDING':
        return nextState === 'PAUSED' || nextState === 'FINALIZING' || nextState === 'FAILED';
      case 'PAUSED':
        return nextState === 'RESUMING' || nextState === 'FINALIZING' || nextState === 'FAILED';
      case 'RESUMING':
        return nextState === 'RECORDING' || nextState === 'PAUSED';
      case 'FINALIZING':
        return nextState === 'COMPLETED' || nextState === 'FAILED';
      case 'COMPLETED':
      case 'FAILED':
        return nextState === 'IDLE' || nextState === 'PREPARING';
      default:
        return false;
    }
  }

  public reset() {
    this.currentState = 'IDLE';
    this.notify();
  }

  public transition(nextState: RecordingState): boolean {
    if (!this.canTransitionTo(nextState)) {
      console.warn(`[RecordingStateMachine] Invalid transition: ${this.currentState} -> ${nextState}`);
      return false;
    }
    this.currentState = nextState;
    this.notify();
    return true;
  }

  public subscribe(listener: (state: RecordingState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.currentState);
    }
  }
}
