import { VNode, VElementNode, VTextNode } from './vnode'

const MARKER = `${String(Math.random()).slice(2)}`

export function appendChild(vnode: VNode, parent: VNode | null) {
    if (vnode.node && parent && parent.node) {
        parent.node.appendChild(vnode.node)
    }
}

export function createElementNode(vnode: VElementNode) {
    return document.createElement(vnode.type)
}

export function createTextNode(vnode: VTextNode) {
    return document.createTextNode(vnode.value)
}

export function createComment() {
    return document.createComment(`{{${MARKER}}}`)
}

export function createFrangment() {
    return document.createDocumentFragment()
}

export function createPlaceholder() {
    return document.createComment(`{{placeholder-${MARKER}}}`)
}
