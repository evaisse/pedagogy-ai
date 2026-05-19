function readTimingValue(valueOrReader) {
  const value = typeof valueOrReader === "function" ? valueOrReader() : valueOrReader;
  const timing = Number(value);
  return Number.isFinite(timing) ? Math.max(0, timing) : 0;
}

function createDebounce(callback, delay, scheduler = window) {
  let timerId = null;
  let latestArgs = [];

  const debounced = (...args) => {
    latestArgs = args;

    if (timerId !== null) {
      scheduler.clearTimeout(timerId);
    }

    timerId = scheduler.setTimeout(() => {
      timerId = null;
      callback(...latestArgs);
    }, readTimingValue(delay));
  };

  debounced.cancel = () => {
    if (timerId !== null) {
      scheduler.clearTimeout(timerId);
      timerId = null;
    }

    latestArgs = [];
  };

  return debounced;
}

function createThrottle(callback, interval, getTime = () => performance.now()) {
  let lastEmissionTime = Number.NEGATIVE_INFINITY;

  const throttled = (...args) => {
    const currentTime = getTime();

    if (currentTime - lastEmissionTime >= readTimingValue(interval)) {
      lastEmissionTime = currentTime;
      callback(...args);
    }
  };

  throttled.cancel = () => {
    lastEmissionTime = Number.NEGATIVE_INFINITY;
  };

  return throttled;
}

const delayInput = document.querySelector("#debounce-delay");
const delayOutput = document.querySelector("#debounce-delay-value");
const intervalInput = document.querySelector("#throttle-interval");
const intervalOutput = document.querySelector("#throttle-interval-value");
const textInput = document.querySelector("#event-text");
const eventPad = document.querySelector("#event-pad");
const burstButton = document.querySelector("#burst-events");
const pauseButton = document.querySelector("#pause-events");
const resetButton = document.querySelector("#reset-demo");
const statusText = document.querySelector("#control-status");
const totalEventsText = document.querySelector("#total-events");
const rawCountText = document.querySelector("#raw-count");
const debounceCountText = document.querySelector("#debounce-count");
const throttleCountText = document.querySelector("#throttle-count");
const timelineTracks = {
  raw: document.querySelector("#raw-lane .timeline-track"),
  debounce: document.querySelector("#debounce-lane .timeline-track"),
  throttle: document.querySelector("#throttle-lane .timeline-track"),
};

const TIMELINE_WINDOW_MS = 6000;
const MAX_TIMELINE_MARKERS = 80;

const eventState = {
  rawEvents: [],
  debouncedEvents: [],
  throttledEvents: [],
  rawCount: 0,
  debouncedCount: 0,
  throttledCount: 0,
  isPaused: false,
  burstTimerId: null,
  timelineRefreshTimerId: null,
};

function setOutput(input, output) {
  output.value = `${input.value} ms`;
  output.textContent = `${input.value} ms`;
}

function setStatus(message) {
  statusText.textContent = message;
}

function formatEventCount(count) {
  return `${count} ${count === 1 ? "event" : "events"} captured`;
}

function getTimelineEvents(laneName) {
  if (laneName === "raw") {
    return eventState.rawEvents;
  }

  if (laneName === "debounce") {
    return eventState.debouncedEvents;
  }

  return eventState.throttledEvents;
}

function getTimelineLabel(laneName) {
  if (laneName === "raw") {
    return "Raw";
  }

  if (laneName === "debounce") {
    return "Debounced";
  }

  return "Throttled";
}

function pruneTimelineEvents(events, currentTime) {
  while (events.length > 0 && currentTime - events[0].time > TIMELINE_WINDOW_MS) {
    events.shift();
  }

  if (events.length > MAX_TIMELINE_MARKERS) {
    events.splice(0, events.length - MAX_TIMELINE_MARKERS);
  }
}

function createTimelineMarker(laneName, event, currentTime) {
  const marker = document.createElement("span");
  const age = Math.max(0, currentTime - event.time);
  const position = 100 - Math.min(100, (age / TIMELINE_WINDOW_MS) * 100);
  const laneLabel = getTimelineLabel(laneName);

  marker.className = `timeline-marker timeline-marker-${laneName}`;
  marker.dataset.lane = laneName;
  marker.dataset.source = event.source;
  marker.setAttribute("role", "listitem");
  marker.setAttribute("aria-label", `${laneLabel} ${event.source} event`);
  marker.style.left = `${position}%`;

  return marker;
}

function renderTimelineLane(laneName, currentTime = performance.now()) {
  const events = getTimelineEvents(laneName);
  pruneTimelineEvents(events, currentTime);
  timelineTracks[laneName].replaceChildren(
    ...events.map((event) => createTimelineMarker(laneName, event, currentTime)),
  );
}

