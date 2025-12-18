import React, { useState, useEffect, useRef } from "react";
import Login from "./components/Login";
import AssignmentList from "./components/AssignmentList";
import AssignmentView from "./components/AssignmentView";
import { authService, dbService } from "./services/firebase";
import {
  UserState,
  QuizProgress,
  Assignment,
  AssignmentProgress,
  Question,
} from "./types";
import { onAuthStateChanged } from "firebase/auth";
import assignmentsList from "./assignmentsData.json";
import { SYNC_DEBOUNCE_MS } from "./constants";

const STORAGE_KEY_PREFIX = "quiz_progress_v3_";

const App: React.FC = () => {
  const [user, setUser] = useState<UserState | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [progress, setProgress] = useState<QuizProgress | null>(null);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [assignmentQuestions, setAssignmentQuestions] = useState<Question[]>(
    []
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  const syncTimeoutRef = useRef<Record<string, number>>({});

  // Routing Handler
  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Initialize Auth and Hybrid Persistence
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      authService.auth,
      async (firebaseUser) => {
        if (firebaseUser) {
          const uid = firebaseUser.uid;
          const mappedUser: UserState = {
            uid: uid,
            email: firebaseUser.email,
            displayName: firebaseUser.email
              ? firebaseUser.email.split("@")[0]
              : "User",
          };
          setUser(mappedUser);

          // Fetch progress from cloud and local
          const cloudProgress = await dbService.getAllProgress(uid);
          const localData = localStorage.getItem(STORAGE_KEY_PREFIX + uid);
          const localProgress: QuizProgress | null = localData
            ? JSON.parse(localData)
            : null;

          let finalProgress = cloudProgress;
          if (
            localProgress &&
            (!cloudProgress ||
              localProgress.lastUpdated > cloudProgress.lastUpdated)
          ) {
            finalProgress = localProgress;
            // Background sync
            Object.entries(localProgress.assignments).forEach(
              ([asgnId, asgnProg]) => {
                dbService.saveAssignmentProgress(uid, asgnId, asgnProg);
              }
            );
          }
          setProgress(finalProgress);
        } else {
          setUser(null);
          setProgress(null);
          setSelectedAssignment(null);
        }
        setAuthInitialized(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // Sync selected assignment with current path
  useEffect(() => {
    // Standardize path by removing trailing slash if present (except for root)
    let sanitizedPath = currentPath;
    if (sanitizedPath.length > 1 && sanitizedPath.endsWith("/")) {
      sanitizedPath = sanitizedPath.slice(0, -1);
    }

    if (sanitizedPath === "/" || sanitizedPath === "") {
      setSelectedAssignment(null);
      setAssignmentQuestions([]);
      return;
    }

    const assignmentId = sanitizedPath.substring(1); // Remove leading slash
    const found = (assignmentsList as Assignment[]).find(
      (a) => a["asgn-unique-name"] === assignmentId
    );

    if (found) {
      loadAssignmentData(found);
    } else {
      window.history.replaceState({}, "", "/");
      setCurrentPath("/");
    }
  }, [currentPath]);

  const loadAssignmentData = async (asgn: Assignment) => {
    setAssignmentLoading(true);
    try {
      // Use absolute path starting with / to ensure it works on sub-routes
      const response = await fetch(
        `/assignments/${asgn["asgn-unique-name"]}.json`
      );
      if (!response.ok)
        throw new Error(
          `Failed to fetch assignment data: ${response.statusText}`
        );
      const data = await response.json();
      setAssignmentQuestions(data);
      setSelectedAssignment(asgn);
    } catch (err) {
      console.error("Failed to load assignment:", err);
      // Only redirect home if it truly failed to find the assignment
      if (!selectedAssignment) {
        window.history.pushState({}, "", "/");
        setCurrentPath("/");
      }
    } finally {
      setAssignmentLoading(false);
    }
  };

  const handleSelectAssignment = (asgn: Assignment) => {
    const path = `/${asgn["asgn-unique-name"]}`;
    window.history.pushState({}, "", path);
    setCurrentPath(path);
  };

  const handleGoBack = () => {
    window.history.pushState({}, "", "/");
    setCurrentPath("/");
  };

  const handleSaveAssignmentProgress = (asgnProgress: AssignmentProgress) => {
    if (!user || !selectedAssignment) return;
    const asgnId = selectedAssignment["asgn-unique-name"];

    setProgress((prev) => {
      const updatedProgress = {
        assignments: {
          ...(prev?.assignments || {}),
          [asgnId]: asgnProgress,
        },
        lastUpdated: Date.now(),
      };
      localStorage.setItem(
        STORAGE_KEY_PREFIX + user.uid,
        JSON.stringify(updatedProgress)
      );
      return updatedProgress;
    });

    if (syncTimeoutRef.current[asgnId]) {
      window.clearTimeout(syncTimeoutRef.current[asgnId]);
    }

    setIsSyncing(true);
    syncTimeoutRef.current[asgnId] = window.setTimeout(async () => {
      await dbService.saveAssignmentProgress(user.uid, asgnId, asgnProgress);
      setIsSyncing(false);
      delete syncTimeoutRef.current[asgnId];
    }, SYNC_DEBOUNCE_MS);
  };

  // Show global loader until auth state is known
  if (
    !authInitialized ||
    (currentPath !== "/" && currentPath !== "" && assignmentLoading)
  ) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gemini-200 border-t-gemini-600 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium text-sm animate-pulse">
            Loading experience...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={() => {}} />;
  }

  if (selectedAssignment && assignmentQuestions.length > 0) {
    return (
      <AssignmentView
        assignment={selectedAssignment}
        questions={assignmentQuestions}
        user={user}
        initialProgress={
          progress?.assignments[selectedAssignment["asgn-unique-name"]] || null
        }
        onSaveProgress={handleSaveAssignmentProgress}
        onBack={handleGoBack}
        onLogout={() => authService.logout()}
        isSyncing={isSyncing}
      />
    );
  }

  return (
    <AssignmentList
      assignments={assignmentsList as Assignment[]}
      progress={progress}
      onSelect={handleSelectAssignment}
      onLogout={() => authService.logout()}
      userEmail={user.email}
    />
  );
};

export default App;
