import { subscribe, Observable, Subscription } from './observable'
import {
    VNode,
    VSinkNode,
    VFragmentNode,
    VElementNode,
    isVTextNode,
    isVFragmentNode,
    hasSubscriptions,
    toVNode,
    toReusedNode,
    getKey,
    isSameKey,
} from './vnode'
import { invokeNodeHook } from './lifecycle'
import { insertBefore, removeChild, replaceChild } from './dom'

export interface NodeObserverContext {
    activate: (vnode: VNode) => VNode,
    dispose: (vnode: VNode) => void,
    proxy: (observable: Observable<any>) => Observable<any>
}

class NodeObserver {
    $placeholder: Comment
    $parent: Node
    host: VSinkNode
    ctx: NodeObserverContext
    constructor(host: VSinkNode, ctx: NodeObserverContext) {
        this.$placeholder = host.node!
        this.$parent = host.node!.parentNode!
        this.host = host
        this.ctx = ctx
    }
    next(nextNode: VNode) {
        const { $placeholder, $parent, host, ctx } = this
        nextNode = toVNode(nextNode)
        const curCh = host.children
        const nextCh = isVFragmentNode(nextNode) ? nextNode.children : [nextNode]

        if (curCh.length <= 0) {
            const next = ctx.activate(new VFragmentNode(nextCh))
            insertBefore($parent, next.node!, $placeholder.nextSibling)
            host.children = next.children
        } else if (curCh.length === 1 && nextCh.length === 1) {
            const cur = curCh[0]
            let next = nextCh[0]
            if (isVTextNode(cur) && isVTextNode(next)) {
                /* patch text to text */
                cur.node!.nodeValue = next.value
                cur.value = next.value
            } else if (!isSameKey(cur, next)) {
                /* patch single slot element */
                next = nextCh[0] = ctx.activate(next)
                replaceElement($parent, next as VElementNode, cur as VElementNode, ctx.dispose)
                host.children = nextCh
            }
        } else {
            /* patch multi slot elements */
            let curStartIdx = 0
            let curEndIdx = curCh.length - 1
            let curAtStart: VNode | undefined = curCh[curStartIdx]
            let curAtEnd: VNode | undefined = curCh[curEndIdx]
            let nextStartIdx = 0
            let nextEndIdx = nextCh.length - 1
            let nextAtStart: VNode | undefined = nextCh[nextStartIdx]
            let next: VNode
            let nextAtEnd: VNode | undefined = nextCh[nextEndIdx]
            let curKeyedIdxMap: Map<string, number> | undefined
            let idxInCurCh: number | undefined

            while (curStartIdx <= curEndIdx && nextStartIdx <= nextEndIdx) {
                if (curAtStart == null) {
                    curAtStart = curCh[++curStartIdx]
                } else if (curAtEnd == null) {
                    curAtEnd = curCh[--curEndIdx]
                } else if (nextAtStart == null) {
                    nextAtStart = nextCh[++nextStartIdx]
                } else if (nextAtEnd == null) {
                    nextAtEnd = nextCh[--nextEndIdx]
                } else if (isSameKey(curAtStart, nextAtStart)) {
                    nextCh[nextStartIdx] = toReusedNode(curAtStart)
                    curAtStart = curCh[++curStartIdx]
                    nextAtStart = nextCh[++nextStartIdx]
                } else if (isSameKey(curAtEnd, nextAtEnd)) {
                    nextCh[nextEndIdx] = toReusedNode(curAtEnd)
                    curAtEnd = curCh[--curEndIdx]
                    nextAtEnd = nextCh[--nextEndIdx]
                } else if (isSameKey(curAtStart, nextAtEnd)) {
                    next = nextCh[nextEndIdx] = toReusedNode(curAtStart)
                    insertBefore($parent, next.node!, curAtEnd.node!.nextSibling)
                    curAtStart = curCh[++curStartIdx]
                    nextAtEnd = nextCh[--nextEndIdx]
                } else if (isSameKey(curAtEnd, nextAtStart)) {
                    next = nextCh[nextStartIdx] = toReusedNode(curAtEnd)
                    insertBefore($parent, next.node!, curAtStart.node!)
                    curAtEnd = curCh[--curEndIdx]
                    nextAtStart = nextCh[++nextStartIdx]
                } else {
                    if (curKeyedIdxMap == null) {
                        curKeyedIdxMap = createKeyedIdxMap(curCh, curStartIdx, curEndIdx)
                    }
                    idxInCurCh = curKeyedIdxMap.get(getKey(nextAtStart)!)
                    if (idxInCurCh === undefined) {
                        next = nextCh[nextStartIdx] = ctx.activate(nextAtStart)
                        insertBefore($parent, next.node!, curAtStart.node!)
                        nextAtStart = nextCh[++nextStartIdx]
                    } else {
                        next = nextCh[nextStartIdx] = toReusedNode(curCh[idxInCurCh])
                        insertBefore($parent, next.node!, curAtStart.node!)
                        curCh[idxInCurCh] = undefined as any
                        nextAtStart = nextCh[++nextStartIdx]
                    }
                }
            }
            if (curStartIdx <= curEndIdx || nextStartIdx <= nextEndIdx) {
                if (curStartIdx > curEndIdx) {
                    const before = nextCh[nextEndIdx + 1] == null ? null : nextCh[nextEndIdx + 1].node!
                    insertNodeInRange($parent, before, nextCh, nextStartIdx, nextEndIdx, ctx)
                } else {
                    removeNodeInRange($parent, curCh, curStartIdx, curEndIdx, ctx)
                }
            }
            // update refs
            host.children = nextCh
        }
    }
    error(error: any) {
        console.error(error)
    }
    complete() {
        /* noop */
    }
}

