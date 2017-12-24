import * as _ from '../src/vnode'
import { Observable } from 'rxjs'

test('toReusedNode / isResusedNode', () => {
    const vnode = new _.VElementNode('div', {}, [])
    expect(_.isReusedNode(vnode)).toBe(false)
    expect(_.isReusedNode(_.toReusedNode(vnode))).toBe(true)
})

test('getKey', () => {
    const v1 = new _.VElementNode('div', { key: 'key' }, [])
    const v2 = new _.VElementNode('div', {}, [])
    expect(_.getKey(v1)).toBe('key')
    expect(_.getKey(v2)).toBeUndefined()
})

test('hasSubscriptions', () => {
    const v1 = new _.VElementNode('div', { key: 'key' }, [])
    const v2 = new _.VTextNode('')
    expect(_.hasSubscriptions(v1)).toBe(true)
    expect(_.hasSubscriptions(v2)).toBe(false)
})

test('toVNode', () => {
    const vel = new _.VElementNode('div', {}, [])
    expect(_.toVNode('')).toBeInstanceOf(_.VTextNode)
    expect(_.toVNode(1)).toBeInstanceOf(_.VTextNode)
    expect(_.toVNode(vel)).toBeInstanceOf(_.VElementNode)
    expect(_.toVNode(vel) === vel).toBe(true)
    expect(_.toVNode(Observable.of(1))).toBeInstanceOf(_.VSinkNode)
    expect(_.toVNode(undefined)).toBeInstanceOf(_.VCommentNode)
    expect(_.toVNode(null)).toBeInstanceOf(_.VCommentNode)
    expect(_.toVNode({})).toBeInstanceOf(_.VCommentNode)
    expect(_.toVNode([])).toBeInstanceOf(_.VFragmentNode)
})