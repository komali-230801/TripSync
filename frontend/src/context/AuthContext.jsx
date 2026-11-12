
import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";

import {
  doc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

import { auth, db } from "../services/firebase";
import { setupPresence } from "../services/presence";

// Create authentication context
const AuthContext = createContext();

// Authentication provider
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Register new user
  async function register(fullName, email, password) {
    const result = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    await updateProfile(result.user, {
      displayName: fullName
    });

    await setDoc(doc(db, "users", result.user.uid), {
      uid: result.user.uid,
      fullName: fullName,
      email: email,
      createdAt: serverTimestamp()
    });

    return result.user;
  }

  // Login existing user
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Logout user
  function logout() {
    return signOut(auth);
  }

  // Monitor authentication and online status
  useEffect(() => {
    let unsubscribePresence = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribePresence) {
        unsubscribePresence();
        unsubscribePresence = null;
      }

      setCurrentUser(user);

      if (user) {
        unsubscribePresence = setupPresence(user.uid);
      }

      setLoading(false);
    });

    return () => {
      unsubscribeAuth();

      if (unsubscribePresence) {
        unsubscribePresence();
      }
    };
  }, []);

  // Share authentication functions
  const value = {
    currentUser,
    register,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Custom hook
export function useAuth() {
  return useContext(AuthContext);
}
