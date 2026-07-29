import { collection, doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./client.js";

/**
 * The CMS lives in `families/{familyId}/appConfig/{section}`. One document per
 * section keeps writes small and lets Firestore rules gate sections separately
 * later without a data migration.
 */
function appConfigCollection(familyId) {
  return collection(db, "families", familyId, "appConfig");
}

export function watchAppConfig(familyId, onData, onError) {
  return onSnapshot(
    appConfigCollection(familyId),
    (snapshot) => {
      const sections = {};
      snapshot.docs.forEach((item) => {
        const { updatedAt, updatedBy, ...values } = item.data();
        sections[item.id] = values;
      });
      onData(sections);
    },
    onError,
  );
}

export async function saveAppConfigSection(familyId, section, values, userId) {
  return setDoc(
    doc(db, "families", familyId, "appConfig", section),
    { ...values, updatedAt: serverTimestamp(), updatedBy: userId || null },
    { merge: false },
  );
}
