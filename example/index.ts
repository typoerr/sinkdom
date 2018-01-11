/* tslint:disable:no-console */
import { Observable, Scheduler } from 'rxjs'
import { mount, div, VNode } from '../src/index'

const idx$ = Observable.timer(0, 2000)
    .take(5)
    .shareReplay(1)

const hook = {
    remove: (el: HTMLElement, _vnode: VNode) => (done: Function) => {
        el.style.color = 'red'
        setTimeout(done, 1000)
    },
}

function view(items: Observable<number[]>) {
    return div([
        items.switchMap(x => Observable.from(x)
            .observeOn(Scheduler.async)
            .map(String)
            .map(item => div({ key: String(item), hook }, item))
            .toArray(),
        ),
    ])
}

const tree = view(idx$.map(n => n % 2 === 0 ? [1, 2, 3] : [1, 2, 3, 4]))

mount(tree, document.body, {
    proxy: (value: Observable<any>) => value
        .distinctUntilChanged()
        .observeOn(Scheduler.async)
        .subscribeOn(Scheduler.async),
})
