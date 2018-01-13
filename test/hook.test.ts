import { mount, div } from '../src/index'
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
    expect.assertions(8)
    const tree = div()
    const callback = (el: HTMLElement) => {
        expect(el).toBeInstanceOf(HTMLElement)
        expect(tree.node).toBe(el)
    }
    const create = jest.fn(callback)
    const drop = jest.fn(callback)
    const hookA = { create, drop }
    const hookB = { create }

    mount(tree, document.body, { hook: [hookA, hookB] })()

    expect(create).toHaveBeenCalledTimes(2)
    expect(drop).toHaveBeenCalledTimes(1)
})