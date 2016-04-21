import {Observable, Subject} from 'rxjs';

import {Effect} from '../effect'
import {MidiCommand} from "../driver/midi-driver";

export class SweepDown implements Effect {
  monoGroup: string
  speed = 0.1;

  constructor(public controlIndex: number, public minValue: number, public startValue: number = 127) {
    this.monoGroup = controlIndex.toString();
  }

  trigger(velocity: number, port: WebMidi.MIDIOutput) {
    const startTime = window.performance.now();
    const timer$ = Observable.timer(0, 10);
    const value$ = timer$.map(() => {
      return Math.min(127, Math.max(this.minValue, this.startValue - (window.performance.now() - startTime) * this.speed));
    });
    return value$.takeWhile(value => value > this.minValue).map(value => [
      {port, data: [0xB0, this.controlIndex, value]},
    ]);
  }
}
