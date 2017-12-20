import { VNode } from './vnode'

export interface Lifecycle<T extends HTMLElement = HTMLElement, U extends VNode = VNode> {
    create?(el: T, vnode: U): void
    insert?(el: T, vnode: U): void
    remove?(el: T, vnode: U, done: Function): void
    drop?(el: T, vnode: U): void
}

export function invokeNodeHook<K extends keyof Lifecycle>(key: K, vnode: VNode, done?: Function) {
    const hook = vnode.props.hook && vnode.props.hook[key]
    if (typeof hook === 'function') {
        hook(vnode.node!, vnode, done)
    }
}

export async function invokeNodeRemoveHook(vnode: VNode): Promise<VNode> {
    const hook = vnode.props.hook || {}
    const onremove = hook.remove
    const el = vnode.node as HTMLElement
    if (typeof onremove === 'function') {
        await new Promise(resolve => onremove(el, vnode, resolve))
    }
    return vnode
}

export function hasHook<K extends keyof Lifecycle>(key: K) {
    return (vnode: VNode) => {
        const hook = vnode.props.hook
        return !!hook && typeof hook[key] === 'function'
    }
}