function stopTimelineRefresh() {
  if (eventState.timelineRefreshTimerId !== null) {
    window.clearInterval(eventState.timelineRefreshTimerId);
    eventState.timelineRefreshTimerId = null;
  }
}

function renderTimelines(currentTime = performance.now()) {
  renderTimelineLane("raw", currentTime);
  renderTimelineLane("debounce", currentTime);
  renderTimelineLane("throttle", currentTime);

  if (
    eventState.rawEvents.length === 0 &&
    eventState.debouncedEvents.length === 0 &&
    eventState.throttledEvents.length === 0
  ) {
    stopTimelineRefresh();
  }
}

function ensureTimelineRefresh() {
  if (eventState.timelineRefreshTimerId === null) {
    eventState.timelineRefreshTimerId = window.setInterval(renderTimelines, 250);
  }
}

function updateResetState() {
  resetButton.disabled =
    eventState.rawCount === 0 &&
    eventState.debouncedCount === 0 &&
    eventState.throttledCount === 0 &&
    textInput.value.length === 0;
}

function updateRawCount() {
  const count = eventState.rawCount;
  rawCountText.textContent = String(count);
  totalEventsText.textContent = formatEventCount(count);
  updateResetState();
}

function updateDebounceCount() {
  debounceCountText.textContent = String(eventState.debouncedCount);
  updateResetState();
}

function updateThrottleCount() {
  throttleCountText.textContent = String(eventState.throttledCount);
  updateResetState();
}

function stopBurst() {
  if (eventState.burstTimerId !== null) {
    window.clearInterval(eventState.burstTimerId);
    eventState.burstTimerId = null;
  }
}

function recordRawEvent(source) {
  if (eventState.isPaused) {
    setStatus("Paused");
    updateResetState();
    return false;
  }

  const rawEvent = {
    source,
    time: performance.now(),
  };

  eventState.rawEvents.push(rawEvent);
  eventState.rawCount += 1;
  renderTimelineLane("raw", rawEvent.time);
  ensureTimelineRefresh();
  updateRawCount();
  debouncedRecorder(rawEvent);
  throttledRecorder(rawEvent);
  setStatus(`${source} event captured`);
  return true;
}

function recordDebouncedEvent(rawEvent) {
  eventState.debouncedEvents.push({
    source: rawEvent.source,
    rawTime: rawEvent.time,
    time: performance.now(),
  });
  eventState.debouncedCount += 1;
  renderTimelineLane("debounce");
  ensureTimelineRefresh();
  updateDebounceCount();
  setStatus("Debounced output emitted");
}

function recordThrottledEvent(rawEvent) {
  eventState.throttledEvents.push({
    source: rawEvent.source,
    rawTime: rawEvent.time,
    time: performance.now(),
  });
  eventState.throttledCount += 1;
  renderTimelineLane("throttle");
  ensureTimelineRefresh();
  updateThrottleCount();
  setStatus("Throttled output emitted");
}

function setPaused(isPaused) {
  eventState.isPaused = isPaused;
  pauseButton.setAttribute("aria-pressed", String(isPaused));
  pauseButton.textContent = isPaused ? "Resume" : "Pause";
  eventPad.setAttribute("aria-disabled", String(isPaused));

  if (isPaused) {
    stopBurst();
  }

  setStatus(isPaused ? "Paused" : "Capture resumed");
}

function runBurst() {
  if (eventState.isPaused) {
    setStatus("Paused");
    return;
  }

  stopBurst();

  const burstSize = 32;
  const burstInterval = 20;
  let emittedCount = 0;

  const emitBurstEvent = () => {
    if (emittedCount >= burstSize || eventState.isPaused) {
      stopBurst();
      return;
    }

    emittedCount += 1;
    recordRawEvent("Burst");

    if (emittedCount >= burstSize) {
      stopBurst();
    }
  };

  emitBurstEvent();
  eventState.burstTimerId = window.setInterval(emitBurstEvent, burstInterval);
}

const debouncedRecorder = createDebounce(
  recordDebouncedEvent,
  () => Number(delayInput.value),
);
const throttledRecorder = createThrottle(
  recordThrottledEvent,
  () => Number(intervalInput.value),
);

setOutput(delayInput, delayOutput);
setOutput(intervalInput, intervalOutput);
updateRawCount();
updateDebounceCount();
updateThrottleCount();
renderTimelines();

delayInput.addEventListener("input", () => {
  setOutput(delayInput, delayOutput);
  setStatus("Debounce delay updated");
});

intervalInput.addEventListener("input", () => {
  setOutput(intervalInput, intervalOutput);
  setStatus("Throttle interval updated");
});

