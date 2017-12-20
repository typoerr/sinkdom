import { existy, noop } from '@cotto/utils.ts'

export interface Observable<T> {
    subscribe(subscriber: Subscriber<T>): Subscription
}

export type PartialObservable<T> = {
    [K in keyof T]?: T[K] | Observable<T[K]>
}

export interface Subscriber<T> {
    next(value: T): void
    error(err: any): void
    complete(): void
}

export interface Subscription {
    unsubscribe: Function
}

export interface Subject<T> extends Observable<T> {
    next(value: T): void
}

export function isObs<T extends Observable<any>>(x: T | any): x is T {
    return existy(x) && (typeof x.subscribe === 'function')
}

export function isSubject<T extends Subject<any>>(x: T | any): x is T {
    return existy(x) && (typeof x.next === 'function')
}

export function subscribe<T>(obs: Observable<T>, next: ((x: T) => void) | Subscriber<T>): Subscription {
    next = typeof next === 'function'
        ? { next, error: console.error, complete: noop }
        : next

    return obs.subscribe(next)
}

export function unsubscribe(subscription: Subscription) {
    return subscription.unsubscribe()
}