import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";
import { firebaseConfig, hasFirebaseConfig } from "./config.js";

export const isFirebaseReady = hasFirebaseConfig();

let app = null;
let auth = null;
let db = null;

if (isFirebaseReady) {
  const hasExistingApp = getApps().length > 0;
  app = hasExistingApp ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  if (!hasExistingApp) {
    initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
  }
  db = getFirestore(app);
}

export { app, auth, db };
