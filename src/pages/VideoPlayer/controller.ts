import { Danmaku } from "./danmaku"
import HLS from 'hls.js'

interface PlayerStatus {
  canPlay: boolean;
  playing: boolean;
  videoRenderWidth: number;
  videoRenderHeight: number;
  offsetX: number;
  offsetY: number;
  upFrameTime: number;
  tick: number;
  danmakus: Set<Danmaku>;
  ctx: CanvasRenderingContext2D;
  hls?: HLS 
}

export interface VideoController {
  setSource: (url: string) => void
  stop: () => void
  play: () => void
  pause: () => void
  onResize: (newWidth: number, newHeight: number) => void
  readonly isPlaying: boolean
  readonly duration: number
  currentTime: number
  volume: number
  playbackRate: number
}

export function handleCanvas(element: HTMLCanvasElement) {
  const rect = element.getBoundingClientRect()
  const canvasSize = {width: rect.width, height: rect.height}
  element.width = canvasSize.width
  element.height = canvasSize.height
  const ctx = element.getContext('2d')
  if (!ctx) {
    return
  }
  
  const status: PlayerStatus = {
    canPlay: true,
    playing: false,
    videoRenderWidth: 0,
    videoRenderHeight: 0,
    offsetX: 0,
    offsetY: 0,
    upFrameTime: -1,
    tick: 0,
    danmakus: new Set<Danmaku>(),
    ctx,
  }
  
  const video = document.createElement('video')
  const layout = () => {
    let scale = canvasSize.height / video.videoHeight
    const renderWidth = video.videoWidth * scale
    if (renderWidth <= canvasSize.width) {
      status.videoRenderWidth = renderWidth
      status.videoRenderHeight = canvasSize.height
      status.offsetY = 0
      status.offsetX = (canvasSize.width - renderWidth) / 2
    } else {
      scale = canvasSize.width / video.videoWidth
      const renderHeight = video.videoHeight * scale
      status.videoRenderWidth = canvasSize.width
      status.videoRenderHeight = renderHeight
      status.offsetX = 0
      status.offsetY = (canvasSize.height - renderHeight) / 2
    }
  }

  video.controls = false
  // video.muted = true
  video.addEventListener('loadedmetadata', layout)
  video.addEventListener('seeking', () => {
    status.playing = false
  })

  const render = () => {
    if (!status.canPlay) {
      return
    }
    status.tick++
    const now = Date.now()
    const deltaTime = now - status.upFrameTime
    status.upFrameTime = now
    status.ctx.clearRect(0 , 0, canvasSize.width, canvasSize.height)
    status.ctx.drawImage(video, status.offsetX, status.offsetY, status.videoRenderWidth, status.videoRenderHeight)
    if (status.playing) {
      for(const danmaku of status.danmakus) {
        danmaku.doFrame(ctx, deltaTime)
      }
      status.ctx.fillStyle = "#ff0000"
      status.ctx.fillText(`${canvasSize.width.toFixed(2)}*${canvasSize.height.toFixed(2)}`, 50, 50)
    }
    requestAnimationFrame(render)
  }

  requestAnimationFrame(render)
  return {
    setSource(url: string) {
      if (status.hls) {
        status.hls.detachMedia()
        status.hls.destroy()
        status.hls = undefined
      }
      if (typeof url === 'string') {
        if (url.endsWith('.m3u8')) {
          status.hls = new HLS()
          status.hls.loadSource(url)
          status.hls.attachMedia(video)
        }
      } else {
        video.src = url
      }
    },
    stop() {
      status.canPlay = false
    },
    play() {
      video.play().then(() => {
        status.playing = true
      })
    },
    pause() {
      video.pause()
      status.playing = false
    },
    addDanmaku(text: string) {
      status.danmakus.add(new Danmaku(text, {
        set: status.danmakus,
        startX: canvasSize.width,
        offsetY: Math.floor(Math.random() * 10) * 20
      }))
    },
    onResize(newWidth: number, newHeight: number) {
      element.width = newWidth
      element.height = newHeight
      canvasSize.width = newWidth
      canvasSize.height = newHeight
      layout()
    },
    get isPlaying() {
      return status.playing
    },
    get duration() {
      return video.duration
    },
    get currentTime() {
      return video.currentTime
    },
    set currentTime(v: number) {
      video.currentTime = v
    },
    setCurrentTimePromise(time: number): Promise<void> {
      video.currentTime = time
      return new Promise((resolve) => {
        const cb = () => {
          video.removeEventListener('seeked', cb)
          resolve()
        }
        video.addEventListener('seeked', cb)
      })
    },
    get volume() {
      return video.volume
    },
    set volume(v) {
      video.volume = v
    },
    get playbackRate() {
      return video.playbackRate
    },
    set playbackRate(v) {
      video.playbackRate = v
    }
  }

}