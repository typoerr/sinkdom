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
    // hook.remove完了前にnextNodeが来る可能性を考慮して,
    // doneが呼ばれるまでの間に来る最新のnextNodeを1つだけbufferとして確保する
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
        } else if /* patch text to text */ (
            currentChildren.length === 1
            && nextChildren.length === 1
            && isVTextNode(currentChildren[0])
            && isVTextNode(nextChildren[0])
        ) {
            const cur = currentChildren[0] as VTextNode
            const next = nextChildren[0] as VTextNode
            (cur.value !== next.value) && (cur.node!.nodeValue = next.value)
            cur.value = next.value
        } else /* patch element */ {
            isUpdating = true
            const queue: Promise<VNode>[] = []
            const reuseable: Hash<VNode> = {}
            // currentChildrenからkeyを持つものをreuseableに追加
            // それ以外のnodeはhookを叩いてqueueに追加
            for (let i = 0; i < currentChildren.length; i++) {
                const key = getKey(currentChildren[i])
                if (existy(key)) {
                    const vnode = currentChildren[i]
                    reuseable[key] = toReusedNode(vnode)
                } else {
                    queue.push(invokeNodeRemoveHook(currentChildren[i]))
                }
            }
            // nextChildren内でreuseableNodeと同じkeyを持つnodeが存在すれば
            // reuseableNodeに置き換える
            for (let i = 0; i < nextChildren.length; i++) {
                const key = getKey(nextChildren[i])
                if (existy(key) && reuseable[key]) {
                    nextChildren[i] = reuseable[key]
                    /* 置き換えられたreuseableNodeは削除する */
                    delete reuseable[key]
                }
            }
            // 使われなかったreuseableNodeを削除対象としてhookを叩く
            for (const key in reuseable) {
                queue.push(invokeNodeRemoveHook(reuseable[key]))
            }
            // remove hookの完了を待つ
            const removeable = await Promise.all(queue)
            // nodeの削除と後処理
            for (let i = 0; i < removeable.length; i++) {
                ctx.dispose(removeable[i])
                $parent.removeChild(removeable[i].node!)
            }
            // 新しいnodeの追加処理
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
            // 参照を更新
            host.children = children
            // buffer nodeを片付ける
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

