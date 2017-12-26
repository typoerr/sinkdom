import { Observable } from './observable'
import { Hook } from './hook'

export interface Options {
    hook?: Hook[]
    proxy?(observable: Observable<any>): Observable<any>
}
