import { isSubject, Subject } from './observable'

export type EventListener<T, K extends keyof T> = (Subject<T[K]>) | ((event: T[K]) => void)

export type EventMap =
    | {[K in keyof HTMLElementEventMap]?: EventListener<HTMLElementEventMap, K> }
    | {[K in keyof SVGElementEventMap]?: EventListener<SVGElementEventMap, K> }
    | { [k: string]: EventListener<{ [k: string]: Event }, any> }

export interface EventListenerEnhancer {
    (listener: (event: Event) => any): (event: Event) => any
}

const _cache = new WeakMap<object, Function>()

export function getCachedEventListener(target: EventListener<any, any>, enhancer: EventListenerEnhancer, cache = _cache) {
    let listener = cache.get(target)
    if (typeof listener !== 'function') {
        const fn = isSubject(target) ? target.next.bind(target) : target
        listener = enhancer(fn)
        cache.set(target, listener)
    }
    return listener
}

export function setEventListeners(el: Element, eventmap: EventMap, enhancer: EventListenerEnhancer) {
    for (const event in eventmap) {
        let listener: any = (eventmap as any)[event]
        listener = getCachedEventListener(listener, enhancer)
        el.addEventListener(event, listener)
    }
}
