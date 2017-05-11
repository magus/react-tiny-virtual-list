const rAF = (
  typeof(window) === 'object'
  ? window.requestAnimationFrame
  : callback => setTimeout(callback, 1000 / 60)
);

function easeInOutQuad(t, b, c, d) {
  t /= d / 2;
  if (t < 1) return c / 2 * t * t + b;
  t--;
  return -c / 2 * (t * (t - 2) - 1) + b;
}

function linear(t, b, c, d) {
  let p = t / d;

  if (p > 1) return b + c;

  return b + (p * c);
}

export default function animateScroll(element, to, duration, timing = linear) {
  const start = element.scrollTop;
  const change = to - start;
  const animationStart = +new Date();

  let animating = true;
  let lastpos = start;

  const promise = new Promise((resolve, reject) => {
    function finish() {
      animating = false;
      resolve();
    }

    function animateScroll() {
      if (!animating) return;

      rAF(animateScroll);

      const now = +new Date();
      const val = Math.floor(timing(now - animationStart, start, change, duration));

      if (lastpos === val) return;

      lastpos = val;
      element.scrollTop = val;

      if (element.scrollTop === to) {
        finish();
      }

      if (now > animationStart + duration) {
        element.scrollTop = to;
        finish();
      }

      if (now > animationStart + duration) {
        element.scrollTop = to;
        finish();
      }
    }

    rAF(animateScroll);
  });

  return {
    info: () => ({ animating, lastpos, to }),
    then: promise.then.bind(promise),
    cancel: () => {
      animating = false;
    },
  };
};

export const animateScrollQuad = (element, to, duration) => animateScroll(element, to, duration, easeInOutQuad);
