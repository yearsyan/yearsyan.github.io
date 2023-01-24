import { BaseCanvasComponent, ComponentProps, Size } from "./base";

interface TextViewProps extends ComponentProps {
  maxLine?: number
  lineHeight?: number
  ellipsis?: boolean
  font?: string
  color?: string
}

function parseSize(value: string|number|undefined, parent: number) {
  if (!value) {
    return parent
  }
  if (typeof value === 'number') {
    return value
  }
  if(/^(\d+)(\.?)(\d*)%$/.test(value)) {
    return +value.slice(0, -1) * parent / 100
  }
  return parent
}

export class CanvasTextView extends BaseCanvasComponent<TextViewProps> {

  text: string = ""
  boundingBoxDescent: number = 0
  realLineHeight: number = 0
  drawContent: string[] = []
  constructor(props: TextViewProps, text?: string) {
    super(props)
    text && this.setText(text)
  }

  setText(text: string) {
    this.text = text
  }

  onDraw(ctx: CanvasRenderingContext2D, left: number, top: number): void {
    super.onDraw(ctx, left, top)
    ctx.fillStyle = this.props.color ?? '#000000'
    this.drawContent.forEach((text, line) => {
      ctx.fillText(text, left, top + (line + 1) * this.realLineHeight)
    })
  }
  async onMeasure(ctx: CanvasRenderingContext2D, parentWidth: number, parentHeight: number): Promise<Size> {
    const maxWidth = parseSize(this.props.width, parentWidth);
    const maxLine = this.props.maxLine ?? Infinity
    let height = 0
    let drawCount = 0
    ctx.font = this.props.font || "15pt"
    const text = this.text
    const drawContent: string[] = [""]
    const ellipsisWidth = this.props.ellipsis? (ctx.measureText('...').width) : 0


    for(let charIndex = 0, lineFirstCharIndex = 0; charIndex < text.length; charIndex++) {
      const metrics = ctx.measureText(text.slice(lineFirstCharIndex, drawCount+ 1 ))
      if (!height) {
        height = metrics.actualBoundingBoxDescent + metrics.actualBoundingBoxAscent
      }
      if (metrics.width < maxWidth || lineFirstCharIndex === charIndex) {
        drawContent[drawContent.length - 1] = drawContent[drawContent.length - 1] + text[charIndex]
        drawCount++
      } else {
        if (drawContent.length + 1> maxLine) {
          break
        }
        drawContent.push("")
        lineFirstCharIndex = charIndex
        charIndex--
      }
    }

    if (ellipsisWidth && text.length > 0) {
      const lastText = drawContent[drawContent.length - 1]
      for(let charIndex = 1; charIndex < lastText.length; charIndex++) {
        const width = ctx.measureText(lastText.slice(0, charIndex) + '...').width
        if (width > maxWidth) {
          drawContent[drawContent.length - 1] = (lastText.slice(0, charIndex - 1) + '...')
          break
        }
      }
    }

    this.drawContent = drawContent
    this.boundingBoxDescent = height
    this.realLineHeight = (this.props.lineHeight ?? 1.2) * height
    const sumHeight = this.realLineHeight * drawContent.length

    return {width: maxWidth, height: sumHeight}

  }
  
}