function createKeyedIdxMap(src: VNode[], startIdx: number, endIdx: number) {
    const map = new Map()
    let vnode: VNode
    let key: string | undefined
    let i = startIdx
    while (i <= endIdx) {
        vnode = src[i]
        key = getKey(vnode)
        if (key != null) {
            map.set(key, i)
        }
        i++
    }
    return map
}

function insertNodeInRange(parent: Node, before: Node | null, list: VNode[], startIdx: number, endIdx: number, ctx: NodeObserverContext) {
    startIdx = startIdx - 1
    while (++startIdx <= endIdx) {
        const vnode = list[startIdx]
        if (vnode != null) {
            const next = list[startIdx] = ctx.activate(vnode)
            insertBefore(parent, next.node!, before)
        }
    }
}

function removeNodeInRange(parent: Node, list: VNode[], startIdx: number, endIdx: number, ctx: NodeObserverContext) {
    startIdx = startIdx - 1
    while (++startIdx <= endIdx) {
        const vnode = list[startIdx]
        if (vnode != null) {
            removeElement(parent, vnode as VElementNode, ctx.dispose)
        }
    }
}

function removeElement(parent: Node, cur: VElementNode, dispose: Function) {
    return invokeNodeHook('remove', cur, () => {
        dispose(cur)
        removeChild(parent, cur.node!)
    })
}

function replaceElement(parent: Node, next: VElementNode, cur: VElementNode, dispose: Function) {
    return invokeNodeHook('remove', cur, () => {
        dispose(cur)
        replaceChild(parent, next.node!, cur.node!)
    })
}

export function observeNode(host: VSinkNode, _: any, ctx: NodeObserverContext) {
    host.subscriptions.push(subscribe(
        ctx.proxy(host.source),
        new NodeObserver(host, ctx),
    ))
}

export function unsubscribes(vnode: VNode) {
    let s: Subscription
    if (hasSubscriptions(vnode)) {
        // tslint:disable:no-conditional-assignment
        while (s = vnode.subscriptions.shift()!) {
            s.unsubscribe()
        }
    }
}
