import {Observable, Observer, Subject} from 'rxjs';

import MIDIAccess = WebMidi.MIDIAccess;
import MIDIInput = WebMidi.MIDIInput;
import MIDIOutput = WebMidi.MIDIOutput;
import MIDIConnectionEvent = WebMidi.MIDIConnectionEvent;
import MIDIMessageEvent = WebMidi.MIDIMessageEvent;


interface MidiPortChange {
  midiAccess: MIDIAccess;
  event?: MIDIConnectionEvent;
}

export interface MidiCommand {
  port: MIDIOutput;
  data: number[];
  delay?: number;
}

export interface MidiDriverAPI {
  portChange: Observable<MidiPortChange>
  midiMessage: Observable<MIDIMessageEvent>
}


export function createDriver(midiAccess: MIDIAccess) {
  const portChange$ = new Subject<MidiPortChange>();
  const midiMessage$ = new Subject<MIDIMessageEvent>();

  midiAccess.onstatechange = (event: MIDIConnectionEvent) => {
    console.log(event);
    portChange$.next({event, midiAccess});
  };

  portChange$.startWith({midiAccess}).subscribe(portChange => {
    midiAccess.inputs.forEach(function (entry) {
      entry.onmidimessage = event => {
        midiMessage$.next(event);
      };
    })
  });

  return (command$: Observable<MidiCommand[]>): MidiDriverAPI => {
    command$.subscribe(commands => {
      commands.forEach(command => {
        command.port.send(command.data, window.performance.now() + (command.delay || 0));
      });
    });
    return {
      portChange: portChange$.startWith({midiAccess}),
      midiMessage: midiMessage$
    };
  };
}