textInput.addEventListener("input", () => {
  recordRawEvent("Text");
  updateResetState();
});

eventPad.addEventListener("pointermove", () => {
  recordRawEvent("Pointer");
});

burstButton.addEventListener("click", () => {
  runBurst();
});

pauseButton.addEventListener("click", () => {
  setPaused(!eventState.isPaused);
});

function resetDemo() {
  stopBurst();
  debouncedRecorder.cancel();
  throttledRecorder.cancel();
  eventState.rawEvents.length = 0;
  eventState.debouncedEvents.length = 0;
  eventState.throttledEvents.length = 0;
  eventState.rawCount = 0;
  eventState.debouncedCount = 0;
  eventState.throttledCount = 0;
  textInput.value = "";
  setPaused(false);
  stopTimelineRefresh();
  renderTimelines();
  updateRawCount();
  updateDebounceCount();
  updateThrottleCount();
  setStatus("Ready");
}

resetButton.addEventListener("click", () => {
  resetDemo();
});

function readRawCount() {
  return Number(document.querySelector("#raw-count").textContent);
}

async function runEventRecorderChecks() {
  const assert = (condition, message) => {
    if (!condition) {
      throw new Error(message);
    }
  };

  const initialCount = readRawCount();
  textInput.value = "a";
  textInput.dispatchEvent(new Event("input", { bubbles: true }));
  assert(readRawCount() === initialCount + 1, "Text input should add one raw event");

  const afterTextCount = readRawCount();
  document.querySelector("#burst-events").click();
  await new Promise((resolve) => {
    window.setTimeout(resolve, 240);
  });
  assert(readRawCount() >= afterTextCount + 4, "Burst should add multiple raw events");

  pauseButton.click();
  const pausedCount = readRawCount();
  textInput.value = "ab";
  textInput.dispatchEvent(new Event("input", { bubbles: true }));
  assert(readRawCount() === pausedCount, "Paused capture should ignore raw events");
}

function createControlledTimer() {
  let currentTime = 0;
  let nextTimerId = 1;
  const timers = new Map();

  return {
    get now() {
      return currentTime;
    },
    setTimeout(callback, delay) {
      const timerId = nextTimerId;
      nextTimerId += 1;
      timers.set(timerId, {
        callback,
        time: currentTime + delay,
      });
      return timerId;
    },
    clearTimeout(timerId) {
      timers.delete(timerId);
    },
    tick(duration) {
      currentTime += duration;

      let dueTimers = [...timers.entries()]
        .filter(([, timer]) => timer.time <= currentTime)
        .sort(([, first], [, second]) => first.time - second.time);

      while (dueTimers.length > 0) {
        for (const [timerId, timer] of dueTimers) {
          if (timers.has(timerId)) {
            timers.delete(timerId);
            timer.callback();
          }
        }

        dueTimers = [...timers.entries()]
          .filter(([, timer]) => timer.time <= currentTime)
          .sort(([, first], [, second]) => first.time - second.time);
      }
    },
  };
}

function runTimingHelperChecks() {
  const assert = (condition, message) => {
    if (!condition) {
      throw new Error(message);
    }
  };

  assert(typeof createDebounce === "function", "createDebounce should be defined");
  assert(typeof createThrottle === "function", "createThrottle should be defined");

  const debounceTimer = createControlledTimer();
  const debouncedValues = [];
  const debounced = createDebounce((value) => {
    debouncedValues.push(value);
  }, 100, debounceTimer);

  debounced("first");
  debounceTimer.tick(99);
  assert(debouncedValues.length === 0, "Debounce should wait for the full quiet period");

  debounced("second");
  debounceTimer.tick(99);
  assert(debouncedValues.length === 0, "Debounce should cancel earlier pending emissions");

  debounceTimer.tick(1);
  assert(
    debouncedValues.length === 1 && debouncedValues[0] === "second",
    "Debounce should emit only the latest value after quiet time",
  );

  const cancelTimer = createControlledTimer();
  const canceledValues = [];
  const cancelableDebounce = createDebounce((value) => {
    canceledValues.push(value);
  }, 100, cancelTimer);

  cancelableDebounce("pending");
  cancelableDebounce.cancel();
  cancelTimer.tick(100);
  assert(canceledValues.length === 0, "Debounce cancel should clear pending emissions");

  const dynamicDebounceTimer = createControlledTimer();
  const dynamicDebounceValues = [];
  let debounceDelay = 100;
  const dynamicDebounce = createDebounce((value) => {
    dynamicDebounceValues.push(value);
  }, () => debounceDelay, dynamicDebounceTimer);

  dynamicDebounce("slow");
  dynamicDebounceTimer.tick(100);
  debounceDelay = 50;
  dynamicDebounce("fast");
  dynamicDebounceTimer.tick(49);
  assert(
    dynamicDebounceValues.join(",") === "slow",
    "Debounce should wait for updated quiet periods",
  );

  dynamicDebounceTimer.tick(1);
  assert(
    dynamicDebounceValues.join(",") === "slow,fast",
    "Debounce should use updated timing values for future events",
  );

  const throttleTimer = createControlledTimer();
  const throttledValues = [];
  let throttleInterval = 100;
  const throttled = createThrottle((value) => {
    throttledValues.push(value);
  }, () => throttleInterval, () => throttleTimer.now);

  throttled("first");
  throttled("blocked");
  throttleTimer.tick(99);
  throttled("still-blocked");
  throttleTimer.tick(1);
  throttled("second");
  assert(
    throttledValues.join(",") === "first,second",
    "Throttle should emit at most once per interval",
  );

  throttleInterval = 50;
  throttleTimer.tick(49);
  throttled("blocked-after-update");
  throttleTimer.tick(1);
  throttled("after-update");
  assert(
    throttledValues.join(",") === "first,second,after-update",
    "Throttle should use updated timing values for future events",
  );

  throttled.cancel();
  throttled("after-reset");
  assert(
    throttledValues.join(",") === "first,second,after-update,after-reset",
    "Throttle cancel should clear previous interval state",
  );
}

