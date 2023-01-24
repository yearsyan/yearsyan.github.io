import { useEffect, useRef, useState } from 'react'
import { handleCanvas, VideoController } from './controller';
import ControlPannel from './ControlPannel';
import './index.css'
import { nextNFrame } from './utils';

export default function VideoPlayer() {
  const videoCanvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const [controller, setController] = useState<VideoController|null>(null);
  useEffect(() => {
    if (videoCanvasRef.current && playerRef.current) {
      const handler = handleCanvas(videoCanvasRef.current)
      if (handler) {

        const resizeListener = () => {
          console.log('resize')
          if (!playerRef.current) {
            return
          }
          const {width, height} = playerRef.current.getBoundingClientRect()
          handler.onResize(width, height)
        }
        playerRef.current.addEventListener('resize', resizeListener)
        playerRef.current.addEventListener('fullscreenchange', nextNFrame(resizeListener, 2))

        setController(handler)
        let i = 0
        const timer = setInterval(() => {
          handler.addDanmaku('asasd' + (i++))
        }, 1200)
        return () => {
          clearInterval(timer)
          handler.stop()
        }
      }
    }
  }, [])

  return <div className='player-root' ref={playerRef}>
    <canvas className='player-canvas' ref={videoCanvasRef} />
    {controller && <ControlPannel controller={controller} fullscreen={() => {
      if (playerRef.current) {
        playerRef.current.requestFullscreen().then(() => {
          // requestAnimationFrame(() => {
          //   if (!playerRef.current) {
          //     return
          //   }
          //   const {width, height} = playerRef.current.getBoundingClientRect()
          //   controller.onResize(width, height)
          // })
        })
      }
    }}/>}
  </div>
}