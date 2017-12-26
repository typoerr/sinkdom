import { isFunction } from '@cotto/utils.ts'
import { VNode } from './vnode'

export interface Hook<T extends HTMLElement = HTMLElement, U extends VNode = VNode> {
    create?(el: T, vnode: U): void
    drop?(el: T, vnode: U): void
}

export function hookInvoker<K extends keyof Hook>(key: K, hooks: Hook[]) {
    const funcs = hooks.map(h => h[key]).filter(isFunction)
    return (vnode: VNode) => {
        for (let i = 0; i < funcs.length; i++) {
            funcs[i]!(vnode.node as HTMLElement, vnode)
        }
    }
}
