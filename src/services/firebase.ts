
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
  getDoc,
  updateDoc,
  collection,
  getDocs
} from 'firebase/firestore';
import { QuizProgress, AssignmentProgress, UserState } from '../types';

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
  loginOrRegister: async (email: string, password: string): Promise<UserState> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return mapUser(userCredential.user);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
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
  auth: auth
};

export const dbService = {
  // Saves progress to a specific document for the assignment: users/{uid}/assignments/{assignmentId}
  saveAssignmentProgress: async (uid: string, assignmentId: string, progress: AssignmentProgress): Promise<void> => {
    try {
      const docRef = doc(db, "users", uid, "assignments", assignmentId);
      await setDoc(docRef, progress, { merge: true });
      
      // Also update the lastUpdated in the root user doc for overall sync tracking
      const userRef = doc(db, "users", uid);
      await setDoc(userRef, { lastUpdated: Date.now() }, { merge: true });
    } catch (e) {
      console.error("Error saving progress: ", e);
    }
  },

  // Fetches progress for all assignments by querying the subcollection
  getAllProgress: async (uid: string): Promise<QuizProgress | null> => {
    try {
      const assignmentsCol = collection(db, "users", uid, "assignments");
      const snapshot = await getDocs(assignmentsCol);
      
      const assignments: Record<string, AssignmentProgress> = {};
      snapshot.forEach(doc => {
        assignments[doc.id] = doc.data() as AssignmentProgress;
      });

      const userDoc = await getDoc(doc(db, "users", uid));
      const lastUpdated = userDoc.exists() ? userDoc.data().lastUpdated : Date.now();

      // Legacy Migration check if subcollection is empty
      if (Object.keys(assignments).length === 0) {
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.assignments || data.progress) {
             console.log("Migrating legacy root data to subcollection...");
             const oldData = data.assignments || { "salt-analysis1": data.progress };
             for (const [id, prog] of Object.entries(oldData)) {
               await setDoc(doc(db, "users", uid, "assignments", id), prog);
               assignments[id] = prog as AssignmentProgress;
             }
          }
        }
      }

      return {
        assignments,
        lastUpdated: lastUpdated || Date.now()
      };
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