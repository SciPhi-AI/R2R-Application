// PostHog telemetry disabled. No events are sent to external PostHog.

const noop = () => {};
const noopPostHog = {
  init: noop,
  capture: noop,
  identify: noop,
  reset: noop,
  opt_out_capturing: noop,
  opt_in_capturing: noop,
  register: noop,
  unregister: noop,
  track: noop,
  page: noop,
};

function initializePostHog() {
  // No-op: PostHog is disabled; no events are sent.
}

export default noopPostHog;
export { initializePostHog };
