import { Observable } from 'rxjs'
import { delay } from '@cotto/utils.ts'
import { html } from '../src/utils'
import { treeTester } from './test-utils'
import { mount, isReusedNode, div, li, ul } from '../src/index'

const $placeholder = html`<!--{{placeholder-}}-->`
const $comment = html`<!--{{}}-->`

const { setup, teardown, testTree } = treeTester()

beforeEach(setup)
afterEach(teardown)

describe('text', () => {
    const text$ = Observable.of('a').concat(Observable.of('b').delay(10))

    testTree('static text', () => ({
        tree: 'text' as any,
        result: 'text',
    }))
    testTree('static number', () => ({
        tree: 1 as any,
        result: '1',
    }))
    testTree('observable text', () => ({
        tree: div([text$]),
        result: text$.delay(1).map(text => html`<div>${$placeholder}${text}</div>`),
    }))
})

describe('node', () => {
    const text$ = Observable.of('text')
        .concat(Observable.of('text2').delay(10))

    testTree('static node', () => ({
        tree: div('text'),
        result: html`<div>text</div>`,
    }))
    testTree('static nested node', () => ({
        tree: div([div([div('a'), div('b')])]),
        result: html`
        <div>
            <div>
                <div>a</div>
                <div>b</div>
            </div>
        </div>
    `,
    }))
    testTree('observable node', () => ({
        tree: div([
            text$.map(text => div([text])),
        ]),
        result: text$.delay(1).map(text => html`
            <div>
                ${$placeholder}
                <div>${text}</div>
            </div>
        `),
    }))
})

describe('list', () => {
    const list$ = Observable.of(['a', 'b', 'c', 'd'])
        .concat(Observable.of(['b', 'a', 'd', 'c']).delay(10))
        .shareReplay(1)

    testTree('static list', () => ({
        tree: ul(['a', 'b', 'c'].map(li)),
        result: html`
        <ul>
            <li>a</li>
            <li>b</li>
            <li>c</li>
        </ul>
    `,
    }))
    testTree('observable list', () => ({
        tree: ul([
            list$.concatMap(x =>
                Observable.from(x).map(li).toArray()),
        ]),
        result: list$.delay(1).map(list => html`
            <ul>
                ${$placeholder}
                ${list.map(el => html`<li>${el}</li>`)}
            </ul>
        `),
    }))

    testTree('observable keyed list', () => ({
        tree: ul({}, [
            list$.concatMap(x =>
                Observable.from(x).map(n => li({ key: n }, n)).toArray(),
            ),
        ]),
        result: list$.delay(1).map(list => html`
            <ul>
                ${$placeholder}
                ${list.map(el => html`<li>${el}</li>`)}
            </ul>
        `),
    }))
})

describe('comment', () => {
    testTree('static comment', () => ({
        tree: div([null, null]),
        result: html`
        <div>
            ${$comment}
            ${$comment}
        </div>
    `,
    }))
})


describe('reuse node', () => {
    test('non-keyed list is not resused', async () => {
        let unmount: any

        const list$ = Observable.of(['a', 'b', 'c', 'd'])
            .concat(Observable.of(['b', 'a', 'd', 'c']).delay(50))

        const tree = ul([
            list$.concatMap(x =>
                Observable.from(x).map(li).toArray(),
            ),
        ])

        unmount = mount(tree)

        const a = tree.children[0].children

        await delay(60)

        const b = tree.children[0].children

        b.forEach(vnode => expect(isReusedNode(vnode)).toBe(false))
        expect(a[0].node).not.toBe(b[1].node)
        expect(a[1].node).not.toBe(b[0].node)
        expect(a[2].node).not.toBe(b[3].node)
        expect(a[3].node).not.toBe(b[2].node)

        unmount()
    })

    test('keyed list should resuse element that same keyed', async () => {
        let unmount: any

        const list$ = Observable.of(['a', 'b', 'c', 'd'])
            .concat(Observable.of(['b', 'a', 'd', 'c']).delay(50))

        const tree = ul([
            list$.concatMap(x =>
                Observable.from(x).map(n => li({ key: n }, n)).toArray(),
            ),
        ])

        unmount = mount(tree)

        const a = tree.children[0].children

        await delay(60)

        const b = tree.children[0].children

        b.forEach(vnode => expect(isReusedNode(vnode)).toBe(true))
        expect(a[0].node).toBe(b[1].node)
        expect(a[1].node).toBe(b[0].node)
        expect(a[2].node).toBe(b[3].node)
        expect(a[3].node).toBe(b[2].node)

        unmount()
    })
})

