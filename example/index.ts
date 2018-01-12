/* tslint:disable:no-console */
import { Observable, Scheduler } from 'rxjs'
import { mount, div, VNode, span } from '../src/index'
import { makeHashGroup } from '@cotto/utils.ts'

interface Item {
    id: number,
    content: number | string
}

function model(intent: { step$: Observable<number> }) {
    const item = (id: number) => ({ id, content: id })
    const [even$, odd$] = intent.step$.partition(i => i % 2 === 0)
    return Observable.merge(
        even$.mapTo(() => [1, 2, 3].map(item)),
        odd$.mapTo(() => [1, 2, 3, 4].map(item)),
    )
}

function store<S>(patch$: Observable<(state: S) => S>, init: any) {
    return patch$.scan((state: S, fn) => fn(state), init)
        .distinctUntilChanged()
        .shareReplay(1)
}

const hook = {
    remove: (el: HTMLElement, _vnode: VNode) => (done: Function) => {
        el.style.color = 'red'
        setTimeout(done, 300)
    },
}
function listItem({ item, hash$ }: { item: Item, hash$: Observable<{ [key: string]: Item }> }) {
    const id = String(item.id)
    const content$ = hash$.pluck(id, 'content').filter(Boolean)
    return div({ key: id, hook }, [
        span(id + ': '),
        span(content$),
    ])
}

function view(items: Observable<Item[]>) {
    const hash$ = items.map(x => makeHashGroup(x, 'id')).shareReplay(1)
    const _listItem = (item: Item) => listItem({ item, hash$ })

    return div([
        items.switchMap(list => Observable.from(list)
            .observeOn(Scheduler.async)
            .map(_listItem)
            .toArray(),
        ),
    ])
}

const step$ = Observable.timer(0, 1000).take(10).shareReplay(1)
const reducer$ = model({ step$ })
const state$ = store(reducer$, [])
const tree = view(state$)

const proxy = (value: Observable<any>) => value
    .distinctUntilChanged()
    .observeOn(Scheduler.animationFrame)
    .subscribeOn(Scheduler.animationFrame)

mount(tree, document.body, { proxy })
state$.subscribe(console.log)
