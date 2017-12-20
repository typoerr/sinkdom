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

export function proxy(filter: Func0<boolean>, ...funcs: Func0<any>[]): Func0<void>
export function proxy<A>(filter: Func1<A, boolean>, ...funcs: Func1<A, any>[]): Func1<any, void>
export function proxy<A1, A2>(filter: Func2<A1, A2, boolean>, ...funcs: Func2<A1, A2, any>[]): Func2<any, any, void>
export function proxy<A1, A2, A3>(filter: Func3<A1, A2, A3, boolean>, ...funcs: Func3<A1, A2, A3, any>[]): Func3<any, any, any, void>
export function proxy(filter: Function, ...funcs: Function[]) {
    return function (this: any) {
        if (filter.apply(this, arguments)) {
            for (let i = 0; i < funcs.length; i++) {
                funcs[i].apply(this, arguments)
            }
        }
    }
}

export function attach<T, K extends keyof T>(key: K, creator: (value: T, ...extra: any[]) => T[K]) {
    return function (this: any, value: T, ..._extra: any[]) {
        value[key] = creator.apply(this, arguments)
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

export function createTreeWalker<T extends { children: T[] }, C = any>(...visitor: Visitor<T, C>[]): Walker<T, C> {
    return function walk(node, parent, context = undefined, director = constant(true)) {
        const children = node.children
        for (let i = 0; i < visitor.length; i++) {
            visitor[i](node, parent, context)
        }
        if (director(node, parent, context)) {
            for (let i = 0; i < children.length; i++) {
                walk(children[i], node, context, director)
            }
        }
        return node
    }
}

export function queue(scheduler: (f: Function) => void = setTimeout) {
    let funcs: Function[] = []
    return {
        enqueue,
        process,
    }

    function enqueue(f: Function) {
        funcs.push(f)
        return f
    }

    function process() {
        let list = funcs
        funcs = []
        list.forEach(scheduler)
    }
}
