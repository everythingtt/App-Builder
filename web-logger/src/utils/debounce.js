export function debounce(fn, delay) {
  let timer = null;

  function debounced(...args) {
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delay);
  }

  debounced.cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  debounced.flush = () => {
    if (timer !== null) {
      clearTimeout(timer);
      fn();
      timer = null;
    }
  };

  return debounced;
}
