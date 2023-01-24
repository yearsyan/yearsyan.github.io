export type DanmakuCollection = Set<Danmaku>

interface DanmakuOptions {
  startX: number
  offsetY: number
  speed?: number // pixel/ms
  set?: DanmakuCollection
  fillStyle?: string
}

export class Danmaku {
  text: string
  speed: number = 0
  offsetY = 0
  offsetX = 0
  set?: DanmakuCollection
  textWidth?: number
  options?: DanmakuOptions
  constructor(s: string, options?: DanmakuOptions) {
    this.text = s
    this.set = options?.set
    this.speed = options?.speed ?? 0.5
    this.options = options
    this.offsetY = options?.offsetY ?? 0
    this.offsetX = options?.startX ?? 0
  }

  doFrame(ctx: CanvasRenderingContext2D, delta: number) {
    if (this.textWidth === undefined) {
      this.textWidth = ctx.measureText(this.text).width
    }
    ctx.font = "29px serif"
    ctx.fillStyle = this.options?.fillStyle ?? '#ffff00' 
    ctx.fillText(this.text, this.offsetX, this.offsetY)
    this.offsetX -= this.speed * delta
    if (this.offsetX < -(this.textWidth)) {
      this.#playDone()
    }
  }

  #playDone() {
    if (this.set) {
      this.set.delete(this)
    }
  }
}