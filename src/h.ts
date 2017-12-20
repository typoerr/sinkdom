import { flatten } from '@cotto/utils.ts'
import { VNode, VElementNode, toVNode } from './vnode'
import { Props } from './props'

export function h(type: string, props: Props = {}, ...children: any[]): VNode {
    return new VElementNode(type, props, flatten(children, toVNode))
}