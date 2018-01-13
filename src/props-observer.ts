import { Hash } from '@cotto/utils.ts'
import { isObs, subscribe, PartialObservable, Observable } from './observable'
import { VElementNode, VSVGNode } from './vnode'
import { toKebabCase } from './utils'
import { setEventListeners } from './eventlistener'

export type BareValue = string | number | null | undefined | boolean

export type ObserveValue = BareValue | Observable<BareValue> | PartialObservable<Hash<BareValue>>

export interface PropsObserverContext {
    proxy: (value: Observable<any>) => Observable<any>
}

function makePatch(patch: (el: HTMLElement | SVGElement, value: BareValue, key: string, isSVG: boolean) => void) {
    return function director(
        vnode: VElementNode | VSVGNode,
        value: ObserveValue,
        key: string,
        isSVG: boolean,
        ctx: PropsObserverContext,
    ) {
        if (isObs(value)) {
            const s = subscribe(ctx.proxy(value), next => patch(vnode.node!, next, key, isSVG))
            vnode.subscriptions.push(s)
        } else if (value != null && value.constructor === Object) {
            for (const k in value as object) {
                director(vnode, (value as any)[k], k, isSVG, ctx)
            }
        } else {
            patch(vnode.node!, value as any, key, isSVG)
        }
    }
}

function setAttr(el: any, value: any, key: string, isSVG: boolean) {
    if (typeof value === 'function' || ((key in el) && !isSVG)) {
        setDOMProps(el, value, key)
    } else if (value != null && value !== false) {
        el.setAttribute(key, value)
    }
    if (value == null || value === false) {
        el.removeAttribute(key)
    }
}

function setDOMProps(el: any, value: any, key: string) {
    try {
        el[key] = value || ''
    } catch (err) {/*  */ }
}

const patchStyle = makePatch((el: any, value, key) => el.style[key] = value)
const patchDataset = makePatch((el, value, key, isSVG) => setAttr(el, value, 'data-' + toKebabCase(key), isSVG))
const patchAttr = makePatch(setAttr)

export function setElementProps(vnode: VElementNode | VSVGNode, _: any, ctx: PropsObserverContext, isSVG = false) {
    const props = vnode.props
    const el = vnode.node! as HTMLElement
    for (const name in props) {
        const value = props[name]
        if (name === 'key' || name === 'hook') {
            continue
        } else if (name === 'class' || name === 'className') {
            patchAttr(vnode, value, 'class', isSVG, ctx)
        } else if (name === 'style') {
            patchStyle(vnode, value, name, isSVG, ctx)
        } else if (name === 'data') {
            patchDataset(vnode, value, name, isSVG, ctx)
        } else if (name === 'on') {
            setEventListeners(el, value)
        } else {
            patchAttr(vnode, value, name, isSVG, ctx)
        }
    }
}

export function setSVGProps(vnode: VSVGNode, _: any, ctx: PropsObserverContext) {
    return setElementProps(vnode, _, ctx, true)
}
