export interface ComponentProps {
  width?: number | string
  height?: number | string
  borderRadius?: number
  backgroundColor?: string
  overflow?: 'visible' | 'hidden'
  direction?: LayoutDirection
}

export interface ContainerViewProps extends ComponentProps {
  align?: Align
  widthMode?: LayoutModle
  heightMode?: LayoutModle
}

export enum Align {
  start,
  end,
  center
}

export interface Size {
  width: number
  height: number
}

interface ViewOffset {
  left: number
  top: number
}

export enum LayoutModle {
  WrapContent,
  MatchParent,
  Specific
}

export enum LayoutDirection {
  V, H
}

function getLayoutOffset(align: Align, childSize: number, containerSize: number) {
  switch (align) {
    case Align.start:
      return 0
    case Align.end:
      return containerSize - childSize
    case Align.center:
      return (containerSize - childSize) / 2
  }
}

export abstract class ViewRoot {
  root?: BaseCanvasComponent<ComponentProps>
  dirtyNode: BaseCanvasComponent<ComponentProps>[] = []
  ctx: CanvasRenderingContext2D

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
  }

  onNewFrame() {
    if (!this.root) {
      return
    }
    while(this.dirtyNode.length > 0) {
      const node = this.dirtyNode.pop()
      if (node?.isDirty) {
        node.onPartDraw(this.ctx)
      }
    }
  }

  attachRoot(root: BaseCanvasComponent<ComponentProps>) {
    this.root = root
  }

}

export abstract class BaseCanvasComponent<P extends ComponentProps> {

  props: P
  isDirty: boolean = false
  parent?: BaseCanvasComponent<ComponentProps>
  lastDrawData = {left: 0, top: 0}

  constructor(props: P) {
    this.props = props
  }

  onDraw(ctx: CanvasRenderingContext2D, left: number, top: number): void {
    this.isDirty = false
    this.lastDrawData = {left, top}
  }

  onPartDraw(ctx: CanvasRenderingContext2D) {
    this.onDraw(ctx, this.lastDrawData.left, this.lastDrawData.top)
  }

  abstract onMeasure(ctx: CanvasRenderingContext2D, parentWidth: number, parentHeight: number): Promise<Size>

  doPath(ctx: CanvasRenderingContext2D, left: number, top: number, width: number, height: number) {
    const borderRadius = this.props.borderRadius ?? 0
    ctx.moveTo(left, top + borderRadius)
    ctx.arcTo(left, top, left + borderRadius, top, borderRadius)
    ctx.lineTo(left + width - borderRadius, top)
    ctx.arcTo(left + width, top, left + width, top + borderRadius, borderRadius)
    ctx.lineTo(left + width, top + height - borderRadius)
    ctx.arcTo(left + width, top + height, left + width - borderRadius, top + height, borderRadius)
    ctx.lineTo(left + borderRadius, top + height)
    ctx.arcTo(left, top + height, left, top + height - borderRadius, borderRadius)
    ctx.lineTo(left, top + borderRadius)
    ctx.closePath()
  }

  onDetach() { }
  onChildrenDirty(child: BaseCanvasComponent<ComponentProps>) { }

  parseSize(value: string | number | undefined, parent: number) {
    if (!value) {
      return parent
    }
    if (typeof value === 'number') {
      return value
    }
    if (/^(\d+)(\.?)(\d*)%$/.test(value)) {
      return +value.slice(0, -1) * parent / 100
    }
    return parent
  }

  markDirty() {
    this.isDirty = true
    this.parent?.onChildrenDirty(this)
  }

}


export class CanvasContainerView extends BaseCanvasComponent<ContainerViewProps> {

  children: BaseCanvasComponent<ComponentProps>[]
  widthLayoutModle: LayoutModle = LayoutModle.MatchParent
  heightLayoutModle: LayoutModle = LayoutModle.MatchParent
  lastMeasureSize?: Size
  layoutDirection: LayoutDirection = LayoutDirection.V
  childOffset: ViewOffset[] = []

