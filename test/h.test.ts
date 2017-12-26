import { h } from '../src/h'
import { div } from '../src/hh'
import { Observable } from 'rxjs'
import { VElementNode, toVNode } from '../src/vnode'
//
// ─── H ──────────────────────────────────────────────────────────────────────────
//
test('empty vnode', () => {
    expect(h('div')).toEqual(new VElementNode('div', {}, []))
})

test('with children', () => {
    const t1 = h('div', {}, ['c1', null, 'c2'])
    const t2 = h('div', {}, 'c1', null, 'c2')
    const r = new VElementNode('div', {}, [
        toVNode('c1'),
        toVNode(null),
        toVNode('c2'),
    ])
    expect(t1).toEqual(r)
    expect(t2).toEqual(r)
})

test('with props', () => {
    const t = h('div', { key: 'key' })
    const r = new VElementNode('div', { key: 'key' }, [])
    expect(t).toEqual(r)
})

//
// ─── HH ─────────────────────────────────────────────────────────────────────────
//
test('empty tag', () => {
    const r = new VElementNode('div', {}, [])
    expect(div()).toEqual(r)
})

test('tag - with children', () => {
    const obs = Observable.of()

    expect(div('child')).toEqual(h('div', {}, 'child'))

    expect(div(null)).toEqual(h('div', {}, [null]))

    expect(div(undefined)).toEqual(h('div', {}, [undefined]))

    expect(div(true)).toEqual(h('div', {}, [true]))

    expect(div(false)).toEqual(h('div', {}, [false]))

    expect(div(obs)).toEqual(h('div', {}, [obs]))

    expect(div(['hello', 'world'])).toEqual(h('div', {}, 'hello', 'world'))

    expect(div(['hello', obs])).toEqual(h('div', {}, ['hello', obs]))
})

test('tag - with props', () => {
    expect(div({ key: 'key' })).toEqual(h('div', { key: 'key' }, []))
})

test('tag - with props children', () => {
    const obs = Observable.of()
    const props = { key: 'key' }

    expect(div(props, 'child')).toEqual(h('div', props, 'child'))

    expect(div(props, null)).toEqual(h('div', props, null))

    expect(div(props, obs)).toEqual(h('div', props, obs))

    expect(div(props, ['child', null, obs]))
        .toEqual(h('div', props, ['child', null, obs]))

    expect(div(props, [div(obs)]))
        .toEqual(h('div', props, h('div', {}, obs)))
})
