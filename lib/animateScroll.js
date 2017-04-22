'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = animateScroll;
var rAF = (typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object' ? window.requestAnimationFrame : function (callback) {
  return setTimeout(callback, 1000 / 60);
};

function easeInOutQuad(t, b, c, d) {
  t /= d / 2;
  if (t < 1) return c / 2 * t * t + b;
  t--;
  return -c / 2 * (t * (t - 2) - 1) + b;
}

function linear(t, b, c, d) {
  var p = t / d;

  if (p > 1) return b + c;

  return b + p * c;
}

function animateScroll(element, to, duration) {
  var timing = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : linear;

  var start = element.scrollTop;
  var change = to - start;
  var animationStart = +new Date();

  var animating = true;
  var lastpos = start;

  var promise = new Promise(function (resolve, reject) {
    function finish() {
      animating = false;
      resolve();
    }

    function animateScroll() {
      if (!animating) return;

      rAF(animateScroll);

      var now = +new Date();
      var val = Math.floor(timing(now - animationStart, start, change, duration));

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
    info: function info() {
      return { animating: animating, lastpos: lastpos, to: to };
    },
    then: promise.then.bind(promise),
    cancel: function cancel() {
      animating = false;
    }
  };
};

var animateScrollQuad = exports.animateScrollQuad = function animateScrollQuad(element, to, duration) {
  return animateScroll(element, to, duration, easeInOutQuad);
};