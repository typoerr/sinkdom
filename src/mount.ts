import {
    VNode,
    VElementNode,
    VSinkNode,
    VTextNode,
    VCommentNode,
    VFragmentNode,
    isVElementNode,
    isVSinkNode,
    isVTextNode,
    isVCommentNode,
    isVFragmentNode,
    isReusedNode,
} from './vnode'
import {
    appendChild,
    createElementNode,
    createTextNode,
    createComment,
    createFrangment,
    createPlaceholder,
} from './dom'
import { invokeNodeHook, hasHook } from './lifecycle'
import { attach, proxy, createTreeWalker, queue, defer } from './utils'
import setElementProps from './props-observer'
import { observeNode, unsubscribes, Context } from './node-observer'
import { not } from '@cotto/utils.ts'


type Parent = VNode | null

const isNotReusedNode = not(isReusedNode)

// TODO: global hook
// TODO: option
export function mount(tree: VNode, container: HTMLElement = document.body) {
    const callbacks = queue(defer as any)

    const activate = createTreeWalker<VNode, Context>(
        proxy<VNode, Parent, Context>(isNotReusedNode,
            proxy<VElementNode, Parent>(isVElementNode, attach('node', createElementNode), setElementProps),
            proxy<VSinkNode, Parent>(isVSinkNode, attach('node', createPlaceholder)),
            proxy<VTextNode, Parent>(isVTextNode, attach('node', createTextNode)),
            proxy<VCommentNode, Parent>(isVCommentNode, attach('node', createComment)),
            proxy<VFragmentNode, Parent>(isVFragmentNode, attach('node', createFrangment)),
            appendChild,
            proxy<VSinkNode, Parent, Context>(isVSinkNode, observeNode),
            vnode => invokeNodeHook('create', vnode),
            proxy(hasHook('insert'), vnode => callbacks.enqueue(() => invokeNodeHook('insert', vnode))),
        ),
    )

    const dispose = createTreeWalker(
        unsubscribes,
        vnode => invokeNodeHook('drop', vnode),
        (vnode: any) => delete vnode.subscriptions, // ?
        vnode => delete vnode.node, // ?
    )

    const context: Context = {
        activate: (vnode: VNode) => activate(vnode, null, context, isNotReusedNode),
        dispose: (vnode: VNode) => callbacks.enqueue(() => dispose(vnode, null, context)),
    }

    const mo = new MutationObserver(callbacks.process)
    const config = { childList: true, subtree: true }

    mo.observe(container, config)
    tree = activate(tree, null, context)
    container.appendChild(tree.node!)

    return function unmount() {
        container.removeChild(tree.node!)
        mo.disconnect()
        dispose(tree, null, context)
    }
}