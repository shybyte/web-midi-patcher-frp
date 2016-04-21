import * as _ from 'lodash';
import {Observable, Subject, Subscription} from 'rxjs';
import MIDIMessageEvent = WebMidi.MIDIMessageEvent;


export interface StreamWithGroup<T> {
  group: string
  stream: Observable<T>
}

export function repeat<T>(array: T[], repetitions: number): T[] {
  return _.range(repetitions).reduce((acc, i) => acc.concat(array), [])
}

export function emulateObservable4<T>(ob: Observable<T>) {
  (ob as any)['doOnError'] = function () {
    return this;
  };
  return ob;
}

export function toNewObservable<T>(ob: Observable<T>): Observable<T> {
  const s = new Subject<T>();
  ob.subscribe(x => {
    s.next(x);
  });
  return s;
}

export function switchGrouped<T>(streamsWithGroup$: Observable<StreamWithGroup<T>>): Observable<T> {
  const activeStreams: {[group: string]: Subscription} = {};
  const result$ = new Subject<T>();
  streamsWithGroup$.subscribe(swg => {
    const activeStreamOfSameGroup = activeStreams[swg.group];
    if (activeStreamOfSameGroup) {
      activeStreamOfSameGroup.unsubscribe();
    }
    activeStreams[swg.group] = swg.stream.subscribe(x => {
      result$.next(x);
    })
  });
  return result$;
}

function logMidiMessage(mm: MIDIMessageEvent) {
  const dataString = mm.data.join(' ');
  const hexDataString = _.map(mm.data, (x: number) => '0x' + x.toString(16)).join(' ');
  console.log(mm,dataString, hexDataString);
}