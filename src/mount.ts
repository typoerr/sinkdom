import { not, identity, bundle, or } from '@cotto/utils.ts'
import {
    VNode,
    VElementNode,
    VSinkNode,
    VCommentNode,
    VFragmentNode,
    isVElementNode,
    isVSVGNode,
    isVSinkNode,
    isVTextNode,
    isVCommentNode,
    isVFragmentNode,
    isReusedNode,
    toVNode,
} from './vnode'
import {
    appendChild,
    createElement,
    createSVGElement,
    createTextNode,
    createMarkerComment,
    createFrangment,
    createPlaceholder,
} from './dom'
import { invokeNodeHook, hasHook } from './lifecycle'
import { attach, proxy, createTreeWalker, queue, defer, cond } from './utils'
import { setElementProps, setSVGProps, PropsObserverContext } from './props-observer'
import { observeNode, unsubscribes, NodeObserverContext } from './node-observer'
import { Hook, hookInvoker as globalHookInvoker } from './hook'
import { Observable } from './observable'

type Parent = VNode | null
type Context = NodeObserverContext & PropsObserverContext

export interface MountOptions {
    hook?: Hook[]
    proxy?(observable: Observable<any>): Observable<any>
}

const DEBOUNCE_TIME = process.env.NODE_ENV === 'test' ? 0 : 300 // suitable?
const debounce = require('debounce')

const isNotReusedNode = not(isReusedNode)

const attachElement = attach('node', createElement)
const attachSVGElementNS = attach('node', createSVGElement)
const attachPlaceholder = attach<VNode, 'node'>('node', createPlaceholder)
const attachTextNode = attach('node', createTextNode)
const attachFragment = attach<VFragmentNode, 'node'>('node', createFrangment)
const attachComment = attach<VCommentNode, 'node'>('node', createMarkerComment)

const whenNotReuseableNode = proxy<VNode, Parent, Context>(isNotReusedNode)
const whenVElementNodeOrVSVGNode = proxy<VElementNode, Parent, Context>(or(isVElementNode, isVSVGNode))
const whenVSinkNode = proxy<VSinkNode, Parent, Context>(isVSinkNode)
const whenHasInsertHook = proxy<VElementNode, Parent, Context>(hasHook('insert'))

const enqueueInsertHook = (callbacks: { enqueue: Function }) => {
    return (vnode: VNode) => callbacks.enqueue(invokeNodeHook.bind(null, 'insert', vnode))
}

export function mount(tree: VNode, container: HTMLElement = document.body, options: MountOptions = {}) {
    tree = toVNode(tree)

    const callbacks = queue(defer as any)
    const ps = callbacks.process.bind(callbacks, undefined)
    const processCallbacks = debounce(ps, DEBOUNCE_TIME)

    const activate = createTreeWalker<VNode, Context>(
        whenNotReuseableNode(
            cond(
                cond.when(isVElementNode, bundle(attachElement, setElementProps)),
                cond.when(isVSVGNode, bundle(attachSVGElementNS, setSVGProps)),
                cond.when(isVSinkNode, attachPlaceholder),
                cond.when(isVTextNode, attachTextNode),
                cond.when(isVFragmentNode, attachFragment),
                cond.when(isVCommentNode, attachComment),
            ),
            appendChild,
            whenVSinkNode(observeNode),
            whenVElementNodeOrVSVGNode(invokeNodeHook.bind(null, 'create')),
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
        onpatch: processCallbacks,
    }

    tree = activate(tree, null, context)
    container.appendChild(tree.node!)
    processCallbacks()

    return function unmount() {
        return invokeNodeHook('remove', tree as VElementNode, () => {
            container.removeChild(tree.node!)
            dispose(tree, null, context)
            processCallbacks()
        })
    }
}