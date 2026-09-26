// Carries the display name typed on the sign-up form to App's first-login
// profile creation (onAuthStateChanged fires before the form can write it).
let pendingName = null;
export const setPendingSignupName = (n) => { pendingName = n; };
export const consumePendingSignupName = () => { const n = pendingName; pendingName = null; return n; };
