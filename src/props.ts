import { Lifecycle } from './lifecycle'
import { EventMap } from './eventlistener'
import { Observable, PartialObservable } from './observable'

export interface Props {
    key?: string
    hook?: Lifecycle
    class?: string | Observable<string | null>
    className?: string | Observable<string | null>
    style?: PartialObservable<CSSStyleDeclaration>
    data?: PartialObservable<{ [k: string]: any }>
    on?: EventMap
    [k: string]: any
}
