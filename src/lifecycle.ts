import { isFunction } from '@cotto/utils.ts'
import { VElementNode } from './vnode'

export interface Lifecycle<T extends HTMLElement = HTMLElement> {
    create?(el: T, vnode: VElementNode): void
    insert?(el: T, vnode: VElementNode): void
    // TODO: update?(el: T, vnode: VElementNode): void
    remove?(el: T, vnode: VElementNode): void | ((done: Function) => void)
    drop?(el: T, vnode: VElementNode): void
}

export function invokeNodeHook<K extends keyof Lifecycle>(key: K, vnode: VElementNode, done?: Function) {
    let callback: Function
    const hook = vnode.props.hook && vnode.props.hook[key]
    if (isFunction(hook) && isFunction(callback = hook(vnode.node!, vnode))) {
        callback(done)
    } else if (typeof done === 'function') {
        done()
    }
}

export function hasHook<K extends keyof Lifecycle>(key: K) {
    return (vnode: VElementNode) => {
        const hook = vnode.props.hook
        return hook != undefined && typeof hook[key] === 'function'
    }
}
