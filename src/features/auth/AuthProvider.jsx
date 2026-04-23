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
import { ensureUserProvisioned } from "../../shared/firebase/firestoreHousehold.js";

const AuthContext = createContext(null);

function translateAuthError(error) {
  const code = error?.code || "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email atau kata sandi tidak sesuai.";
    case "auth/email-already-in-use":
      return "Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.";
    case "auth/network-request-failed":
      return "Koneksi internet bermasalah. Coba lagi beberapa saat.";
    case "auth/invalid-api-key":
      return "API key Firebase tidak valid. Periksa ulang konfigurasi frontend.";
    case "auth/app-not-authorized":
      return "Domain aplikasi ini belum diizinkan di Firebase Authentication.";
    case "auth/operation-not-allowed":
      return "Provider Email/Password belum diaktifkan di Firebase Authentication.";
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
      await ensureUserProvisioned(nextUser);
      const profileRef = doc(db, "users", nextUser.uid);
      const profileSnap = await getDoc(profileRef);

      setProfile(profileSnap.exists() ? profileSnap.data() : null);
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
      isAuthenticated: Boolean(user && token),
      isFirebaseReady,
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
    [profile, status, token, user],
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
