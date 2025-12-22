import React, { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "./Sidebar";
import QuizCard from "./QuizCard";
import { Question, UserState, AssignmentProgress, Assignment } from "../types";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  ArrowLeft,
  Sun,
  Moon,
} from "lucide-react";

interface AssignmentViewProps {
  assignment: Assignment;
  questions: Question[];
  user: UserState;
  initialProgress: AssignmentProgress | null;
  onSaveProgress: (progress: AssignmentProgress) => void;
  onBack: () => void;
  onLogout: () => void;
  isSyncing: boolean;
  darkMode: boolean;
  toggleTheme: () => void;
}

const AssignmentView: React.FC<AssignmentViewProps> = ({
  assignment,
  questions,
  user,
  initialProgress,
  onSaveProgress,
  onBack,
  onLogout,
  isSyncing,
  darkMode,
  toggleTheme,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>(
    initialProgress?.answers || {}
  );
  const [notes, setNotes] = useState<Record<number, string>>(
    initialProgress?.notes || {}
  );
  const [marks, setMarks] = useState<Record<number, string>>(
    initialProgress?.marks || {}
  );
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const progress: AssignmentProgress = {
      answers,
      notes,
      marks,
      completed: Object.keys(answers).length >= questions.length,
      lastUpdated: Date.now(),
    };
    onSaveProgress(progress);
  }, [answers, notes, marks, questions.length]);

  const handleNext = useCallback(() => {
    setCurrentQuestionIndex((prev) =>
      prev < questions.length - 1 ? prev + 1 : prev
    );
  }, [questions.length]);

  const handlePrev = useCallback(() => {
    setCurrentQuestionIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLInputElement
      )
        return;
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev]);

  const handleOptionSelect = (option: string) => {
    const qno = questions[currentQuestionIndex].qno;
    setAnswers((prev) => ({ ...prev, [qno]: option }));
  };

  const handleNoteUpdate = (note: string) => {
    const qno = questions[currentQuestionIndex].qno;
    setNotes((prev) => ({ ...prev, [qno]: note }));
  };

  const handleMarkUpdate = (color: string | null) => {
    const qno = questions[currentQuestionIndex].qno;
    setMarks((prev) => {
      const newMarks = { ...prev };
      if (color) newMarks[qno] = color;
      else delete newMarks[qno];
      return newMarks;
    });
  };

  const handleResetQuestion = () => {
    const qno = questions[currentQuestionIndex].qno;
    setAnswers((prev) => {
      const updatedAnswers = { ...prev };
      delete updatedAnswers[qno];
      return updatedAnswers;
    });
  };

  const handleResetAssignment = () => {
    if (
      window.confirm(
        "Are you sure you want to reset all progress for this assignment?"
      )
    ) {
      setAnswers({});
      setNotes({});
      setMarks({});
      setCurrentQuestionIndex(0);
    }
  };

  const stats = (() => {
    let correct = 0,
      incorrect = 0;
    Object.entries(answers).forEach(([qnoStr, selected]) => {
      const q = questions.find((q) => q.qno === parseInt(qnoStr));
      if (q) q.answer === selected ? correct++ : incorrect++;
    });
    return { correct, incorrect, total: questions.length };
  })();

  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="flex h-screen bg-[#f8fafc] dark:bg-slate-950 overflow-hidden font-sans transition-colors">
      <Sidebar
        questions={questions}
        currentQuestionIndex={currentQuestionIndex}
        answers={answers}
        marks={marks}
        onSelectQuestion={setCurrentQuestionIndex}
        userEmail={user.email}
        onLogout={onLogout}
        onResetAssignment={handleResetAssignment}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        stats={stats}
        isSyncing={isSyncing}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 z-10 sticky top-0 transition-colors">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-lg transition-colors ${
                sidebarOpen
                  ? "text-gemini-600 bg-gemini-50 dark:bg-gemini-950/30"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
            >
              <Menu size={20} />
            </button>

            <button
              onClick={onBack}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              <span className="hidden md:inline font-medium text-sm">
                Dashboard
              </span>
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden md:block"></div>
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 hidden lg:block truncate max-w-[200px]">
              {assignment["asgn-display-name"]}
            </h2>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              onClick={handlePrev}
              disabled={currentQuestionIndex === 0}
              className={`flex items-center gap-1 pl-2 pr-3 py-2 rounded-lg text-sm font-medium ${
                currentQuestionIndex === 0
                  ? "text-slate-300 dark:text-slate-700"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <ChevronLeft size={18} />{" "}
              <span className="hidden sm:inline">Prev</span>
            </button>
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-md min-w-[60px] text-center">
              {currentQuestionIndex + 1} / {questions.length}
            </div>
            <button
              onClick={handleNext}
              disabled={currentQuestionIndex === questions.length - 1}
              className={`flex items-center gap-1 pl-3 pr-2 py-2 rounded-lg text-sm font-medium ${
                currentQuestionIndex === questions.length - 1
                  ? "text-slate-300 dark:text-slate-700"
                  : "bg-slate-900 dark:bg-gemini-600 text-white hover:bg-gemini-600 dark:hover:bg-gemini-500 shadow-sm shadow-slate-200 dark:shadow-none"
              }`}
            >
              <span className="hidden sm:inline">Next</span>{" "}
              <ChevronRight size={18} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scroll-smooth bg-[#f8fafc] dark:bg-slate-950">
          <div className="min-h-full p-4 md:p-12 flex flex-col">
            {currentQ && (
              <QuizCard
                key={currentQ.qno}
                question={currentQ}
                selectedOption={answers[currentQ.qno]}
                note={notes[currentQ.qno] || ""}
                markColor={marks[currentQ.qno] || null}
                onOptionSelect={handleOptionSelect}
                onUpdateNote={handleNoteUpdate}
                onMarkUpdate={handleMarkUpdate}
                onReset={handleResetQuestion}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AssignmentView;
