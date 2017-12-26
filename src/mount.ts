import { not, identity } from '@cotto/utils.ts'
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
    toVNode,
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
import { attach, proxy, createTreeWalker, queue, defer, invokeCallback } from './utils'
import { setElementProps, PropsObserverContext } from './props-observer'
import { observeNode, unsubscribes, NodeObserverContext } from './node-observer'
import { Options } from './options'
import { hookInvoker as globalHookInvoker } from './hook'

type Parent = VNode | null
type Context = NodeObserverContext & PropsObserverContext

const isNotReusedNode = not(isReusedNode)

export function mount(tree: VNode, container: HTMLElement = document.body, options: Options = {}) {
    tree = toVNode(tree)
    const callbacks = queue(defer as any)

    const activate = createTreeWalker<VNode, Context>(
        proxy<VNode, Parent, NodeObserverContext>(isNotReusedNode,
            proxy<VElementNode, Parent, PropsObserverContext>(isVElementNode, attach('node', createElementNode), setElementProps),
            proxy<VSinkNode, Parent>(isVSinkNode, attach('node', createPlaceholder)),
            proxy<VTextNode, Parent>(isVTextNode, attach('node', createTextNode)),
            proxy<VCommentNode, Parent>(isVCommentNode, attach('node', createComment)),
            proxy<VFragmentNode, Parent>(isVFragmentNode, attach('node', createFrangment)),
            appendChild,
            proxy<VSinkNode, Parent, NodeObserverContext>(isVSinkNode, observeNode),
            vnode => invokeNodeHook('create', vnode),
            globalHookInvoker('create', options.hook || []),
            proxy(hasHook('insert'), vnode => callbacks.enqueue(() => invokeNodeHook('insert', vnode))),
        ),
    )

    const dispose = createTreeWalker(
        unsubscribes,
        vnode => invokeNodeHook('drop', vnode),
        globalHookInvoker('drop', options.hook || []),
    )

    const context: Context = {
        activate: (vnode: VNode) => activate(vnode, null, context, isNotReusedNode),
        dispose: (vnode: VNode) => callbacks.enqueue(() => dispose(vnode, null, context)),
        proxy: options.proxy || identity,
    }

    const mo = new MutationObserver(callbacks.process.bind(null, undefined))
    const config = { childList: true, subtree: true }

    mo.observe(container, config)
    tree = activate(tree, null, context)
    container.appendChild(tree.node!)

    return function unmount() {
        const hook = tree.props.hook || {}
        const onremove = hook.remove || invokeCallback
        onremove(tree.node as HTMLElement, tree, () => {
            container.removeChild(tree.node!)
            dispose(tree, null, context)
            mo.disconnect()
        })
    }
}