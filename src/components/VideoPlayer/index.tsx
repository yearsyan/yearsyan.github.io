import { useEffect, useRef, useState } from 'react'
import { handleCanvas, VideoController } from './controller';
import ControlPannel from './ControlPannel';
import './index.css'
import { nextNFrame } from './utils';

export interface PlayerProps {
  sourceList: Array<{url: string, name: string}>
}

export default function VideoPlayer(props: PlayerProps) {
  const videoCanvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const [controller, setController] = useState<VideoController|null>(null);
  useEffect(() => {
    if (videoCanvasRef.current && playerRef.current) {
      const handler = handleCanvas(videoCanvasRef.current)
      if (handler) {
        const resizeListener = nextNFrame(() => {
          console.log('resize')
          if (!playerRef.current) {
            return
          }
          const {width, height} = playerRef.current.getBoundingClientRect()
          handler.onResize(width, height)
        }, 2)
        playerRef.current.addEventListener('resize', resizeListener)
        playerRef.current.addEventListener('fullscreenchange', resizeListener)
        window.addEventListener('resize', resizeListener)
        const playerDom = playerRef.current

        setController(handler)
        let i = 0
        const timer = setInterval(() => {
          handler.addDanmaku('asasd' + (i++))
        }, 1200)
        return () => {
          clearInterval(timer)
          handler.stop()
          window.removeEventListener('resize', resizeListener)
          playerDom.removeEventListener('resize', resizeListener)
          playerDom.removeEventListener('fullscreenchange', resizeListener)
        }
      }
    }
  }, [])

  useEffect(() => {
    if (controller && Array.isArray(props.sourceList) && props.sourceList.length > 0) {
      controller.setSource(props.sourceList[0].url)
    }
  }, [props.sourceList, controller])

  return <div className='player-root' ref={playerRef}>
    <canvas className='player-canvas' ref={videoCanvasRef} />
    {controller && <ControlPannel controller={controller} fullscreen={() => {
      if (playerRef.current) {
        playerRef.current.requestFullscreen().then(() => {
        })
      }
    }}/>}
  </div>
}