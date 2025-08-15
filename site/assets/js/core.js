export function singleClickPerFeature(fn, getFeatureId) {
  // Store processing states per feature
  const processing = new Map();

  return async function (e) {
    const feature = e.features[0];
    if (!feature) return;

    const id = getFeatureId(feature);
    if (processing.get(id)) return; // ignore if this feature is already processing

    processing.set(id, true);
    try {
      await fn.apply(this, [e, feature]);
    } finally {
      processing.delete(id); // allow future clicks on this feature
    }
  };
}
