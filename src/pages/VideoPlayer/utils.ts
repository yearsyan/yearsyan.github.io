export function requestAnimationFrameTimes(cb: FrameRequestCallback, times: number) {
  let t = 1
  if (times <= 0) {
    cb(-1)
    return
  }
  const realCb = (v: number) => {
    if (t === times) {
      cb(v)
    } else {
      requestAnimationFrame(realCb)
    }
    t++
  }
  requestAnimationFrame(realCb)
}

export function nextFrame(cb: FrameRequestCallback) {
  return () => {
    requestAnimationFrame(cb)
  }
}

export function nextNFrame(cb: FrameRequestCallback, t: number) {
  return () => {
    requestAnimationFrameTimes(cb, t)
  }
}