import { Observable } from 'rxjs'
import { mount, span, li, ul } from '../src/index'

interface Item {
    id: number
    content: string
}

function ListItem({ id, content }: Item) {
    // you can use props.key for efficient list rendering
    return li({ key: `${id}` }, [
        span(`id: ${id} - `),
        span(content),
    ])
}

function view(list$: Observable<Item[]>) {
    return ul([
        list$.switchMap(list => Observable.from(list)
            .map(ListItem)
            .toArray(),
        ),
    ])
}

function createItem(n: number) {
    return { id: n, content: `content ${n}` }
}

const step$ = Observable.timer(0, 1000).take(11).shareReplay(1)

const items$ = step$.map(createItem)
    .scan((list, item) => [...list, item], [])
    .shareReplay(1)

mount(view(items$), document.body)
