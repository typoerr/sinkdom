import { h, div } from '../src/h'
import { VElementNode, toVNode } from '../src/vnode'

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

test('empty tag', () => {
    const r = new VElementNode('div', {}, [])
    expect(div()).toEqual(r)
})

test('tag - with children', () => {
    expect(div('child')).toEqual(h('div', {}, [toVNode('child')]))
    expect(div(['child', null])).toEqual(h('div', {}, [toVNode('child'), toVNode(null)]))
})

test('tag - with props', () => {
    expect(div({ key: 'key' })).toEqual(h('div', { key: 'key' }, []))
})

test('tag - with props children', () => {
    expect(div({ key: 'key' }, 'child')).toEqual(h('div', { key: 'key' }, [toVNode('child')]))
    expect(div({ key: 'key' }, null)).toEqual(h('div', { key: 'key' }, []))
    expect(div({ key: 'key' }, ['child', null])).toEqual(h('div', { key: 'key' }, [toVNode('child'), toVNode(null)]))
})
