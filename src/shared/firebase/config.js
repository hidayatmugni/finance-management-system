const env = import.meta.env ?? {};
export const globalFamilyId = env.VITE_GLOBAL_FAMILY_ID || "mugni-family";
export const globalFamilyName = env.VITE_GLOBAL_FAMILY_NAME || "Keluarga Mugni";

/**
 * Accounts that are always owners, no matter what the stored documents say.
 *
 * This is the break-glass path: if a role gets corrupted, a member record is
 * deleted, or the database is wiped, these addresses can still sign in with
 * full access and repair things. Override per environment with
 * `VITE_OWNER_EMAILS` (comma separated).
 *
 * The same list is mirrored in `firestore.rules` — the client decides what to
 * *write*, the rules decide what is *allowed*, so both need to agree.
 */
export const ownerEmails = String(env.VITE_OWNER_EMAILS || "mugnihidayat023@gmail.com")
  .split(",")
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean);

export function isOwnerEmail(email) {
  return ownerEmails.includes(String(email || "").trim().toLowerCase());
}

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

export function hasFirebaseConfig() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.storageBucket &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId
  );
}
