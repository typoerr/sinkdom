import { mount, VNode, isVNode } from '../src/index'
import { div } from '../src/hh'
import { hookInvoker } from '../src/hook'

test('hookInvoker', () => {
    expect.assertions(2)
    const hook = { create: jest.fn(), drop: jest.fn() }

    hookInvoker('create', [hook, hook])(div())
    hookInvoker('drop', [hook, hook])(div())

    expect(hook.create).toHaveBeenCalledTimes(2)
    expect(hook.drop).toHaveBeenCalledTimes(2)
})

test('global hook', async () => {
    expect.assertions(11)
    const tree = div()
    const callback = (el: HTMLElement, vnode: VNode) => {
        expect(el).toBeInstanceOf(HTMLElement)
        expect(isVNode(vnode)).toBe(true)
        expect(vnode).toBe(tree)
    }
    const create = jest.fn(callback)
    const drop = jest.fn(callback)
    const hookA = { create, drop }
    const hookB = { create }

    mount(tree, document.body, { hook: [hookA, hookB] })()

    expect(create).toHaveBeenCalledTimes(2)
    expect(drop).toHaveBeenCalledTimes(1)
})