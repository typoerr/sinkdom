import { isFunction } from '@cotto/utils.ts'
import { VNode } from './vnode'

export interface Lifecycle<T extends Element = Element, U extends VNode = VNode> {
    create?(el: T, vnode: U): void
    insert?(el: T, vnode: U): void
    // TODO: update?(el: T, vnode: VElementNode): void
    remove?(el: T, vnode: U): void | ((done: Function) => void)
    drop?(el: T, vnode: U): void
}

export function invokeNodeHook<K extends keyof Lifecycle>(key: K, vnode: VNode, done?: Function) {
    let callback: Function
    const hook = vnode.props.hook && vnode.props.hook[key]
    if (isFunction(hook) && isFunction(callback = hook(vnode.node!, vnode))) {
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
