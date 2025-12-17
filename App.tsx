import React, { useState, useEffect, useCallback } from "react";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import QuizCard from "./components/QuizCard";
import questionData from "./questions.json";
import { authService, dbService } from "./services/firebase";
import { UserState } from "./types";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";

const QUESTIONS = questionData;

const App: React.FC = () => {
  const [user, setUser] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDataInitialized, setIsDataInitialized] = useState(false); // New flag to track if initial fetch is done
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [sidebarOpen, setSidebarOpen] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );

  // Initialize Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      authService.auth,
      async (firebaseUser) => {
        if (firebaseUser) {
          const mappedUser: UserState = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.email
              ? firebaseUser.email.split("@")[0]
              : "User",
          };

          // Fetch progress BEFORE enabling saving to avoid overwriting with empty state
          try {
            const savedProgress = await dbService.getProgress(firebaseUser.uid);
            if (savedProgress) {
              setAnswers(savedProgress.answers || {});
              setNotes(savedProgress.notes || {});
              // Ensure index is within bounds of new data
              const safeIndex =
                savedProgress.currentQuestionIndex < QUESTIONS.length
                  ? savedProgress.currentQuestionIndex
                  : 0;
              setCurrentQuestionIndex(safeIndex);
            }
          } catch (error) {
            console.error("Error loading progress:", error);
          }

          setIsDataInitialized(true); // Allow saving now that we've attempted to load
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

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

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

  // Save progress whenever it changes
  useEffect(() => {
    // Crucial check: Only save if we have a user AND data has been initialized (loaded)
    if (user && isDataInitialized) {
      dbService.saveProgress(user.uid, {
        currentQuestionIndex,
        answers,
        notes,
        completed: Object.keys(answers).length === QUESTIONS.length,
      });
    }
  }, [answers, notes, currentQuestionIndex, user, isDataInitialized]);

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
      // Don't trigger navigation if user is typing in a textarea or input
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

  const handleLoginSuccess = (email: string) => {
    // Auth state listener will handle the state update
  };

  const handleLogout = async () => {
    await authService.logout();
    // Auth state listener will handle the null user
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
    return <Login onLoginSuccess={handleLoginSuccess} />;
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
              <span className="sm:hidden">Next</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto scroll-smooth">
          <div className="min-h-full p-4 md:p-12 flex flex-col">
            {currentQ ? (
              <QuizCard
                key={currentQ.qno} // Force remount on question change to reset internal state like showHint
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
