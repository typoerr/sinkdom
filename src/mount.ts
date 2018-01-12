import { not, identity, bundle } from '@cotto/utils.ts'
import {
    VNode,
    VElementNode,
    VSinkNode,
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
import { attach, proxy, createTreeWalker, queue, defer, cond } from './utils'
import { setElementProps, PropsObserverContext } from './props-observer'
import { observeNode, unsubscribes, NodeObserverContext } from './node-observer'
import { Hook, hookInvoker as globalHookInvoker } from './hook'
import { Observable } from './observable'

type Parent = VNode | null
type Context = NodeObserverContext & PropsObserverContext

export interface MountOptions {
    hook?: Hook[]
    proxy?(observable: Observable<any>): Observable<any>
}

const isNotReusedNode = not(isReusedNode)

const attachElement = attach('node', createElementNode)
const attachPlaceholder = attach<VNode, 'node'>('node', createPlaceholder)
const attachTextNode = attach('node', createTextNode)
const attachFragment = attach<VFragmentNode, 'node'>('node', createFrangment)
const attachComment = attach<VCommentNode, 'node'>('node', createMarkerComment)

const whenNotReuseableNode = proxy<VNode, Parent, Context>(isNotReusedNode)
const whenVElementNode = proxy<VElementNode, Parent, Context>(isVElementNode)
const whenVSinkNode = proxy<VSinkNode, Parent, Context>(isVSinkNode)
const whenHasInsertHook = proxy<VElementNode, Parent, Context>(hasHook('insert'))

const enqueueInsertHook = (callbacks: { enqueue: Function }) => {
    return (vnode: VNode) => callbacks.enqueue(invokeNodeHook.bind(null, 'insert', vnode))
}

export function mount(tree: VNode, container: HTMLElement = document.body, options: MountOptions = {}) {
    tree = toVNode(tree)

    const callbacks = queue(defer as any)

    const activate = createTreeWalker<VNode, Context>(
        whenNotReuseableNode(
            cond(
                cond.when(isVElementNode, bundle(attachElement, setElementProps)),
                cond.when(isVSinkNode, attachPlaceholder),
                cond.when(isVTextNode, attachTextNode),
                cond.when(isVFragmentNode, attachFragment),
                cond.when(isVCommentNode, attachComment),
            ),
            appendChild,
            whenVSinkNode(observeNode),
            whenVElementNode(invokeNodeHook.bind(null, 'create')),
            globalHookInvoker('create', options.hook || []),
            whenHasInsertHook(enqueueInsertHook(callbacks)),
        ),
    )

    const dispose = createTreeWalker(
        unsubscribes,
        invokeNodeHook.bind(null, 'drop'),
        globalHookInvoker('drop', options.hook || []),
        vnode => vnode.node = undefined,
    )

    const context: Context = {
        activate: (vnode: VNode) => activate(vnode, null, context, isNotReusedNode),
        dispose: (vnode: VNode) => callbacks.enqueue(dispose.bind(null, vnode, null, context)),
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