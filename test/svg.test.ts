import { delay } from '@cotto/utils.ts'
import { Observable } from 'rxjs'
import { h, mount } from '../src/index'

const SVG_NS = 'http://www.w3.org/2000/svg'

test('svg', done => {
    expect.assertions(7)
    const insert = () => {
        const $svg = document.getElementById('svg')!
        const $circle = document.getElementById('circle')!

        expect($svg.namespaceURI).toBe(SVG_NS)
        expect($circle.namespaceURI).toBe(SVG_NS)
        expect($svg.getAttribute('viewBox')).toBe('0 0 100 100')
        expect($circle.getAttribute('cx')).toBe('50')
        expect($circle.getAttribute('cy')).toBe('50')
        expect($circle.getAttribute('r')).toBe('50')
        expect($circle.getAttribute('fill')).toBe('red')

        unmount()
        return delay(100).then(done)
    }
    const view = () => (
        h('div', { hook: { insert } }, [
            h.svg('svg', { id: 'svg', viewBox: '0 0 100 100' }, [
                h.svg('circle', { id: 'circle', cx: 50, cy: 50, r: 50, fill: 'red' }),
            ]),
        ])
    )

    const unmount = mount(view(), document.body)
})

test('svg with observable', async () => {
    expect.assertions(2)
    let $circle: Element | null

    const view = () => {
        const create = async (el: Element) => { $circle = el }
        const color$ = Observable.of('red').concat(Observable.of('blue').delay(50))
        return h('div', {}, [
            h.svg('svg', { id: 'svg', viewBox: '0 0 100 100' }, [
                h.svg('circle', { hook: { create }, id: 'circle', cx: 50, cy: 50, r: 50, fill: color$ }),
            ]),
        ])
    }

    const unmount = mount(view(), document.body)

    expect($circle!.getAttribute('fill')).toBe('red')
    await delay(60)
    expect($circle!.getAttribute('fill')).toBe('blue')

    unmount()
    return delay(10)
})