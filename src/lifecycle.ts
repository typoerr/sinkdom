import { isFunction } from '@cotto/utils.ts'
import { VNode } from './vnode'

export interface Lifecycle<T extends Element = Element> {
    create?(el: T): void
    insert?(el: T): void
    // TODO: update?(el: T): void
    remove?(el: T): void | ((done: Function) => void)
    drop?(el: T): void
}

export function invokeNodeHook<K extends keyof Lifecycle>(key: K, vnode: VNode, done?: Function) {
    let callback: Function
    const hook = vnode.props.hook && vnode.props.hook[key]
    if (isFunction(hook) && isFunction(callback = hook(vnode.node!))) {
        callback(done)
    } else if (typeof done === 'function') {
        done()
    }
}

export function hasHook<K extends keyof Lifecycle>(key: K) {
    return (vnode: VNode) => {
        const hook = vnode.props.hook
        return hook != undefined && typeof hook[key] === 'function'
    }
}
