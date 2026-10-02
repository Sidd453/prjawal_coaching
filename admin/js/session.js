// Holds the logged-in user. `can()` mirrors the backend check; the API is still the real gatekeeper.
let current = null;
export const session = {
  set(u) { current = u; },
  get user() { return current; },
};
export const can = (...perms) => perms.every((p) => current?.permissions?.includes(p));
export const canAny = (...perms) => perms.some((p) => current?.permissions?.includes(p));
