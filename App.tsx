import React, { useState, useEffect, useCallback, useRef } from "react";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import QuizCard from "./components/QuizCard";
import { QUESTIONS } from "./constants";
import { authService, dbService } from "./services/firebase";
import { UserState, QuizProgress } from "./types";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";

const SYNC_DEBOUNCE_MS = 5000; // 5 seconds debounce for Firebase writes

const App: React.FC = () => {
  const [user, setUser] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDataInitialized, setIsDataInitialized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [sidebarOpen, setSidebarOpen] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );

  // Use a ref to track the last synced timestamp to avoid redundant writes
  const lastSyncedRef = useRef<number>(0);

  // Initialize Firebase Auth & Reconciliation
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

          try {
            // 1. Fetch Cloud Progress
            const cloudProgress = await dbService.getProgress(uid);

            // 2. Fetch Local Progress
            const localRaw = localStorage.getItem(`quiz_progress_${uid}`);
            const localProgress: QuizProgress | null = localRaw
              ? JSON.parse(localRaw)
              : null;

            // 3. Reconcile (Winner is the one with the latest timestamp)
            let winner: QuizProgress | null = null;

            if (cloudProgress && localProgress) {
              winner =
                localProgress.lastUpdated > (cloudProgress.lastUpdated || 0)
                  ? localProgress
                  : cloudProgress;
            } else {
              winner = cloudProgress || localProgress;
            }

            if (winner) {
              setAnswers(winner.answers || {});
              setNotes(winner.notes || {});
              // Note: currentQuestionIndex is no longer loaded from storage
              setLastUpdated(winner.lastUpdated || Date.now());
              lastSyncedRef.current = winner.lastUpdated || 0;

              // If local was newer than cloud, trigger an immediate cloud sync to heal the database
              if (
                localProgress &&
                (!cloudProgress ||
                  localProgress.lastUpdated > cloudProgress.lastUpdated)
              ) {
                console.log(
                  "Healing Cloud Data with newer LocalStorage data..."
                );
                await dbService.saveProgress(uid, localProgress);
                lastSyncedRef.current = localProgress.lastUpdated;
              }
            }
          } catch (error) {
            console.error("Error during data reconciliation:", error);
          }

          setIsDataInitialized(true);
          setUser(mappedUser);
        } else {
          setIsDataInitialized(false);
          setUser(null);
          setAnswers({});
          setNotes({});
          setCurrentQuestionIndex(0);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Immediate LocalStorage Backup + LastUpdated tracker
  useEffect(() => {
    if (user && isDataInitialized) {
      const timestamp = Date.now();
      const currentProgress: QuizProgress = {
        // currentQuestionIndex is excluded from persistence
        answers,
        notes,
        completed: Object.keys(answers).length === QUESTIONS.length,
        lastUpdated: timestamp,
      };

      // Instant mirroring to LocalStorage
      localStorage.setItem(
        `quiz_progress_${user.uid}`,
        JSON.stringify(currentProgress)
      );
      setLastUpdated(timestamp);
    }
  }, [answers, notes, user, isDataInitialized]); // Index removed from dependency array to avoid unnecessary updates if just navigating

  // Debounced Cloud Sync
  useEffect(() => {
    if (user && isDataInitialized && lastUpdated > lastSyncedRef.current) {
      const timer = setTimeout(async () => {
        setIsSyncing(true);
        try {
          const progressToSave: QuizProgress = {
            // currentQuestionIndex is excluded from persistence
            answers,
            notes,
            completed: Object.keys(answers).length === QUESTIONS.length,
            lastUpdated: lastUpdated,
          };

          await dbService.saveProgress(user.uid, progressToSave);
          lastSyncedRef.current = lastUpdated;
        } catch (err) {
          console.error("Cloud sync failed:", err);
        } finally {
          setIsSyncing(false);
        }
      }, SYNC_DEBOUNCE_MS);

      return () => clearTimeout(timer);
    }
  }, [lastUpdated, user, isDataInitialized, answers, notes]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNext = useCallback(() => {
    setCurrentQuestionIndex((prev) => {
      if (prev < QUESTIONS.length - 1) return prev + 1;
      return prev;
    });
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentQuestionIndex((prev) => {
      if (prev > 0) return prev - 1;
      return prev;
    });
  }, []);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") return;

      if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev]);

  const handleLogout = async () => {
    await authService.logout();
  };

  const handleOptionSelect = (option: string) => {
    const currentQ = QUESTIONS[currentQuestionIndex];
    setAnswers((prev) => ({
      ...prev,
      [currentQ.qno]: option,
    }));
  };

  const handleNoteUpdate = (note: string) => {
    const currentQ = QUESTIONS[currentQuestionIndex];
    setNotes((prev) => ({
      ...prev,
      [currentQ.qno]: note,
    }));
  };

  const handleResetQuestion = () => {
    const currentQ = QUESTIONS[currentQuestionIndex];
    setAnswers((prev) => {
      const newAnswers = { ...prev };
      delete newAnswers[currentQ.qno];
      return newAnswers;
    });
  };

  const handleResetAssignment = () => {
    setAnswers({});
    setNotes({});
    setCurrentQuestionIndex(0);
    if (user) {
      localStorage.removeItem(`quiz_progress_${user.uid}`);
    }
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const calculateStats = () => {
    let correct = 0;
    let incorrect = 0;

    Object.entries(answers).forEach(([qnoStr, selectedOption]) => {
      const qno = parseInt(qnoStr);
      const question = QUESTIONS.find((q) => q.qno === qno);
      if (question) {
        if (question.answer === selectedOption) correct++;
        else incorrect++;
      }
    });

    return { correct, incorrect, total: QUESTIONS.length };
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-gemini-200 border-t-gemini-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={() => {}} />;
  }

  const stats = calculateStats();
  const isFirst = currentQuestionIndex === 0;
  const isLast = currentQuestionIndex === QUESTIONS.length - 1;
  const currentQ = QUESTIONS[currentQuestionIndex];

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
      <Sidebar
        questions={QUESTIONS}
        currentQuestionIndex={currentQuestionIndex}
        answers={answers}
        onSelectQuestion={setCurrentQuestionIndex}
        userEmail={user.email}
        onLogout={handleLogout}
        onResetAssignment={handleResetAssignment}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        stats={stats}
        isSyncing={isSyncing || lastUpdated > lastSyncedRef.current}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative transition-all duration-300">
        {/* Top Navigation Bar */}
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Toggle Sidebar"
            >
              <Menu size={20} />
            </button>

            <div className="hidden md:block h-6 w-px bg-slate-200"></div>

            <div className="hidden md:block">
              <span className="text-sm font-semibold text-slate-400">
                Question {currentQuestionIndex + 1} of {QUESTIONS.length}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={handlePrev}
              disabled={isFirst}
              className={`
                 flex items-center gap-1 pl-2 pr-3 py-2 rounded-lg text-sm font-medium transition-colors
                 ${
                   isFirst
                     ? "text-slate-300 cursor-not-allowed"
                     : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                 }
               `}
              title="Previous Question (Left Arrow)"
            >
              <ChevronLeft size={18} />
              <span className="hidden sm:inline">Prev</span>
            </button>

            <button
              onClick={handleNext}
              disabled={isLast}
              className={`
                 flex items-center gap-1 pl-3 pr-2 py-2 rounded-lg text-sm font-medium transition-colors
                 ${
                   isLast
                     ? "text-slate-300 cursor-not-allowed"
                     : "bg-slate-900 text-white hover:bg-gemini-600 shadow-md shadow-slate-200"
                 }
               `}
              title="Next Question (Right Arrow)"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto scroll-smooth">
          <div className="min-h-full p-4 md:p-12 flex flex-col">
            {currentQ ? (
              <QuizCard
                key={currentQ.qno}
                question={currentQ}
                selectedOption={answers[currentQ.qno]}
                note={notes[currentQ.qno] || ""}
                onOptionSelect={handleOptionSelect}
                onUpdateNote={handleNoteUpdate}
                onReset={handleResetQuestion}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <p>No question data available.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
