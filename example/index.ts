/* tslint:disable:no-console */
import { delay } from '@cotto/utils.ts'
import { Observable, Scheduler, Subject } from 'rxjs'
import { mount, div, h2, hr, ul, li, p, VNode, button, input } from '../src/index'

function now() {
    return new Date().toLocaleString()
}

function getRandomColor() {
    let letters = '0123456789ABCDEF'
    let color = '#'
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)]
    }
    return color
}

const now$ = Observable.of(now())
    .concat(Observable.timer(1000, 1000).take(10).map(now))
    .shareReplay(1)

const list$ = now$.scan((acc, n) => [...acc, n], [])
    .shareReplay(1)

const color$ = now$.map(getRandomColor)

const hook = {
    create(el: HTMLElement, vnode: VNode) {
        console.log('create: ', el, vnode, document.body.contains(el))
    },
    insert(el: HTMLElement, _vnode: VNode) {
        console.log('insert: ', document.body.contains(el))
    },
    remove(el: HTMLElement, _vnode: VNode, done: Function) {
        el.style.transition = 'all 400ms'
        el.style.color = getRandomColor()
        delay(500).then(done as any)
    },
    drop(el: HTMLElement, vnode: VNode) {
        console.log('drop: ', el, vnode)
    },
}

const click = new Subject<Event>()
click.subscribe(ev => console.log('onclick', ev))

const input$ = new Subject<Event>()
const text$ = input$.pluck<Event, string>('target', 'value')
    .debounceTime(100)

const tree = div({ class: 'root', data: { xxxId: 1 } }, [
    div({ style: { color: color$ } }, 'hello'),
    div({ hook: { create(el) { el.style.color = 'blue' } } }, [
        h2(['patch from text node']),
        now$,
    ]),
    hr(),

    div([
        h2('event listener'),
        button({ on: { click } }, 'by subject'),
        button({ on: { click: console.log.bind(console, 'onclick') } }, 'by function'),
    ]),

    div([
        h2('form'),
        input({ autoFocus: true, on: { input: input$ } }),
        div([text$]),
    ]),

    div([
        h2(['patch from element node']),
        now$.map(s => div({ hook }, s)),
    ]),
    hr(),

    div([
        h2('patch from invalid value'),
        p('expect to be render a comment node'),
        div([
            now$.map(() => div({}, null)),
        ]),
        div([
            now$.mapTo(div({}, undefined)),
        ]),
    ]),
    hr(),

    div([
        h2('static list'),
        ul([
            [1, 2, 3].map(x => li([`item-${x}`])),
        ]),
    ]),
    hr(),

    div([
        h2('keyed list'),
        ul([
            list$.switchMap(list => Observable.from(list)
                .map(s => li({ key: s }, s))
                .toArray(),
            ),
        ]),
    ]),
    hr(),

    div([
        h2('non-keyed list'),
        ul([
            list$.switchMap(list => Observable.from(list)
                .map(li)
                .toArray(),
            ),
        ]),
    ]),
    hr(),
])


mount(tree, document.body, {
    proxy: (value: Observable<any>) => value
        .distinctUntilChanged()
        .observeOn(Scheduler.animationFrame)
        .subscribeOn(Scheduler.animationFrame),
})