function countTimelineMarkers(laneId, laneName) {
  return document.querySelectorAll(
    `#${laneId} .timeline-marker[data-lane="${laneName}"]`,
  ).length;
}

function runTimelineChecks() {
  const assert = (condition, message) => {
    if (!condition) {
      throw new Error(message);
    }
  };

  delayInput.value = "1200";
  setOutput(delayInput, delayOutput);
  recordRawEvent("Timeline check");
  recordDebouncedEvent(eventState.rawEvents[0]);

  assert(
    countTimelineMarkers("raw-lane", "raw") === 1,
    "Raw lane should render one event marker",
  );
  assert(
    countTimelineMarkers("debounce-lane", "debounce") === 1,
    "Debounce lane should render one event marker",
  );
  assert(
    countTimelineMarkers("throttle-lane", "throttle") === 1,
    "Throttle lane should render one event marker",
  );
}

function runContentChecks() {
  const assert = (condition, message) => {
    if (!condition) {
      throw new Error(message);
    }
  };
  const pageText = document.body.textContent.toLowerCase().replace(/\s+/g, " ");

  assert(
    document.querySelector("#learning-guide") !== null,
    "Learning guide should exist on the page",
  );
  assert(
    pageText.includes("quiet period"),
    "Debounce explanation should mention waiting for a quiet period",
  );
  assert(
    pageText.includes("limits output frequency"),
    "Throttle explanation should mention limiting output frequency",
  );

  for (const label of ["search input", "resize events", "scroll events", "pointer movement"]) {
    assert(pageText.includes(label), `Use-case comparison should include ${label}`);
  }

  assert(
    pageText.includes("function debounce") && pageText.includes("function throttle"),
    "Code examples should include compact debounce and throttle snippets",
  );
}

if (new URLSearchParams(window.location.search).has("event-recorder-checks")) {
  window.__eventRecorderCheckResult = { status: "running" };
  window.addEventListener("load", () => {
    runEventRecorderChecks()
      .then(() => {
        window.__eventRecorderCheckResult = { status: "passed" };
      })
      .catch((error) => {
        window.__eventRecorderCheckResult = {
          status: "failed",
          message: error.message,
        };
      });
  });
}

if (new URLSearchParams(window.location.search).has("timing-helper-checks")) {
  window.__timingHelperCheckResult = { status: "running" };
  window.addEventListener("load", () => {
    try {
      runTimingHelperChecks();
      window.__timingHelperCheckResult = { status: "passed" };
    } catch (error) {
      window.__timingHelperCheckResult = {
        status: "failed",
        message: error.message,
      };
    }
  });
}

if (new URLSearchParams(window.location.search).has("content-checks")) {
  window.__contentCheckResult = { status: "running" };
  window.addEventListener("load", () => {
    try {
      runContentChecks();
      window.__contentCheckResult = { status: "passed" };
    } catch (error) {
      window.__contentCheckResult = {
        status: "failed",
        message: error.message,
      };
    }
  });
}

if (new URLSearchParams(window.location.search).has("timeline-checks")) {
  window.__timelineCheckResult = { status: "running" };
  window.addEventListener("load", () => {
    try {
      runTimelineChecks();
      window.__timelineCheckResult = { status: "passed" };
    } catch (error) {
      window.__timelineCheckResult = {
        status: "failed",
        message: error.message,
      };
    } finally {
      resetButton.click();
    }
  });
}
