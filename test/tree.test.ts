import { Observable } from 'rxjs'
import { html } from '../src/utils'
import { treeTester } from './test-utils'
import { mount, isReusedNode, div, li, ul } from '../src/index'

const $placeholder = html`<!--{{placeholder-}}-->`
const $comment = html`<!--{{}}-->`

const { setup, teardown, testTree } = treeTester()

beforeEach(setup)
afterEach(teardown)

describe('text', () => {
    const text$ = Observable.of('a').concat(Observable.of('b').delay(5))

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
        .concat(Observable.of('text2').delay(5))

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
            list$.concatMap(x => Observable.from(x)
                .map(li)
                .toArray(),
            ),
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
            list$.concatMap(x => Observable.from(x)
                .map(n => li({ key: n }, n))
                .toArray(),
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
        expect.assertions(4)

        const list$ = Observable.of(['a', 'b', 'c', 'd'])
            .concat(Observable.of(['b', 'a', 'd', 'c']).delay(5))
            .concatMap(x => Observable.from(x).map(li).toArray())
        const tree = ul([list$])
        const unmount = mount(tree)

        const list = await list$.toPromise().then(() => tree.children[0].children)

        list.forEach(vnode => {
            expect(isReusedNode(vnode)).toBe(false)
        })
        unmount()
    })

    test('keyed list should resuse element that same keyed', async () => {
        expect.assertions(4)
        const list$ = Observable.of(['a', 'b', 'c', 'd'])
            .concat(Observable.of(['b', 'a', 'd', 'c']).delay(10))
            .concatMap(x => Observable.from(x).map(n => li({ key: n }, n)).toArray())
            .shareReplay(1)

        const tree = ul([list$])
        const unmount = mount(tree)
        const list = await list$.toPromise().then(() => tree.children[0].children)

        list.forEach(vnode => {
            expect(isReusedNode(vnode)).toBe(true)
        })
        unmount()
    })
})

