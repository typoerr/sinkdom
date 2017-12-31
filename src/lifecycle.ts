import { VElementNode } from './vnode'

export interface Lifecycle<T extends HTMLElement = HTMLElement> {
    create?(el: T, vnode: VElementNode): void
    insert?(el: T, vnode: VElementNode): void
    remove?(el: T, vnode: VElementNode, done: Function): void
    drop?(el: T, vnode: VElementNode): void
}

export function invokeNodeHook<K extends keyof Lifecycle>(key: K, vnode: VElementNode, done?: Function) {
    const hook = vnode.props.hook && vnode.props.hook[key]
    if (typeof hook === 'function') {
        hook(vnode.node!, vnode, done)
    }
}

export async function invokeNodeRemoveHook(vnode: VElementNode): Promise<VElementNode> {
    const hook = vnode.props.hook || {}
    const onremove = hook.remove
    const el = vnode.node as HTMLElement
    if (typeof onremove === 'function') {
        await new Promise(resolve => onremove(el, vnode, resolve))
    }
    return vnode
}

export function hasHook<K extends keyof Lifecycle>(key: K) {
    return (vnode: VElementNode) => {
        const hook = vnode.props.hook
        return hook != undefined && typeof hook[key] === 'function'
    }
}
