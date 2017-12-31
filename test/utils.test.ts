import * as util from '../src/utils'
import { isNumber, isString } from '@cotto/utils.ts'

test('defer', () => {
    const f = () => 1
    const result = util.defer(f)
    expect(result instanceof Promise).toBe(true)
    return result.then(n => expect(n).toBe(1))
})

test('invokeCallback', () => {
    const f = jest.fn()
    util.invokeCallback('a', 'b', f)
    expect(f).toBeCalled()
})

test('toKebabCase', () => {
    expect(util.toKebabCase('helloWorld')).toBe('hello-world')
    expect(util.toKebabCase('HelloWorld')).toBe('hello-world')
})

test('proxy', () => {
    expect.assertions(5)
    const a = jest.fn()
    const b = jest.fn()
    const c = jest.fn()
    util.proxy(isNumber, a, b)(1)
    util.proxy(isString, c)(1)
    expect(a).toBeCalledWith(1, undefined, undefined)
    expect(a).toHaveBeenCalledTimes(1)
    expect(b).toBeCalledWith(1, undefined, undefined)
    expect(b).toHaveBeenCalledTimes(1)
    expect(c).not.toBeCalled()
})

test('attach', () => {
    const f = (value: { a: number }, n = 1) => value.a + n
    const src = { a: 1 }
    const result = util.attach('a', f)(src, 10)
    expect(result).toEqual({ a: 11 })
    expect(src).toEqual({ a: 11 })
})

describe('createTreeWalker', () => {
    const treeGen = () => ({
        type: 'a',
        children: [{ type: 'b', children: [] }],
    })
    test('node walk', () => {
        const visitor = jest.fn()
        const tree = treeGen()
        const _tree = util.createTreeWalker(visitor)(tree, null, 1)
        expect(tree).toBe(_tree)
        expect(visitor).toHaveBeenCalledTimes(2)
        expect(visitor.mock.calls[0][0]).toBe(tree)
        expect(visitor.mock.calls[0][1]).toBe(null)
        expect(visitor.mock.calls[0][2]).toBe(1)
        expect(visitor.mock.calls[1][0]).toBe(tree.children[0])
        expect(visitor.mock.calls[1][1]).toBe(tree)
        expect(visitor.mock.calls[1][2]).toBe(1)
    })
    test('with director', () => {
        const visitor = jest.fn()
        const director = jest.fn().mockReturnValue(false)
        const tree = treeGen()
        util.createTreeWalker(visitor)(tree, null, 1, director)
        expect(visitor).toHaveBeenCalledTimes(1)
        expect(visitor.mock.calls[0][0]).toBe(tree)
        expect(visitor.mock.calls[0][1]).toBe(null)
        expect(visitor.mock.calls[0][2]).toBe(1)
    })
})

test('queue', async () => {
    expect.assertions(2)
    const queue = util.queue()
    const t1 = jest.fn()
    const t2 = jest.fn()
    queue.enqueue(t1)
    queue.enqueue(t2)
    await new Promise(queue.process)
    await new Promise(queue.process)
    expect(t1).toHaveBeenCalledTimes(1)
    expect(t2).toHaveBeenCalledTimes(1)
})

