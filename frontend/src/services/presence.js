
import { rtdb } from "./firebase";
import { ref, onValue, set, onDisconnect, serverTimestamp } from "firebase/database";

export function setupPresence(userId) {
  const connectedRef = ref(rtdb, ".info/connected");
  const statusRef = ref(rtdb, `status/${userId}`);

  const unsubscribe = onValue(connectedRef, async (snapshot) => {
    if (snapshot.val() === false) {
      return;
    }

    await onDisconnect(statusRef).set({
      state: "offline",
      lastChanged: serverTimestamp()
    });

    await set(statusRef, {
      state: "online",
      lastChanged: serverTimestamp()
    });
  });

  return unsubscribe;
}
