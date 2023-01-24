import { useEffect, useRef, useState } from "react";
import { Align, BaseCanvasComponent, CanvasContainerView, ComponentProps, LayoutDirection } from "./components/base";
import { CanvasImageView } from "./components/image";
import { CanvasTextView } from "./components/text";

class RenderState {

  width: number
  height: number
  centerX: number
  centerY: number
  element: HTMLCanvasElement
  renderCtx: CanvasRenderingContext2D

  root?: BaseCanvasComponent<ComponentProps>

  constructor(ctx: CanvasRenderingContext2D, element: HTMLCanvasElement) {

    const { width, height} = element.getBoundingClientRect();
    this.width = width
    this.height = height

    this.centerX = 0
    this.centerY = 0
    this.element = element
    this.renderCtx = ctx
    this.#initEvent()

    const root = new CanvasContainerView({
      width: width * 0.8,
      height: height,
      backgroundColor: '#f0f0f0',
      align: Align.center
    })
    root.add(new CanvasContainerView({
      width: '50%',
      height: '40%',
      backgroundColor: '#ffffff'
    }))
    const container = new CanvasContainerView({
      width: '25%',
      height: '45%',
      borderRadius: 15,
      backgroundColor: '#ff00ff',
      overflow: 'hidden',
      align: Align.center,
      direction: LayoutDirection.V
    })
    container.add(new CanvasImageView({
      width: '100%',
      source: 'https://pic2.zhimg.com/80/v2-877dd8180e16ed1ec0c6b253d07f388d_720w.webp'
    }))
    root.add(container)
    root.add(new CanvasTextView({
      font: '24pt Verdana',
      color: '#ff80a0',
      width: '60%'
    }, "  233333ASDASdasfewrewfddsfsdfdsfweqweqweqw111111111111111111111111111111111111111111111"))
    root.onMeasure(ctx, width, height).then(() => this.root = root)


  }

  #initEvent() {
    this.element.addEventListener('mousemove', ev => {
      this.centerX = ev.clientX
      this.centerY = ev.clientY
    })
  }

  drawFrame() {
    const ctx = this.renderCtx
    ctx.clearRect(0, 0, this.width, this.height)
    if (this.root) {
      this.root.onDraw(ctx, 0, 0)
    }
    ctx.beginPath()
    ctx.arc(this.centerX, this.centerY, 40, 0, 360)
    ctx.stroke()
  }


}


function handleCanvas(ctx: CanvasRenderingContext2D, element: HTMLCanvasElement) {
  const { width, height} = element.getBoundingClientRect();
  console.log(width, height)
  const state = new RenderState(ctx, element)
  const frameCb = () => {
    state.drawFrame()
    requestAnimationFrame(frameCb)
  }
  requestAnimationFrame(frameCb)
}

export function CanvasPlayground(props: {height: number; width: number}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const divRef = useRef<HTMLDivElement>(null)
  const [showCanvas, setShowCanvas] = useState(false);

  useEffect(() => {
    if (divRef.current && !showCanvas) {
      setShowCanvas(true)
    }
  }, [showCanvas])

  useEffect(() => {
    if (ref.current && showCanvas) {
      const ctx = ref.current.getContext('2d');
      ctx && handleCanvas(ctx, ref.current);
    }
  }, [showCanvas])
  return <div ref={divRef} style={{
    width: '100%', 
    height: '100%', 
    margin: 0, 
    padding: 0, 
    overflow: 'hidden',
    position: 'relative',
  }}>
    {showCanvas && <canvas 
      style={{margin: 0, padding: 0}}
      ref={ref} 
      width={divRef.current?.getBoundingClientRect().width} 
      height={divRef.current?.getBoundingClientRect().height} />} 
  </div>
}