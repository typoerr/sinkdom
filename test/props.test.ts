import { Observable, Subject } from 'rxjs'
import { delay } from '@cotto/utils.ts'
import { html } from '../src/utils'
import { treeTester } from './test-utils'
import { mount, VNode, isVElementNode } from '../src/index'
import { div, input } from '../src/hh'

const { setup, teardown, testTree } = treeTester()

beforeEach(setup)
afterEach(teardown)

//
// ─── CLASSNAME ──────────────────────────────────────────────────────────────────
//
describe('className', () => {
    const a$ = Observable.of('a')
    const b$ = Observable.of('b').delay(10).startWith('')
    const name$ = Observable.combineLatest(a$, b$, (a, b) => a + ' ' + b)

    testTree('static class', () => ({
        tree: div({ class: 'klass' }),
        result: html`<div class="klass"></div>`,
    }))
    testTree('static className', () => ({
        tree: div({ className: 'klass' }),
        result: html`<div class="klass"></div>`,
    }))
    testTree('observable className', () => ({
        tree: div({ class: name$ }),
        result: name$.map(name => html`<div class="${name}"></div>`),
    }))
})

//
// ─── STYLE ──────────────────────────────────────────────────────────────────────
//
describe('style', () => {
    const bgcolor$ = Observable.of('red')
        .concat(Observable.of('blue').delay(10))

    testTree('static style', () => ({
        tree: div({ style: { background: 'red', fontSize: '12px' } }),
        result: html`<div style="background: red; font-size: 12px;"></div>`,
    }))
    testTree('observable style', () => ({
        tree: div({ style: { background: bgcolor$ } }),
        result: bgcolor$.map(color => html`<div style="background: ${color};"></div>`),
    }))
})

//
// ─── DATASET ────────────────────────────────────────────────────────────────────
//
describe('dataset', () => {
    const xId$ = Observable.of('a')
        .concat(Observable.of('b').delay(10))

    testTree('static dataset', () => ({
        tree: div({ data: { xId: 'a' } }),
        result: html`<div data-x-id="a"></div>`,
    }))
    testTree('observable dataset', () => ({
        tree: div({ data: { xId: xId$ } }),
        result: xId$.map(id => html`<div data-x-id="${id}"></div>`),
    }))
})

//
// ─── DOM PROPS ──────────────────────────────────────────────────────────────────
//
describe('dom props', () => {
    test('static value', () => {
        const tree = input({ value: 'a' })
        const unmount = mount(tree)
        expect((tree.node as HTMLInputElement).value).toBe('a')
        unmount()
    })

    test('observable value', async () => {
        const value$ = Observable.of('a').concat(Observable.of('b').delay(10))
        const tree = input({ value: value$ })
        const unmount = mount(tree)
        await value$.delay(1)
            .do(s => expect((tree.node as HTMLInputElement).value).toBe(s))
            .toPromise()

        unmount()
    })
})

//
// ─── ATTRIBUTE ──────────────────────────────────────────────────────────────────
//
describe('attribute', () => {
    const id$ = Observable.of('a')
        .concat(Observable.of('b').delay(10))

    testTree('static dataset', () => ({
        tree: div({ id: 'a' }),
        result: html`<div id="a"></div>`,
    }))
    testTree('observable dataset', () => ({
        tree: div({ id: id$ }),
        result: id$.map(id => html`<div id="${id}"></div>`),
    }))
})

//
// ─── EVENTLISTENER ──────────────────────────────────────────────────────────────
//
describe('eventlistener', () => {
    test('listener function', () => {
        const listener = jest.fn()
        const tree = div({ on: { click: listener } })
        const unmount = mount(tree);
        (tree.node as HTMLDivElement).click()
        expect(listener.mock.calls[0][0]).toBeInstanceOf(Event)
        unmount()
    })

    test('subject', () => {
        expect.assertions(1)
        const click = new Subject<Event>()
        click.subscribe(e => expect(e).toBeInstanceOf(Event))
        const tree = div({ on: { click } })
        const unmount = mount(tree);
        (tree.node as HTMLElement).click()
        unmount()
    })
})

//
// ─── LIFECYCLE ───────────────────────────────────────────────────────────────────────
//
test('lifecycle', async () => {
    expect.assertions(8)
    const create = (el: HTMLElement, vnode: VNode) => {
        expect(document.body.contains(el)).toBe(false)
        expect(isVElementNode(vnode)).toBe(true)
    }
    const insert = (el: HTMLElement, vnode: VNode) => {
        expect(document.body.contains(el)).toBe(true)
        expect(isVElementNode(vnode)).toBe(true)
    }
    const remove = (el: HTMLElement, vnode: VNode, done: Function) => {
        expect(document.body.contains(el)).toBe(true)
        expect(isVElementNode(vnode)).toBe(true)
        done()
    }
    const drop = (el: HTMLElement, vnode: VNode) => {
        expect(document.body.contains(el)).toBe(false)
        expect(isVElementNode(vnode)).toBe(true)
    }

    const tree = div({ hook: { create, insert, remove, drop } })
    const unmount = mount(tree)
    await delay(50)
    unmount()
})