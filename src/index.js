import { throttle, last, first } from 'lodash-es';

/**
 * Calc fps based on time elapsed between animation frames.
 * @param state - observable state which value is set to current fps
 * @param observingInterval - time in ms
 */
function trackFPS(state, observingInterval = 100) {
  let timeMeasurements = [];

  const tick = function() {
    timeMeasurements.push(performance.now());

    const msPassed = last(timeMeasurements) - first(timeMeasurements);

    if (msPassed >= observingInterval) {
      state.value = Math.round(timeMeasurements.length / msPassed * 1000 * 10) / 10;
      timeMeasurements = [];
    }

    requestAnimationFrame(() => {
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
const minMaxThrottle = (FPS, FPSThrottlingLimit, callback, minThrottlingTime, maxThrottlingTime = 0) => {
  maxThrottlingTime = Math.max(maxThrottlingTime, minThrottlingTime);
  let time = minThrottlingTime;
  let timeout = null;
  const throttleFunc = (...args) => {
    clearTimeout(timeout);
    if (time >= maxThrottlingTime || FPS.value > FPSThrottlingLimit) {
      time = minThrottlingTime;
      callback(...args);
    } else {
      time += minThrottlingTime;
      timeout = setTimeout(() => {
        throttleFunc(...args);
      }, minThrottlingTime);
    }
  };
  return throttle(throttleFunc, minThrottlingTime);
};

const FPSThrottle = {
  install(Vue, options = {}) {
    let FPS = options.FPS;
    if (!options.FPS) {
      FPS = Vue.observable({ value: 1 });
      let observingInterval = options.observingInterval || 100;
      trackFPS(FPS, observingInterval);
      Vue.prototype.$FPS = FPS;
    }
    const FPSThrottlingLimit = options.FPSThrottlingLimit || 30;
    Vue.prototype.$minMaxThrottle = (...args) => minMaxThrottle(FPS, FPSThrottlingLimit, ...args);
  },
};

export default FPSThrottle;