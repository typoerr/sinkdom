import { Hash } from '@cotto/utils.ts'
import { isObs, subscribe, PartialObservable, Observable } from './observable'
import { VElementNode } from './vnode'
import { toKebabCase } from './utils'
import { setEventListeners } from './eventlistener'

export type BareValue = string | number | null | undefined | boolean

export type ObserveValue = BareValue | Observable<BareValue> | PartialObservable<Hash<BareValue>>

export interface Patch {
    (el: HTMLElement, value: BareValue, key: string): void
}

function setClassName(el: HTMLElement, value: any) {
    el.className = value || ''
}

function setStyle(el: HTMLElement, value: any, key: any) {
    el.style[key] = value
}

function setDataset(el: HTMLElement, value: any, key: string) {
    key = 'data-' + toKebabCase(key)
    if (value == null) {
        el.removeAttribute(key)
    } else {
        el.setAttribute(key, value)
    }
}

function setAttr(el: any, value: any, key: string) {
    if (value == null || value === false) {
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

export interface PropsObserverContext {
    proxy: (value: Observable<any>) => Observable<any>
}

class PropsObserver {
    _: { key: string }
    patch: Function
    el: HTMLElement
    constructor(el: HTMLElement, key: string, patch: Function) {
        this._ = { key }
        this.patch = patch
        this.el = el
    }
    next(value: any) {
        this.patch(this.el, value, this._.key)
    }
    error(err: any) {
        console.error(err)
    }
    complete() {
        /* noop */
    }
}

function makePatch(patch: Patch) {
    return function bound(vnode: VElementNode, el: HTMLElement, value: ObserveValue, key: string, context: PropsObserverContext) {
        if (isObs(value)) {
            const s = subscribe(context.proxy(value), new PropsObserver(el, key, patch))
            vnode.subscriptions.push(s)
        } else if (value != null && value.constructor === Object) {
            for (const k in value as object) {
                bound(vnode, el, (value as any)[k], k, context)
            }
        } else {
            patch(el, value as any, key)
        }
    }
}

const patchClassName = makePatch(setClassName)
const patchStyle = makePatch(setStyle)
const patchDataset = makePatch(setDataset)
const patchAttr = makePatch(setAttr)

export function setElementProps(vnode: VElementNode, _: any, context: PropsObserverContext) {
    const props = vnode.props
    const el = vnode.node! as HTMLElement
    for (const name in props) {
        const value = props[name]
        if (name === 'key' || name === 'hook') {
            /* noop */
        } else if (name === 'class' || name === 'className') {
            patchClassName(vnode, el, value, name, context)
        } else if (name === 'style') {
            patchStyle(vnode, el, value, name, context)
        } else if (name === 'data') {
            patchDataset(vnode, el, value, name, context)
        } else if (name === 'on') {
            setEventListeners(el, value)
        } else {
            patchAttr(vnode, el, value, name, context)
        }
    }
}
