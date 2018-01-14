import { Observable, Scheduler, Subject } from 'rxjs'
import { mount, div, ul, li, h1, h2, button, span } from '../src/index'

const shallowEq = require('shallowequal')

function colorGen() {
    let letters = '0123456789ABCDEF'
    let color = '#'
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)]
    }
    return color
}

function store<S>(patch$: Observable<(state: S) => S>, init: S) {
    // tslint:disable:no-shadowed-variable
    return patch$.scan((state: S, fn) => fn(state), init)
        .distinctUntilChanged(shallowEq)
        .shareReplay(1)
    // tslint:eable:no-shadowed-variable
}

interface State {
    count: number
}

function model(intent: {
    increment$: Observable<number>,
    decrement$: Observable<number>,
}) {
    return Observable.merge(
        intent.increment$.map(n => (s: State) => ({ count: s.count + n })),
        intent.decrement$.map(n => (s: State) => ({ count: s.count - n })),
    ).startWith(() => ({ count: 0 }))
}

function view(state$ = state, action = actions) {
    // tslint:disable:no-console
    const hook = {
        cerate: (el: HTMLElement) => {
            console.log('create', el)
        },
        insert: (el: HTMLElement) => {
            console.log('insert', el)
        },
        remove: (el: HTMLElement) => (done: Function) => {
            console.log('remove', el)
            /* awsome animation */
            done()
        },
        drop: (el: HTMLElement) => {
            console.log('drop', el)
        },
    }

    const count$ = state$.map(x => x.count).shareReplay(1)
    const color$ = count$.map(colorGen).shareReplay(1)
    const clickCount = (src$: Observable<any>) => src$.scan(acc => acc + 1, 0).startWith(0)

    // attributes and observable dataset
    return div({ id: 'couter', class: 'counter', data: { count: count$ } }, [
        div({ class: 'count' }, [
            // props.style
            h1({ style: { fontSize: '50px', color: color$ } }, [
                // observable node and props.hook
                count$.map(count => span({ hook }, count + '')),
            ]),
        ]),

        div({ class: 'opration' }, [
            /* event handler from subject */
            button({ on: { click: action.increment$ }, style: { fontSize: '15px' } }, [
                // observable text
                action.increment$.let(clickCount).map(i => `incremnet (${i})`),
            ]),
            /* event handler from listener function */
            button({ on: { click: ev => action.decrement$.next(ev) }, style: { fontSize: '15px' } }, [
                // observable text
                action.decrement$.let(clickCount).map(i => `decrement (${i})`),
            ]),
        ]),
    ])
}


const option = {
    proxy: (src$: Observable<any>) => src$.distinctUntilChanged()
        .observeOn(Scheduler.async)
        .subscribeOn(Scheduler.async),
}

const actions = {
    increment$: new Subject<Event>(),
    decrement$: new Subject<Event>(),
}

const counter$ = model({
    increment$: actions.increment$.mapTo(1),
    decrement$: actions.decrement$.mapTo(1),
})

const state = store(counter$, { count: 0 })

mount(view(state, actions), document.body, option)
