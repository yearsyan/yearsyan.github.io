import { BaseCanvasComponent, ComponentProps, Size } from "./base";

export enum ImageLayoutType {
  aspectFit,
  widthFix,
  heightFix
}

export interface CanvasImageViewProps extends ComponentProps {
  source: string|Blob
  mode?: ImageLayoutType
}

export class CanvasImageView extends BaseCanvasComponent<CanvasImageViewProps> {

  image?: HTMLImageElement
  size?: Size

  onDraw(ctx: CanvasRenderingContext2D, left: number, top: number): void {
    super.onDraw(ctx, left, top)
    if (this.image && this.size) {
      ctx.drawImage(this.image, left, top, this.size.width, this.size.height)
    }
  }
  onMeasure(ctx: CanvasRenderingContext2D, parentWidth: number, parentHeight: number): Promise<Size> {
    const img = new Image()
    img.src = this.#getImageSrc()
    return new Promise((resolve) => {
      img.onload = () => {
        const {width, height} = img
        this.image = img
        const size = this.#handleSize(parentHeight, parentWidth, width, height)
        this.size = size
        resolve(size)
      }
    })
  }

  #getImageSrc() {
    if (typeof this.props.source === 'string') {
      return this.props.source
    }
    return ''
  }

  #handleSize(parentHeight: number, parentWidth: number, sourceWidth: number, sourceHeight: number): Size {
    switch (this.props.mode) {
      case ImageLayoutType.heightFix:
        const height = this.parseSize(this.props.height, parentHeight)
        return {height, width: height / sourceHeight * sourceWidth}
      case ImageLayoutType.widthFix:
        const width = this.parseSize(this.props.width, parentWidth)
        return {width, height: width / sourceWidth * sourceHeight}
      case ImageLayoutType.aspectFit:
      default:
        if (sourceWidth > sourceHeight) {
          const width = this.parseSize(this.props.width, parentWidth)
          return {width, height: width / sourceWidth * sourceHeight}
        } else {
          const height = this.parseSize(this.props.height, parentHeight)
          return {height, width: height / sourceHeight * sourceWidth}
        }
    }
  }

}