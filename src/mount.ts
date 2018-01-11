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
    createMarkerComment,
    createFrangment,
    createPlaceholder,
} from './dom'
import { invokeNodeHook, hasHook } from './lifecycle'
import { attach, proxy, createTreeWalker, queue, defer } from './utils'
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
        proxy<VNode, Parent, Context>(isNotReusedNode,
            proxy<VElementNode, Parent, Context>(isVElementNode, attach('node', createElementNode), setElementProps),
            proxy<VSinkNode, Parent, Context>(isVSinkNode, attach('node', createPlaceholder)),
            proxy<VTextNode, Parent, Context>(isVTextNode, attach('node', createTextNode)),
            proxy<VCommentNode, Parent, Context>(isVCommentNode, attach('node', createMarkerComment)),
            proxy<VFragmentNode, Parent, Context>(isVFragmentNode, attach('node', createFrangment)),
            appendChild,
            proxy<VSinkNode, Parent, Context>(isVSinkNode, observeNode),
            vnode => invokeNodeHook('create', vnode as VElementNode),
            globalHookInvoker('create', options.hook || []),
            proxy(hasHook('insert'), vnode => callbacks.enqueue(() => invokeNodeHook('insert', vnode))),
        ),
    )

    const dispose = createTreeWalker(
        unsubscribes,
        vnode => invokeNodeHook('drop', vnode as VElementNode),
        globalHookInvoker('drop', options.hook || []),
        vnode => vnode.node = undefined,
    )

    const context: Context = {
        activate: (vnode: VNode) => activate(vnode, null, context, isNotReusedNode),
        dispose: (vnode: VNode) => callbacks.enqueue(() => dispose(vnode, null, context)),
        proxy: options.proxy || identity,
    }

    const ps = callbacks.process.bind(null, undefined)
    const mo = new MutationObserver(ps)
    mo.observe(container, { childList: true, subtree: true })

    tree = activate(tree, null, context)
    container.appendChild(tree.node!)

    return function unmount() {
        return invokeNodeHook('remove', tree as VElementNode, () => {
            container.removeChild(tree.node!)
            dispose(tree, null, context)
            defer(mo.disconnect.bind(mo))
        })
    }
}