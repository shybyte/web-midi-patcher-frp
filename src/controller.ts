import * as _ from 'lodash';
import {Observable} from 'rxjs';
import * as Cycle from '@cycle/core';
import {div, makeDOMDriver, button} from '@cycle/dom';

import {emulateObservable4, toNewObservable, switchGrouped} from './utils';
import {createDriver, MidiCommand, MidiDriverAPI} from "./driver/midi-driver";
import {localStorageDriver, LocalStorageDriverAPI} from './driver/local-storage-driver';
import {AppViewState} from './app-view-state';

import {Patch} from './patch';
import zynPatch from './patches/zyn';
import zynPatch2 from './patches/zyn2';

import MIDIAccess = WebMidi.MIDIAccess;
import MIDIInput = WebMidi.MIDIInput;
import MIDIOutput = WebMidi.MIDIOutput;
import MIDIMessageEvent = WebMidi.MIDIMessageEvent;


export function startController(midiAccess: MIDIAccess) {
  // const OUTPUT_MIDI_NAME = 'USB MIDI';
  const OUTPUT_MIDI_NAME = 'Midi Through';
  // const PATCH_CHANGE_DEVICE_NAME = 'USB MIDI';
  const PATCH_CHANGE_DEVICE_NAME = 'VMPK';

  const PROGRAM_CHANGE = 192;
  const CURRENT_PATCH_STORAGE_KEY = 'currentPatch';

  const patches = [zynPatch, zynPatch2];
  const midiDriver = createDriver(midiAccess);
  const START_VIEW_STATE = {currentPatch: patches[0]};

  
  function main(sources: any) {
    const midi: MidiDriverAPI = sources.Midi;
    const storage: LocalStorageDriverAPI = sources.Storage;

    const patchNameFromStorage$ = storage.getItem(CURRENT_PATCH_STORAGE_KEY, patches[0].name);
    const clickEvent$ = toNewObservable<Event>(sources.DOM.select('button').events('click') as any);
    const clickedPatchName$ = clickEvent$.map(ev => (ev.target as HTMLButtonElement).dataset['name']);
    const selectedPatch$ = patchNameFromStorage$.merge(clickedPatchName$).map(name => _.find(patches, {name}));
    //const selectedPatch$ = clickedPatchName$.map(name => _.find(patches, {name}));

    const midiSelectedPatch$ = midi.midiMessage
      .filter(mm => _.includes(mm.target.name, PATCH_CHANGE_DEVICE_NAME) && mm.data[0] == PROGRAM_CHANGE)
      .map(mm => _.find(patches, {instrumentNumber: mm.data[1]}))
      .filter(_.isObject);

    const viewState$ = selectedPatch$.merge(midiSelectedPatch$).scan((viewState: AppViewState, selectedPatch: Patch) => {
      const vs = _.clone(viewState);
      vs.currentPatch = selectedPatch;
      return vs;
    }, START_VIEW_STATE);

    const output$ = midi.portChange.map(({midiAccess}) => {
      console.log('MIDI Access Object', midiAccess);
      midiAccess.inputs.forEach(input => {
        console.log("Input port [type:'" + input.type + "'] id:'" + input.id +
          "' manufacturer:'" + input.manufacture + "' name:'" + input.name +
          "' version:'" + input.version + "'");
      });
      midiAccess.outputs.forEach(output1 => {
        console.log("Output port [type:'" + output1.type + "'] id:'" + output1.id +
          "' manufacturer:'" + output1.manufacture + "' name:'" + output1.name +
          "' version:'" + output1.version + "'");
      });
      const outputValues = midiAccess.outputs.values();
      return Array.from(outputValues as any).find((output: MIDIOutput) => _.includes(output.name, OUTPUT_MIDI_NAME)) as MIDIOutput;
    });

    const effectStream$ = midi.midiMessage
      .combineLatest(viewState$, output$, (midiMessage, viewState, output) => ({
        midiMessage, viewState, output
      }))
      .filter(({midiMessage, viewState}) => (
        _.includes(midiMessage.target.name, viewState.currentPatch.inputMidiName)
        && (midiMessage.data[0] & 0xf0) === 0x90 && midiMessage.data[2] > 0
      ))
      .map(({midiMessage, viewState, output}) => {
        const effect = viewState.currentPatch.effectByNote[midiMessage.data[1]];
        return effect ? {
          stream: effect.trigger(midiMessage.data[2], output),
          group: effect.monoGroup
        } : null;
      })
      .filter(_.isObject);

    const midiCommand$: Observable<MidiCommand[]> = switchGrouped(effectStream$);

    const dom = viewState$
      .map((viewState: AppViewState) =>
        div(patches.map(patch =>
          button({
              'className': viewState.currentPatch === patch ? 'selected' : '',
              attributes: {
                'data-name': patch.name
              }
            },
            patch.name
          )
        ))
      );

    return {
      Storage: emulateObservable4(viewState$.map(
        ({currentPatch}) => ({key: CURRENT_PATCH_STORAGE_KEY, value: currentPatch.name}))
      ),
      Midi: emulateObservable4(midiCommand$),
      DOM: emulateObservable4(dom)
    };
  }

  Cycle.run(main, {
    Midi: midiDriver,
    Storage: localStorageDriver,
    DOM: makeDOMDriver('#app')
  });
}