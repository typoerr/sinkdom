import { Observable } from 'rxjs'
import { mount, div, h } from '../src/index'

function colorGen() {
    let letters = '0123456789ABCDEF'
    let color = '#'
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)]
    }
    return color
}

const view = (color$: Observable<string>) => (
    div([
        h.svg('svg', { id: 'bar', viewBox: '0 0 100 100' }, [
            h.svg('circle', { id: 'circle', cx: 50, cy: 50, r: 50, fill: color$ }),
        ]),
    ])
)

const step$ = Observable.of(0)
    .concat(Observable.timer(1000, 1000).take(1000))
    .shareReplay(1)

mount(view(step$.map(colorGen)), document.body)

