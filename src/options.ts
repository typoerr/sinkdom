import { Observable } from './observable'

export interface Options {
    proxy?(observable: Observable<any>): Observable<any>
}

