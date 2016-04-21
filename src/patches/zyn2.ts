import * as _ from 'lodash';
import {repeat} from '../utils'
import {NoteSequencer} from '../effects/note-sequencer'
import {Patch} from '../patch'
import {CUTOFF, MOD, OSC2_SEMITONE,CONTROL1, CONTROL2, NOISE_LEVEL} from '../instruments/microkorg';
import {SweepDown} from "../effects/sweep-down";


const AMAZON_SEQ = repeat(_.concat(
  repeat([45, 57], 1),
  repeat([48, 60], 1),
  repeat([43, 55], 1),
  repeat([38, 50], 1)
), 6).map(note => note + 0);


const patch: Patch = {
  name: 'ZynAmazon2',
  inputMidiName: 'VMPK',
  instrumentNumber: 1,
  effectByNote: {
    43: new SweepDown(CUTOFF, 30),
    45: new NoteSequencer(AMAZON_SEQ, 60 / 140 * 1000 / 2),
    57: new NoteSequencer([45], 1),
    36: new NoteSequencer([45, 47, 53, 57, 60, 67, 60, 57, 53, 47], 60 / 140 * 1000 / 2),
  }
};

export default patch;