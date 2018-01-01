import { Hash } from '@cotto/utils.ts'
import { subscribe, Observable, Subscription } from './observable'
import {
    VNode,
    VSinkNode,
    VFragmentNode,
    VTextNode,
    VElementNode,
    isVTextNode,
    isVFragmentNode,
    hasSubscriptions,
    toVNode,
    toReusedNode,
    getKey,
} from './vnode'
import { invokeNodeRemoveHook } from './lifecycle'

export interface NodeObserverContext {
    activate: (vnode: VNode) => VNode,
    dispose: (vnode: VNode) => void,
    proxy: (observable: Observable<any>) => Observable<any>
}

export function observeNode(vnode: VSinkNode, _: any, context: NodeObserverContext) {
    vnode.subscriptions.push(subscribe(
        context.proxy(vnode.source),
        observe(vnode, context),
    ))
}

export function unsubscribes(vnode: VNode) {
    let s: Subscription
    if (hasSubscriptions(vnode)) {
        const { subscriptions } = vnode
        // tslint:disable:no-conditional-assignment
        while (s = subscriptions.shift()!) {
            s.unsubscribe()
        }
        // tslint:enabel:no-conditional-assignment
    }
}

export function observe(host: VSinkNode, ctx: NodeObserverContext) {
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
                const vnode = currentChildren[i]
                const key = getKey(vnode)
                if (key != undefined) {
                    reuseable[key] = toReusedNode(vnode)
                } else {
                    queue.push(invokeNodeRemoveHook(vnode as VElementNode))
                }
            }
            // replace child to reuseable vnode if props.key is same.
            for (let i = 0; i < nextChildren.length; i++) {
                const key = getKey(nextChildren[i])
                if (reuseable[key!]) {
                    nextChildren[i] = reuseable[key!]
                    delete reuseable[key!]
                }
            }
            // remove unused reuseable vnode
            for (const key in reuseable) {
                queue.push(invokeNodeRemoveHook(reuseable[key] as VElementNode))
            }
            // await all hook.remove in removeable node
            const removeable = await Promise.all(queue)
            /*
             * domを更新する前にbufferの存在を確認
             * 存在すれば処理をdom patchを切り上げてbufferを処理したほうが速くなるか？
             *
            */
            // patch per node
            for (let i = 0; i < removeable.length; i++) {
                ctx.dispose(removeable[i])
                $parent.removeChild(removeable[i].node!)
            }

            const offset = Array.prototype.indexOf.call($parent.childNodes, $placeholder)
            // const { children } = ctx.activate(new VFakeNode(nextChildren.map(toVNode)))
            const children = nextChildren.map(ctx.activate)
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
                patch(_buffer, true)
            } else {
                isUpdating = false
            }
        }
    }
}

