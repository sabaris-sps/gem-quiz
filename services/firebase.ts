import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc 
} from 'firebase/firestore';
import { QuizProgress, UserState } from '../types';

// TODO: Replace with your actual Firebase configuration
const firebaseConfig = {

  apiKey: "AIzaSyAmi7O2yJUjJSaBzQT1unDxQu0VkXjm2_I",

  authDomain: "gem-quiz.firebaseapp.com",

  projectId: "gem-quiz",

  storageBucket: "gem-quiz.firebasestorage.app",

  messagingSenderId: "641595380124",

  appId: "1:641595380124:web:9812253422a50dfe6f7859",

  measurementId: "G-K253K0X8DX"

};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export const authService = {
  // Try to login, if fails with user-not-found, try to register
  loginOrRegister: async (email: string, password: string): Promise<UserState> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return mapUser(userCredential.user);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        // Attempt registration
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            return mapUser(userCredential.user);
        } catch (regError: any) {
            throw regError;
        }
      }
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    await signOut(auth);
    window.location.reload();
  },

  // Note: In real firebase, we usually use the onAuthStateChanged listener in useEffect
  // but for compatibility with the existing app structure, we'll keep a similar interface
  // though the App.tsx will handle the listener.
  auth: auth
};

export const dbService = {
  saveProgress: async (uid: string, progress: QuizProgress): Promise<void> => {
    try {
      // Using mergeFields: ['progress'] ensures that the 'progress' field is REPLACED
      // rather than deeply merged. This allows deleting keys (like removing an answer).
      await setDoc(doc(db, "users", uid), { progress }, { mergeFields: ['progress'] });
    } catch (e) {
      console.error("Error saving progress: ", e);
    }
  },

  getProgress: async (uid: string): Promise<QuizProgress | null> => {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().progress) {
        return docSnap.data().progress as QuizProgress;
      }
      return null;
    } catch (e) {
      console.error("Error fetching progress: ", e);
      return null;
    }
  }
};

const mapUser = (user: User): UserState => ({
  uid: user.uid,
  email: user.email,
  displayName: user.email ? user.email.split('@')[0] : 'User'
});