  constructor(props: ContainerViewProps) {
    super(props)
    this.children = []
    this.layoutDirection = props.direction ?? LayoutDirection.V
    this.widthLayoutModle = props.widthMode ?? this.props.width === undefined ? LayoutModle.MatchParent : LayoutModle.Specific
    this.heightLayoutModle = props.heightMode ?? this.props.height === undefined ? LayoutModle.MatchParent : LayoutModle.Specific
  }

  add(child: BaseCanvasComponent<ComponentProps>) {
    this.children.push(child)
  }

  onDraw(ctx: CanvasRenderingContext2D, left: number, top: number): void {
    super.onDraw(ctx, left, top)
    if (this.lastMeasureSize === undefined) {
      throw new Error("on measure")
    }
    ctx.save()
    const { width, height } = this.lastMeasureSize
    const borderRadius = this.props.borderRadius ?? 0
    if (this.props.backgroundColor) {
      ctx.fillStyle = this.props.backgroundColor
      if (borderRadius) {
        ctx.beginPath()
        this.doPath(ctx, left, top, width, height)
        ctx.fill()
      } else {
        ctx.fillRect(left, top, this.lastMeasureSize.width, this.lastMeasureSize.height)
      }
    }

    if (this.props.overflow === 'hidden') {
      ctx.beginPath()
      this.doPath(ctx, left, top, width, height)
      ctx.clip()
    }

    this.children.forEach((child, index) => {
      const offsetInfo = this.childOffset[index]
      child.onDraw(ctx, left + offsetInfo.left, top + offsetInfo.top)
    })
    ctx.restore()
  }

  async onMeasure(ctx: CanvasRenderingContext2D, parentWidth: number, parentHeight: number) {
    const res: Size = { width: parentHeight, height: parentHeight }
    if (this.widthLayoutModle === LayoutModle.Specific && this.props.width !== undefined) {
      if (typeof this.props.width === 'number') {
        res.width = this.props.width
      } else if (typeof this.props.width === 'string' && /^(\d+)(\.?)(\d*)%$/.test(this.props.width)) {
        res.width = (+this.props.width.slice(0, -1)) * parentWidth / 100
      }
    }

    if (this.heightLayoutModle === LayoutModle.Specific && this.props.height !== undefined) {
      if (typeof this.props.height === 'number') {
        res.height = this.props.height
      } else if (typeof this.props.height === 'string' && /^(\d+)(\.?)(\d*)%$/.test(this.props.height)) {
        res.height = (+this.props.height.slice(0, -1)) * parentHeight / 100
      }
    }

    const offset: ViewOffset[] = []
    let lastOffset = 0
    const childrenSize = (await Promise.all(this.children.map(child => child.onMeasure(ctx, res.width, res.height)))).reduce((curr, size) => {
      if (this.layoutDirection === LayoutDirection.V) {
        curr.height += size.height
        if (curr.width < size.width) {
          curr.width = size.width
        }
        offset.push({
          top: lastOffset,
          left: getLayoutOffset(this.props.align ?? Align.start, size.width, res.width)
        })
        lastOffset += size.height
      } else {
        curr.width += size.width
        if (curr.height < size.height) {
          curr.height = size.height
        }
        offset.push({
          top: getLayoutOffset(this.props.align ?? Align.start, size.height, res.height),
          left: lastOffset
        })
        lastOffset += size.width
      }
      return curr
    }, { width: 0, height: 0 })
    this.childOffset = offset

    if (this.widthLayoutModle === LayoutModle.WrapContent) {
      res.width = childrenSize.width
    }

    if (this.heightLayoutModle === LayoutModle.WrapContent) {
      res.height = childrenSize.height
    }

    this.lastMeasureSize = res
    return res
  }

  onChildrenDirty(child: BaseCanvasComponent<ComponentProps>): void {

  }

}