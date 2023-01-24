import { useEffect, useRef, useState } from "react";
import { VideoController } from "./controller";
import './ControlPannel.css'
import play from './assets/play.svg'
import pause from './assets/pause.svg'

function ProcessBar(props: {
  getPercent: () => number
  getDuration: () => number
  setCurrent: (t: number) => void
  traggingPercent?: number
}) {

  const [currentPercent, setCurrentPercent] = useState(0)
  const [showIndicator, setShowIndicator] = useState(false)
  const [indicatorOffset, setIndicatorOffset] = useState(0)

  useEffect(() => {
    let handler = 0
    let continueUpdate = true
    const updateFunc = () => {
      if (!continueUpdate) {
        return
      }
      handler = requestAnimationFrame(updateFunc)
      const newPercent = props.getPercent()
      if (Math.abs(newPercent - currentPercent) > 0.0001) {
        setCurrentPercent(newPercent)
      }
    }
    handler = requestAnimationFrame(updateFunc)

    return () => {
      cancelAnimationFrame(handler)
      continueUpdate = false
    }

  }, [currentPercent, props])

  return <div className="process-bar-root">
    <div className="process-bar-current" style={{ transform: `scaleX(${props.traggingPercent ?? currentPercent})` }}></div>
    <div className="indicator-container"
      onClick={(e) => {
        const width = e.currentTarget.getBoundingClientRect().width
        const { offsetX } = e.nativeEvent
        const time = props.getDuration() * (offsetX / width)
        props.setCurrent(time)
      }}
      onMouseLeave={() => {
        setShowIndicator(false)
      }}
      onMouseMove={e => {
        !showIndicator && setShowIndicator(true)
        const offset = e.nativeEvent.offsetX
        setIndicatorOffset(offset)
      }}>
      <div className="process-indicator" style={{ opacity: showIndicator ? 1 : 0, transform: `translateX(${indicatorOffset}px)` }} />
    </div>
  </div>
}

function ControlButtons(props: { controller: VideoController, fullscreen: () => void }) {
  const [playing, setPlaying] = useState(false)
  return <div className="controller-buttons">
    <div className="play-status">
      <img
        className="play-button"
        src={playing ? pause : play}
        alt={playing ? 'pause' : 'play'}
        onClick={() => {
          playing ? props.controller.pause() : props.controller.play()
          setPlaying(!playing)
        }} />
    </div>
    <div onClick={() => props.fullscreen()}>fullscreen</div>
  </div>
}

enum MaskPointerStatus {
  NONE,
  TOUCH_DOWN,
  TOUCH_RIGHT_V_MOVING,
  TOUCH_LEFT_V_MOVING,
  TOUCH_H_MOVING,
  UP
}

export default function ControlPannel(props: {
  controller: VideoController,
  fullscreen: () => void
}) {

  const [showControlBar, setShowControlBar] = useState(false)
  const [draggingPercent, setDraggingPercent] = useState<number | undefined>();
  const [pointerStatus, setPointerStatus] = useState<MaskPointerStatus>(MaskPointerStatus.NONE)
  const showControlBarTimer = useRef<number | null>(null)
  const showVolumeTimer = useRef<number | null>(null)
  const lastPointer = useRef<{ x: number, y: number } | undefined>()
  const [volumn, setVolumn] = useState<number | undefined>()

  const showControlBarTemp = () => {
    if (typeof showControlBarTimer.current === 'number') {
      clearTimeout(showControlBarTimer.current)
    }
    setShowControlBar(true)
    showControlBarTimer.current = window.setTimeout(() => setShowControlBar(false), 2000)
  }

  return <div className="controller-root">
    {volumn !== undefined && <div className="volumn-status" >
      <div className="volumn-status-child">
        <div className="volumn-value" style={{transform: `scaleX(${volumn})`}}/>
      </div>
    </div>}
    <div className="controller-mask"
      onPointerDown={e => {
        if (e.pointerType === 'touch' || e.pointerType === 'pen') {
          showControlBarTemp()
          lastPointer.current = { x: e.clientX, y: e.clientY }
          setPointerStatus(MaskPointerStatus.TOUCH_DOWN)
        }
      }}
      onTouchMove={e => {
        showControlBarTemp()
        if (!lastPointer.current) {
          return
        }
        const touch = e.touches.item(0)
        const deltaX = touch.clientX - lastPointer.current.x
        const deltaY = touch.clientY - lastPointer.current.y
        lastPointer.current = { x: touch.clientX, y: touch.clientY }
        if (pointerStatus === MaskPointerStatus.TOUCH_DOWN && e.touches.length === 1) {

          if (Math.abs(deltaX) < Math.abs(deltaY)) {
            const isLeft = touch.clientX < e.currentTarget.getBoundingClientRect().width / 2
            setPointerStatus(isLeft ? MaskPointerStatus.TOUCH_LEFT_V_MOVING : MaskPointerStatus.TOUCH_RIGHT_V_MOVING)
          } else {
            setDraggingPercent(props.controller.currentTime / props.controller.duration)
            setPointerStatus(MaskPointerStatus.TOUCH_H_MOVING)
            showControlBarTimer.current = window.setTimeout(() => setShowControlBar(false), 2000)
          }
        } else if (pointerStatus === MaskPointerStatus.TOUCH_LEFT_V_MOVING) {
          // noting to do
        } else if (pointerStatus === MaskPointerStatus.TOUCH_RIGHT_V_MOVING) {
          if (typeof showVolumeTimer.current === 'number') {
            clearTimeout(showVolumeTimer.current)
          }
          let newVolume = Math.min(props.controller.volume + 0.03 * (-deltaY), 1)
          newVolume =  Math.max(newVolume, 0)
          props.controller.volume = newVolume
          setVolumn(newVolume)
          showVolumeTimer.current = window.setTimeout(() => setVolumn(undefined), 300)
        } else if (pointerStatus === MaskPointerStatus.TOUCH_H_MOVING) {
          if (typeof draggingPercent === 'number') {
            setDraggingPercent(draggingPercent + 0.003 * deltaX)
          }
        }
      }}
      onTouchEnd={() => {
        if (typeof draggingPercent === 'number') {
          props.controller.currentTime = draggingPercent * props.controller.duration
          setDraggingPercent(undefined)
          setPointerStatus(MaskPointerStatus.NONE)
        }
      }}
      onPointerUp={() => {

      }} />
    <div className="controller-bottom-bar" style={{ display: showControlBar ? 'flex' : 'none' }}>
      <ProcessBar
        traggingPercent={draggingPercent}
        getDuration={() => props.controller.duration}
        getPercent={() => props.controller.currentTime / props.controller.duration}
        setCurrent={num => props.controller.currentTime = num} />
      <ControlButtons controller={props.controller} fullscreen={props.fullscreen} />
    </div>
  </div>
}