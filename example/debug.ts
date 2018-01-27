import { Observable, Scheduler, Subject } from 'rxjs'
import { mount, div, button } from '../src/index'

const action = new Subject<Event>()

const store = (intent: Observable<any>) => {
    return intent.startWith(true).scan<boolean>(a => !a, true)
        .shareReplay(1)
        .distinctUntilChanged()
}


const view = (state$: Observable<boolean>) => {
    const testTree$ = Observable.merge(
        state$.filter(bool => bool === true).map(_ =>
            div({ data: { root: 'a' } }, [
                div([
                    div('Root - A'),
                    div(state$.map(x => `${x}`)),
                ]),
            ]),
        ),
        state$.filter(bool => bool === false).map(_ =>
            div({ data: { root: 'b' } }, [
                div([
                    div('Root - B'),
                    div(state$.map(x => `${x}`)),
                ]),
            ]),
        ),
    )

    return (
        div([
            div([testTree$]),
            div({}, [
                button({ on: { click: action } }, 'toggle'),
            ]),

        ])
    )
}

const tree = view(store(action))

const option = {
    proxy: (src$: Observable<any>) => src$.distinctUntilChanged()
        .observeOn(Scheduler.async)
        .subscribeOn(Scheduler.async),
}

mount(tree, document.body, option)