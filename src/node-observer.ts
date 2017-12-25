import { existy, Hash } from '@cotto/utils.ts'
import { subscribe, unsubscribe, Observable } from './observable'
import {
    VNode,
    VSinkNode,
    VFragmentNode,
    isVTextNode,
    isVFragmentNode,
    hasSubscriptions,
    toVNode,
    getKey,
    toReusedNode,
    VTextNode,
} from './vnode'
import { invokeNodeRemoveHook } from './lifecycle'

export interface NodeObserverContext {
    activate: (vnode: VNode) => VNode,
    dispose: (vnode: VNode) => void,
    proxy: (observable: Observable<any>) => Observable<any>
}

export function observeNode(vnode: VSinkNode, _: any, context: NodeObserverContext) {
    const subscription = subscribe(context.proxy(vnode.source), createObserver(vnode, context))
    vnode.subscriptions.push(subscription)
}

export function unsubscribes(vnode: VNode) {
    if (hasSubscriptions(vnode)) {
        vnode.subscriptions.forEach(unsubscribe)
    }
}

export function createObserver(host: VSinkNode, ctx: NodeObserverContext) {
    /*
     * NextVNode is able to come before callback in the hook.remove is invoked.
     * In order to reduce unnecessary patch,
        * skip patch if updating
        * hold latest one as buffer
        * patch using bufferd vnode when hook.remove callback is invoked.
    */
    let buffer: VNode | null = null
    let isUpdating = false

    return patch

    async function patch(nextNode: VNode, forceUpdate = false) {
        nextNode = toVNode(nextNode)

        if (!forceUpdate && isUpdating) {
            buffer = nextNode
            return
        }

        const $placeholder = host.node as Comment
        const $parent = $placeholder.parentNode as Element
        const currentChildren = host.children
        const nextChildren = isVFragmentNode(nextNode) ? nextNode.children : [nextNode]

        if (currentChildren.length <= 0) {
            const next = ctx.activate(new VFragmentNode(nextChildren))
            $parent.insertBefore(next.node!, $placeholder.nextSibling)
            host.children = next.children
            isUpdating = false
        } else if (
            currentChildren.length === 1
            && nextChildren.length === 1
            && isVTextNode(currentChildren[0])
            && isVTextNode(nextChildren[0])
        ) {
            /* patch text to text */
            const cur = currentChildren[0] as VTextNode
            const next = nextChildren[0] as VTextNode
            cur.node!.nodeValue = next.value
            cur.value = next.value
        } else {
            /* patch element */
            isUpdating = true
            const queue: Promise<VNode>[] = []
            const reuseable: Hash<VNode> = {}
            // split reuseable vnode or removeable vnode
            for (let i = 0; i < currentChildren.length; i++) {
                const key = getKey(currentChildren[i])
                if (existy(key)) {
                    const vnode = currentChildren[i]
                    reuseable[key] = toReusedNode(vnode)
                } else {
                    queue.push(invokeNodeRemoveHook(currentChildren[i]))
                }
            }
            // replace child to reuseable vnode if props.key is same.
            for (let i = 0; i < nextChildren.length; i++) {
                const key = getKey(nextChildren[i])
                if (existy(key) && reuseable[key]) {
                    nextChildren[i] = reuseable[key]
                    delete reuseable[key]
                }
            }
            // remove unused reuseable vnode
            for (const key in reuseable) {
                queue.push(invokeNodeRemoveHook(reuseable[key]))
            }
            // await all hook.remove in removeable node
            const removeable = await Promise.all(queue)
            // patch per node
            for (let i = 0; i < removeable.length; i++) {
                ctx.dispose(removeable[i])
                $parent.removeChild(removeable[i].node!)
            }

            const offset = Array.from($parent.childNodes).indexOf($placeholder)
            const { children } = ctx.activate(new VFragmentNode(nextChildren))
            const $children = $parent.children
            for (let i = 0; i < children.length; i++) {
                const vnode = children[i]
                const node = $children[i + offset]
                if (vnode.node! !== node) {
                    $parent.insertBefore(vnode.node!, node)
                }
            }
            // update host
            host.children = children
            // clean bufflered node
            if (buffer !== null) {
                let _buffer = buffer
                buffer = null
                await patch(_buffer, true)
            } else {
                isUpdating = false
            }
        }
    }
}

