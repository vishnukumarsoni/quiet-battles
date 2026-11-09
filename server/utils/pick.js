// Copy only the listed keys. Used so a client can never set fields like "role" or "id".
export default function pick(source, keys) {
  const out = {};
  for (const key of keys) {
    if (source[key] !== undefined) out[key] = source[key];
  }
  return out;
}
