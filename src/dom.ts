import { VNode, VElementNode, VTextNode } from './vnode'

const MARKER = process.env.NODE_ENV === 'test' ? '' : `${String(Math.random()).slice(2)}`
const COMMENT = `{{${MARKER}}}`
const PLACEHOLDER = `{{placeholder-${MARKER}}}`

export function appendChild(vnode: VNode, parent: VNode | null) {
    if (vnode.node && parent && parent.node) {
        parent.node.appendChild(vnode.node)
    }
}

export function insertBefore(parent: Node, node: Node, ref: Node | null) {
    return parent.insertBefore(node, ref)
}

export function removeChild(parent: Node, node: Node) {
    return parent.removeChild(node)
}

export function replaceChild(parent: Node, next: Node, cur: Node) {
    return parent.replaceChild(next, cur)
}

export function createElementNode(vnode: VElementNode) {
    return document.createElement(vnode.type)
}

export function createTextNode(vnode: VTextNode) {
    return document.createTextNode(vnode.value)
}

export function createFrangment() {
    return document.createDocumentFragment()
}

export function createPlaceholder() {
    return document.createComment(PLACEHOLDER)
}

export function createMarkerComment() {
    return document.createComment(COMMENT)
}