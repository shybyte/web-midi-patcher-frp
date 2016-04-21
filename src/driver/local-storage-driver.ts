import {Observable, Observer} from 'rxjs';

export interface LocalStorageDriverAPI {
  getItem(key: string, defaultValue?: string): Observable<string>;
}

export interface SetItemCommand {
  key: string;
  value: string;
}


export function localStorageDriver(command$: Observable<SetItemCommand>): LocalStorageDriverAPI {
  command$.subscribe(({key, value}) => {
    localStorage.setItem(key, value);
  });
  return {
    getItem(key, defaultValue?) {
      return Observable.create((observer: Observer<string>) => {
        const value = localStorage.getItem(key);
        const valueOrDefault = value !== null ? value: defaultValue;
        observer.next(valueOrDefault );
      });
    }
  };
}
