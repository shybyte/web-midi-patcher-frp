import {Observable, Subject} from 'rxjs';

import {Effect} from '../effect'
import {MidiCommand} from "../midi-driver";


export class NoteSequencer implements Effect {
  monoGroup = 'note';

  constructor(public sequence: number[], public timePerNote: number) {
  }

  trigger(velocity: number, port: WebMidi.MIDIOutput) {
    const timer$ = Observable.timer(0, this.timePerNote);
    return timer$.map(i => [
      {port, data: [0x90, this.sequence[i], 0x7f]},
      {port, data: [0x80, this.sequence[i], 0x40], delay: 100.0}
    ]).take(this.sequence.length);
  }


}
