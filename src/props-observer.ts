import { isVoid, isPlainObject, Hash } from '@cotto/utils.ts'
import { isObs, subscribe, PartialObservable, Observable } from './observable'
import { VElementNode } from './vnode'
import { toKebabCase } from './utils'
import { setEventListeners } from './eventlistener'

export type BareValue = string | number | null | undefined | boolean

export type ObserveValue = BareValue | Observable<BareValue> | PartialObservable<Hash<BareValue>>

export interface Patch {
    (el: HTMLElement, value: BareValue, key: string): void
}

export interface PropsObserverContext {
    proxy: (value: Observable<any>) => Observable<any>
}

export function patchify(patch: Patch) {
    return function patcher(vnode: VElementNode, el: HTMLElement, value: ObserveValue, key: string, context: PropsObserverContext) {
        if (isObs(value)) {
            const s = subscribe(context.proxy(value), observe(patch, el, key))
            vnode.subscriptions.push(s)
        } else if (isPlainObject(value)) {
            for (const k in value) { patcher(vnode, el, value[k], k, context) }
        } else {
            patch(el, value, key)
        }
    }
}

function observe(patch: Patch, el: HTMLElement, key: string) {
    let current: any
    return (next: BareValue) => {
        if (current !== next) {
            patch(el, next, key)
            current = next
        }
    }
}

function setClassName(el: HTMLElement, value: any) {
    el.className = value || ''
}

function setStyle(el: HTMLElement, value: any, key: any) {
    el.style[key] = value
}

function setDataset(el: HTMLElement, value: any, key: string) {
    key = 'data-' + toKebabCase(key)
    if (isVoid(value)) {
        el.removeAttribute(key)
    } else {
        el.setAttribute(key, value)
    }
}

function setAttr(el: any, value: any, key: string) {
    if (isVoid(value) || value === false) {
        el.removeAttribute(key)
    } else if (key in el) {
        // for dom property
        try {
            el[key] = value || ''
        } catch { /*  */ }
    } else {
        el.setAttribute(key, value)
    }
}

const patches = {
    classname: patchify(setClassName),
    style: patchify(setStyle),
    dataset: patchify(setDataset),
    attr: patchify(setAttr),
}

export function setElementProps(vnode: VElementNode, _: any, context: PropsObserverContext) {
    const el = vnode.node! as HTMLElement
    for (const name in vnode.props) {
        const value = vnode.props[name]
        if (name === 'key' || name === 'hook') {
            /* noop */
        } else if (name === 'class' || name === 'className') {
            patches.classname(vnode, el, value, name, context)
        } else if (name === 'style') {
            patches.style(vnode, el, value, name, context)
        } else if (name === 'data') {
            patches.dataset(vnode, el, value, name, context)
        } else if (name === 'on') {
            setEventListeners(el, value)
        } else {
            patches.attr(vnode, el, value, name, context)
        }
    }
}
