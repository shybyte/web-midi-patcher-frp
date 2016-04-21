declare module WebMidi {

  export interface MIDIMessageEvent extends Event {
    target: MIDIPort;
  }

  export interface MIDIConnectionEvent extends Event {
    target: MIDIAccess;
  }

  export interface MIDIInput extends MIDIPort{
  }

  export interface MIDIOutput extends MIDIPort{
    send(data: Array<number>, timestamp?: number): void;
  }

  export interface MIDIAccess {
    onstatechange: (ev: MIDIConnectionEvent) => void;
  }

  export interface MIDIInputMap {
    forEach(callbackfn: (value: MIDIInput, index: number, array: MIDIInput[]) => void, thisArg?: any): void;
  }
  export interface MIDIOutputMap {
    forEach(callbackfn: (value: MIDIOutput, index: number, array: MIDIOutput[]) => void, thisArg?: any): void;
  }
}