export function throttle(fn, limit) {
  let inThrottle = false;
  let lastArgs = null;

  function throttled(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs !== null) {
          throttled.apply(this, lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  }

  throttled.cancel = () => {
    inThrottle = false;
    lastArgs = null;
  };

  return throttled;
}
