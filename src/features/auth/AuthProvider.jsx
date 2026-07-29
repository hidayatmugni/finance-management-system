import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, isFirebaseReady } from "../../shared/firebase/client";
import { firebaseConfig, globalFamilyId } from "../../shared/firebase/config";
import { ensureUserProvisioned } from "../../shared/firebase/firestoreHousehold.js";

const AuthContext = createContext(null);

function translateAuthError(error) {
  const code = error?.code || "";
  const project = firebaseConfig.projectId || "(projectId belum diisi)";

  switch (code) {
    // Firebase merges "email tidak ada" and "sandi salah" into one code to
    // prevent account enumeration, so we cannot tell them apart — but naming
    // the project catches the most common cause after a reset: the app is
    // pointing at a different Firebase project than the account lives in.
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-login-credentials":
      return `Email atau kata sandi tidak cocok di project "${project}". Pastikan akun ini benar-benar ada di Authentication → Users pada project tersebut.`;
    case "auth/user-disabled":
      return "Akun ini dinonaktifkan di Firebase Authentication.";
    case "auth/too-many-requests":
      return "Terlalu banyak percobaan gagal. Tunggu beberapa menit atau reset kata sandi.";
    case "auth/email-already-in-use":
      return "Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.";
    case "auth/network-request-failed":
      return "Koneksi internet bermasalah. Coba lagi beberapa saat.";
    case "auth/invalid-api-key":
    case "auth/api-key-not-valid":
      return `API key Firebase tidak valid untuk project "${project}". Periksa variabel VITE_FIREBASE_* di Vercel.`;
    case "auth/app-not-authorized":
    case "auth/unauthorized-domain":
      return "Domain aplikasi ini belum diizinkan di Firebase Authentication → Settings → Authorized domains.";
    case "auth/operation-not-allowed":
      return "Provider Email/Password belum diaktifkan di Firebase Authentication → Sign-in method.";
    case "permission-denied":
    case "firestore/permission-denied":
      return "Akses ke database ditolak. Pastikan Firestore Rules sudah dideploy.";
    default:
      return error?.message || "Terjadi kesalahan saat proses autentikasi.";
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState("loading");
  /** Set when the session is valid but its Firestore records could not be written. */
  const [provisionError, setProvisionError] = useState(null);

  useEffect(() => {
    if (!isFirebaseReady || !auth) {
      setStatus("error");
      return undefined;
    }

    const unsubscribe = onIdTokenChanged(auth, async (nextUser) => {
      setUser(nextUser);

      if (!nextUser || !db) {
        setToken(null);
        setProfile(null);
        setStatus("ready");
        return;
      }

      const nextToken = await nextUser.getIdToken();
      setToken(nextToken);

      /*
       * Provisioning talks to Firestore, so it can fail independently of the
       * sign-in itself — rules not deployed yet, database deleted, offline.
       * When it does, the session still stands: fall back to a profile built
       * from the auth user so the app renders and can report the problem,
       * instead of hanging on the loading screen forever.
       */
      try {
        const provisioned = await ensureUserProvisioned(nextUser);
        const profileSnap = await getDoc(doc(db, "users", nextUser.uid));
        setProfile(profileSnap.exists() ? profileSnap.data() : provisioned);
        setProvisionError(null);
      } catch (error) {
        console.error("[auth] provisioning failed", error);
        setProvisionError(error);
        setProfile({
          uid: nextUser.uid,
          fullName: nextUser.displayName || nextUser.email?.split("@")[0] || "User",
          email: nextUser.email || "",
          familyId: globalFamilyId,
          role: null,
          status: "unprovisioned"
        });
      }

      setStatus("ready");
    });

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      profile,
      status,
      provisionError,
      isAuthenticated: Boolean(user && token),
      isFirebaseReady,
      projectId: firebaseConfig.projectId || null,
      async login({ email, password }) {
        if (!auth) throw new Error("Firebase Auth belum siap.");
        try {
          return await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
          throw new Error(translateAuthError(error));
        }
      },
      async logout() {
        if (!auth) return;
        return signOut(auth);
      }
    }),
    [profile, provisionError, status, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth harus dipakai di dalam AuthProvider.");
  }

  return context;
}
