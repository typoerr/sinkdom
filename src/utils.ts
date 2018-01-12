import { Func0, Func1, Func2, Func3, constant } from '@cotto/utils.ts'

export const defer: <R>(f: Func0<R>) => Promise<R> = Promise.resolve()
    .then.bind(Promise.resolve())

export function toKebabCase(s: string) {
    return s.replace(/[A-Z]/g, _tokebabe)
}
function _tokebabe(s: string, offset: number) {
    s = s.toLowerCase()
    return offset <= 0 ? s : '-' + s
}

export function invokeCallback(..._args: any[]) {
    let i = arguments.length
    while (i--) {
        if (typeof arguments[i] === 'function') {
            arguments[i]()
        }
    }
}

export function proxy(filter: Func0<boolean>): (...funcs: Func0<any>[]) => Func0<void>
export function proxy<A1>(filter: Func1<A1, boolean>): (...funcs: Func1<A1, any>[]) => Func1<any, void>
export function proxy<A1, A2>(filter: Func2<A1, A2, boolean>): (...funcs: Func2<A1, A2, any>[]) => Func2<any, any, void>
export function proxy<A1, A2, A3>(filter: Func3<A1, A2, A3, boolean>): (...funcs: Func3<A1, A2, A3, any>[]) => Func3<any, any, any, void>
export function proxy(filter: Function) {
    return (...funcs: Function[]) => function (this: any) {
        if (filter.apply(this, arguments)) {
            for (let i = 0; i < funcs.length; i++) {
                funcs[i].apply(this, arguments)
            }
        }
    }
}

export function cond(...pairs: [Function, Function][]): (a: any, b?: any, c?: any) => any {
    return function invoke(this: any) {
        for (const pair of pairs) {
            if (pair[0].apply(this, arguments)) {
                return pair[1].apply(this, arguments)
            }
        }
    }
}
export namespace cond {
    export interface Pred<T> {
        (value: any, ...args: any[]): value is T
    }
    export interface Task<T> {
        (value: T, ...args: any[]): void
    }
    export function when<T>(pred: Pred<T>, task: Task<T>): [Pred<T>, Task<T>] {
        return [pred, task]
    }
}

export function attach<T, K extends keyof T>(key: K, creator: (value: T, a?: any, b?: any) => T[K]) {
    return function (this: any, value: T, ..._extra: any[]) {
        value[key] = creator.apply(this, arguments)
        return value
    }
}

export interface Visitor<T, C = any, R = any> {
    (node: T, parent: T | null, context?: C): R
}
export interface Director<T, C> extends Visitor<T, C, boolean> {
    /*  */
}
export interface Walker<T, C = any> {
    (node: T, parent: T | null, context?: C, director?: Director<T, C>): T
}
export interface Node<T> {
    children: T[]
}
export function createTreeWalker<T extends Node<T>, C = any>(...visitor: Visitor<T, C>[]): Walker<T, C> {
    const len = visitor.length
    const _director = constant(true)
    return function walk(node, parent, context = undefined, director = _director) {
        const ch = node.children
        for (let i = 0; i < len; i++) {
            visitor[i](node, parent, context)
            if (director(node, parent, context)) {
                for (let j = 0; j < ch.length; j++) {
                    walk(ch[j], node, context, director)
                }
            }
        }
        return node
    }
}

export function queue(scheduler: (f: Function) => void = setTimeout) {
    let funcs: Function[] = []
    return { enqueue, process }
    function enqueue(f: Function) {
        funcs.push(f)
        return f
    }
    function process(done?: Function) {
        let list = done ? [...funcs, done] : funcs
        funcs = []
        list.forEach(scheduler)
    }
}

export function html(strings: TemplateStringsArray, ...values: any[]) {
    return strings.raw.reduce((acc, s, i) => {
        let value = values[i - 1]
        if (Array.isArray(values[i - 1])) {
            value = value.join('')
        }
        return acc + value + s
    }).replace(/(\s{2,})|(\n)/g, '')
}
