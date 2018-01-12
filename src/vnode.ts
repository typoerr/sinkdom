import { isObs, Observable, Subscription } from './observable'
import { Props } from './props'

const REUSED = Symbol('REUSED')

export enum VNodeType {
    Element,
    Comment,
    Text,
    Fragment,
    Sink,
}

export interface VNode {
    readonly vnodeType: VNodeType
    readonly type: string
    props: Props
    children: VNode[]
    node?: Node
}

export class VElementNode implements VNode {
    vnodeType: VNodeType
    type: string
    props: Props
    children: VNode[]
    node?: HTMLElement
    subscriptions: Subscription[] = []
    constructor(type: string, props: Props, children: VNode[]) {
        this.type = type
        this.props = props || {}
        this.children = children || []
    }
}
VElementNode.prototype.vnodeType = VNodeType.Element

export class VSinkNode implements VNode {
    vnodeType: VNodeType
    type: 'sink'
    props: Props = {}
    children: VNode[] = []
    node?: Comment
    source: Observable<any>
    subscriptions: Subscription[] = []
    constructor(source: Observable<any>) {
        this.source = source
    }
}
VSinkNode.prototype.type = 'sink'
VSinkNode.prototype.vnodeType = VNodeType.Sink

export class VTextNode implements VNode {
    vnodeType: VNodeType
    type: 'text'
    props = {}
    children = []
    value: string
    node?: Text
    constructor(text: string) {
        this.value = text
    }
}
VTextNode.prototype.type = 'text'
VTextNode.prototype.vnodeType = VNodeType.Text

export class VCommentNode implements VNode {
    vnodeType: VNodeType
    type: 'comment'
    props = {}
    children = []
    node?: Comment
}
VCommentNode.prototype.type = 'comment'
VCommentNode.prototype.vnodeType = VNodeType.Comment

export class VFragmentNode implements VNode {
    vnodeType: VNodeType
    type: 'fragment'
    props = {}
    children: VNode[]
    node?: DocumentFragment
    constructor(children: VNode[]) {
        this.children = children
    }
}
VFragmentNode.prototype.type = 'fragment'
VFragmentNode.prototype.vnodeType = VNodeType.Fragment

export function isVNode(vnode: any): vnode is VNode {
    return vnode != undefined && vnode.vnodeType != undefined
}

export function isVElementNode(vnode: any): vnode is VElementNode {
    return vnode != undefined && vnode.vnodeType === VNodeType.Element
}

export function isVSinkNode(vnode: any): vnode is VSinkNode {
    return vnode != undefined && vnode.vnodeType === VNodeType.Sink
}

export function isVTextNode(vnode: any): vnode is VTextNode {
    return vnode != undefined && vnode.vnodeType === VNodeType.Text
}

export function isVCommentNode(vnode: any): vnode is VCommentNode {
    return vnode != undefined && vnode.vnodeType === VNodeType.Comment
}

export function isVFragmentNode(vnode: any): vnode is VFragmentNode {
    return vnode != undefined && vnode.vnodeType === VNodeType.Fragment
}

export function isReusedNode(x: VNode) {
    return REUSED in x
}

export function toReusedNode<T extends VNode>(vnode: T) {
    (vnode as any)[REUSED] = REUSED
    return vnode
}

export function getKey(vnode: VNode) {
    return vnode.props.key || undefined
}

export function isSameKey(a: VNode, b: VNode) {
    const ak = getKey(a)
    const bk = getKey(b)
    return ak === bk && ak != undefined && bk != undefined
}

export function hasSubscriptions(vnode: VNode): vnode is VNode & { subscriptions: Subscription[] } {
    return Array.isArray((vnode as any).subscriptions)
}

export function toVNode(x: any): VNode {
    if (isVNode(x)) {
        return x
    } else if (isObs(x)) {
        return new VSinkNode(x)
    } else if (typeof x === 'string' || typeof x === 'number') {
        return new VTextNode(String(x))
    } else if (Array.isArray(x)) {
        return new VFragmentNode(x)
    } else {
        return new VCommentNode()
    }
}
