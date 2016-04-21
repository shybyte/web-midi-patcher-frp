import {MidiCommand} from "./driver/midi-driver";
import {Observable, Subject} from 'rxjs';


export interface Effect {
  monoGroup: string,
  trigger(velocity: number, output: WebMidi.MIDIOutput) : Observable<MidiCommand[]>;
}

