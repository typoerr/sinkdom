import { isString, isNumber } from '@cotto/utils.ts'
import { isObs, Observable, Subscription } from './observable'
import { Props } from './props'

const REUSED = Symbol('REUSED')

export abstract class VNode {
    type: string
    props: Props = {}
    children: VNode[] = []
    node?: Node
}

export class VElementNode extends VNode {
    subscriptions: Subscription[] = []
    constructor(type: string, props: Props, children: VNode[]) {
        super()
        this.type = type
        this.props = props
        this.children = children
    }
}

export class VSinkNode extends VNode {
    type = 'sink'
    source: Observable<any>
    subscriptions: Subscription[] = []
    node?: Comment // placeholder
    constructor(source: Observable<any>) {
        super()
        this.source = source
    }
}

export class VTextNode extends VNode {
    type = 'text'
    value: string
    node?: Text
    constructor(text: string) {
        super()
        this.value = text
    }
}

export class VCommentNode extends VNode {
    type = 'comment'
    node?: Comment
}

export class VFragmentNode extends VNode {
    type = 'fragment'
    node?: DocumentFragment
    constructor(children: VNode[]) {
        super()
        this.children = children
    }
}

export function isVNode(x: any): x is VNode {
    return x instanceof VNode
}

export function isVElementNode(x: any): x is VElementNode {
    return x instanceof VElementNode
}

export function isVSinkNode(x: any): x is VSinkNode {
    return x instanceof VSinkNode
}

export function isVTextNode(x: any): x is VTextNode {
    return x instanceof VTextNode
}

export function isVCommentNode(x: any): x is VCommentNode {
    return x instanceof VCommentNode
}

export function isVFragmentNode(x: any): x is VFragmentNode {
    return x instanceof VFragmentNode
}

export function isReusedNode(x: VNode) {
    return REUSED in x
}

export function toReusedNode<T extends VNode>(vnode: T) {
    (vnode as any)[REUSED] = true
    return vnode
}

export function getKey(vnode: VNode) {
    return vnode.props.key || undefined
}

export function hasSubscriptions(vnode: VNode): vnode is VNode & { subscriptions: Subscription[] } {
    return Array.isArray((vnode as any).subscriptions)
}

export function toVNode(x: any): VNode {
    if (isVNode(x)) {
        return x
    } else if (isString(x) || isNumber(x)) {
        return new VTextNode(String(x))
    } else if (Array.isArray(x)) {
        return new VFragmentNode(x.map(toVNode))
    } else if (isObs(x)) {
        return new VSinkNode(x)
    } else {
        return new VCommentNode()
    }
}
