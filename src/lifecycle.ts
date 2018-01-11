import { VElementNode } from './vnode'

export interface Lifecycle<T extends HTMLElement = HTMLElement> {
    create?(el: T, vnode: VElementNode): void
    insert?(el: T, vnode: VElementNode): void
    // TODO: update?(el: T, vnode: VElementNode): void
    remove?(el: T, vnode: VElementNode, done: Function): void
    // TODO: remove?(el: T, vnode: VElementNode): (done: Function) => void
    drop?(el: T, vnode: VElementNode): void
}

export function invokeNodeHook<K extends keyof Lifecycle>(key: K, vnode: VElementNode, done?: Function) {
    const hook = vnode.props.hook && vnode.props.hook[key]
    if (typeof hook === 'function') {
        hook(vnode.node!, vnode, done)
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
