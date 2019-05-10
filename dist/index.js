'use strict';

var lodashEs = require('lodash-es');

/**
 * Calc fps based on time elapsed between animation frames.
 * @param state - observable state which value is set to current fps
 * @param observingInterval - time in ms
 */

function trackFPS(state) {
  var observingInterval = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 100;
  var timeMeasurements = [];

  var tick = function tick() {
    timeMeasurements.push(performance.now());
    var msPassed = lodashEs.last(timeMeasurements) - lodashEs.first(timeMeasurements);

    if (msPassed >= observingInterval) {
      state.value = Math.round(timeMeasurements.length / msPassed * 1000 * 10) / 10;
      timeMeasurements = [];
    }

    requestAnimationFrame(function () {
      tick();
    });
  };

  tick();
}
/**
 * Throttle given callback based on current FPS.
 * If FPS is lower then fpsThrottlingLimit, then throttling might be extended up to maxThrottlingTime.
 * Otherwise behaves like lodash throttling and throttle with minThrottlingTime.
 * @param FPS - observable state which value indicates current fps
 * @param FPSThrottlingLimit - FPS limit where additional throttling might occur
 * @param callback
 * @param minThrottlingTime
 * @param {maxThrottlingTime} - if not set, function behaves just like lodash throttle
 */


var minMaxThrottle = function minMaxThrottle(FPS, FPSThrottlingLimit, callback, minThrottlingTime) {
  var maxThrottlingTime = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
  maxThrottlingTime = Math.max(maxThrottlingTime, minThrottlingTime);
  var time = minThrottlingTime;
  var timeout = null;

  var throttleFunc = function throttleFunc() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    clearTimeout(timeout);

    if (time >= maxThrottlingTime || FPS.value > FPSThrottlingLimit) {
      time = minThrottlingTime;
      callback.apply(void 0, args);
    } else {
      time += minThrottlingTime;
      timeout = setTimeout(function () {
        throttleFunc.apply(void 0, args);
      }, minThrottlingTime);
    }
  };

  return lodashEs.throttle(throttleFunc, minThrottlingTime);
};

var FPSThrottle = {
  install: function install(Vue, options) {
    var FPS = options.FPS;

    if (!options.FPS) {
      FPS = Vue.observable({
        value: 1
      });
      var observingInterval = options.observingInterval || 100;
      trackFPS(FPS, observingInterval);
      Vue.prototype.$FPS = FPS;
    }

    var FPSThrottlingLimit = options.FPSThrottlingLimit || 30;

    Vue.prototype.$minMaxThrottle = function () {
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      return minMaxThrottle.apply(void 0, [FPS, FPSThrottlingLimit].concat(args));
    };
  }
};

module.exports = FPSThrottle;
