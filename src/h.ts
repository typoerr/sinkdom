import { flatten } from '@cotto/utils.ts'
import { Observable } from './observable'
import { VNode, VElementNode, toVNode, VSVGNode } from './vnode'
import { Props } from './props'

export interface VNodeFactory {
    <T extends VNode>(type: string, props?: Props, ...children: (ChildNode | T)[]): VNode,
}

export interface TagFn {
    (props: Props): VNode
    <T extends VNode>(children?: Children | (Children | T)[]): VNode
    <T extends VNode>(props: Props, children: Children | (Children | T)[]): VNode
}

export type Children = string | null | undefined | boolean | Observable<any>

export const h = (function () {
    return Object.assign(h, { svg })
    // tslint:disable:no-shadowed-variable
    function h(type: string, props: Props = {}, ...children: any[]): VNode {
        return new VElementNode(type, props, flatten(children, toVNode))
    }
    function svg(type: string, props: Props = {}, ...children: any[]): VNode {
        return new VSVGNode(type, props, flatten(children, toVNode))
    }
    // tslint:enable:no-shadowed-variable
})()

export function hh(tagName: string, factory: VNodeFactory): TagFn {
    return function tag(arg: any) {
        if (arg != null && arg.constructor === Object) {
            return factory(tagName, ...arguments)
        } else {
            return h(tagName, {}, arguments.length <= 0 ? [] : arguments[0])
        }
    }
}

/* HTMLElement */
export const a = hh('a', h)
export const abbr = hh('abbr', h)
export const acronym = hh('acronym', h)
export const address = hh('address', h)
export const applet = hh('applet', h)
export const area = hh('area', h)
export const article = hh('article', h)
export const aside = hh('aside', h)
export const audio = hh('audio', h)
export const b = hh('b', h)
export const base = hh('base', h)
export const basefont = hh('basefont', h)
export const bdi = hh('bdi', h)
export const bdo = hh('bdo', h)
export const bgsound = hh('bgsound', h)
export const big = hh('big', h)
export const blink = hh('blink', h)
export const blockquote = hh('blockquote', h)
export const body = hh('body', h)
export const br = hh('br', h)
export const button = hh('button', h)
export const canvas = hh('canvas', h)
export const caption = hh('caption', h)
export const center = hh('center', h)
export const cite = hh('cite', h)
export const code = hh('code', h)
export const col = hh('col', h)
export const colgroup = hh('colgroup', h)
export const command = hh('command', h)
export const content = hh('content', h)
export const data = hh('data', h)
export const datalist = hh('datalist', h)
export const dd = hh('dd', h)
export const del = hh('del', h)
export const details = hh('details', h)
export const dfn = hh('dfn', h)
export const dialog = hh('dialog', h)
export const dir = hh('dir', h)
export const div = hh('div', h)
export const dl = hh('dl', h)
export const dt = hh('dt', h)
export const element = hh('element', h)
export const em = hh('em', h)
export const embed = hh('embed', h)
export const fieldset = hh('fieldset', h)
export const figcaption = hh('figcaption', h)
export const figure = hh('figure', h)
export const font = hh('font', h)
export const form = hh('form', h)
export const footer = hh('footer', h)
export const frame = hh('frame', h)
export const frameset = hh('frameset', h)
export const h1 = hh('h1', h)
export const h2 = hh('h2', h)
export const h3 = hh('h3', h)
export const h4 = hh('h4', h)
export const h5 = hh('h5', h)
export const h6 = hh('h6', h)
export const head = hh('head', h)
export const header = hh('header', h)
export const hgroup = hh('hgroup', h)
export const hr = hh('hr', h)
export const html = hh('html', h)
export const i = hh('i', h)
export const iframe = hh('iframe', h)
export const img = hh('img', h)
export const input = hh('input', h)
export const ins = hh('ins', h)
export const isindex = hh('isindex', h)
export const kbd = hh('kbd', h)
export const keygen = hh('keygen', h)
export const label = hh('label', h)
export const legend = hh('legend', h)
export const li = hh('li', h)
export const link = hh('link', h)
export const listing = hh('listing', h)
export const main = hh('main', h)
export const map = hh('map', h)
export const mark = hh('mark', h)
export const marquee = hh('marquee', h)
export const math = hh('math', h)
export const menu = hh('menu', h)
export const menuitem = hh('menuitem', h)
export const meta = hh('meta', h)
export const meter = hh('meter', h)
export const multicol = hh('multicol', h)
export const nav = hh('nav', h)
export const nextid = hh('nextid', h)
export const nobr = hh('nobr', h)
export const noembed = hh('noembed', h)
export const noframes = hh('noframes', h)
export const noscript = hh('noscript', h)
export const object = hh('object', h)
export const ol = hh('ol', h)
export const optgroup = hh('optgroup', h)
export const option = hh('option', h)
export const output = hh('output', h)
export const p = hh('p', h)
export const param = hh('param', h)
export const picture = hh('picture', h)
export const plaintext = hh('plaintext', h)
export const pre = hh('pre', h)
export const progress = hh('progress', h)
export const q = hh('q', h)
export const rb = hh('rb', h)
export const rbc = hh('rbc', h)
export const rp = hh('rp', h)
export const rt = hh('rt', h)
export const rtc = hh('rtc', h)
export const ruby = hh('ruby', h)
export const s = hh('s', h)
export const samp = hh('samp', h)
export const script = hh('script', h)
export const section = hh('section', h)
export const select = hh('select', h)
export const shadow = hh('shadow', h)
export const small = hh('small', h)
export const source = hh('source', h)
export const spacer = hh('spacer', h)
export const span = hh('span', h)
export const strike = hh('strike', h)
export const strong = hh('strong', h)
export const style = hh('style', h)
export const sub = hh('sub', h)
export const summary = hh('summary', h)
export const sup = hh('sup', h)
export const slot = hh('slot', h)
export const table = hh('table', h)
export const tbody = hh('tbody', h)
export const td = hh('td', h)
export const template = hh('template', h)
export const textarea = hh('textarea', h)
export const tfoot = hh('tfoot', h)
export const th = hh('th', h)
export const time = hh('time', h)
export const title = hh('title', h)
export const tr = hh('tr', h)
export const track = hh('track', h)
export const tt = hh('tt', h)
export const u = hh('u', h)
export const ul = hh('ul', h)
export const video = hh('video', h)
export const wbr = hh('wbr', h)
export const xmp = hh('xmp', h)

/* SVGElement */
// TODO: svg tag helper...