import { isSubject, Subject } from './observable'

export type Listener<T, K extends keyof T> = ((event: T[K]) => void) | Subject<T[K]>

export type EventMap = {[K in keyof HTMLElementEventMap]?: Listener<HTMLElementEventMap, K> }
    & { [k: string]: Listener<{ [k: string]: Event }, any> }

const _cache = new WeakMap<object, Function>()

export function getCachedEventListener(subject: Subject<Event>, cache = _cache) {
    let listener = cache.get(subject)
    if (typeof listener !== 'function') {
        listener = (ev: Event) => subject.next(ev)
        cache.set(subject, listener)
    }
    return listener
}

export function setEventListeners(el: HTMLElement, eventmap: EventMap) {
    for (const event in eventmap) {
        let listener: any = eventmap[event]
        listener = isSubject(listener) ? getCachedEventListener(listener) : listener
        el.addEventListener(event, listener)
    }
}

