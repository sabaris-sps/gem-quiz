import React, { useState } from "react";
import { Question } from "../types";
import {
  LogOut,
  BookOpen,
  Menu,
  X,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CloudCheck,
  CloudUpload,
} from "lucide-react";
import Stats from "./Stats";

interface SidebarProps {
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<number, string>;
  onSelectQuestion: (index: number) => void;
  userEmail: string | null;
  onLogout: () => void;
  onResetAssignment: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  stats: {
    correct: number;
    incorrect: number;
    total: number;
  };
  isSyncing?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  questions,
  currentQuestionIndex,
  answers,
  onSelectQuestion,
  userEmail,
  onLogout,
  onResetAssignment,
  isOpen,
  setIsOpen,
  stats,
  isSyncing = false,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  return (
    <>
      {/* Overlay for mobile - only active when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={`
          fixed md:relative top-0 left-0 h-full bg-white border-r border-slate-200 z-40
          transition-[width,transform,opacity] duration-300 ease-in-out flex flex-col overflow-hidden
          ${
            isOpen
              ? "w-80 translate-x-0"
              : "-translate-x-full w-80 md:w-0 md:translate-x-0 md:border-none"
          }
        `}
      >
        {/* Inner container with fixed width to prevent content squashing during collapse */}
        <div className="w-80 flex flex-col h-full">
          <div className="p-6 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-gemini-600 font-bold text-xl mb-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-gemini-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-gemini-200/50">
                <Sparkles size={16} />
              </div>
              <span>Salt Analysis</span>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-2 space-y-6">
            {/* Stats Widget */}
            <Stats
              total={stats.total}
              correct={stats.correct}
              incorrect={stats.incorrect}
            />

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Question Map
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const isAnswered = answers[q.qno] !== undefined;
                  const isCurrent = idx === currentQuestionIndex;
                  const isCorrect = isAnswered && answers[q.qno] === q.answer;
                  const isWrong = isAnswered && !isCorrect;

                  let btnClass =
                    "h-9 w-full rounded-md text-xs font-medium transition-all duration-200 flex items-center justify-center border ";

                  if (isCurrent) {
                    btnClass +=
                      "ring-2 ring-offset-1 ring-gemini-500 border-gemini-600 bg-gemini-600 text-white shadow-md shadow-gemini-200";
                  } else if (isCorrect) {
                    btnClass +=
                      "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200";
                  } else if (isWrong) {
                    btnClass +=
                      "bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200";
                  } else {
                    btnClass +=
                      "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:border-slate-300";
                  }

                  return (
                    <button
                      key={q.qno}
                      onClick={() => {
                        onSelectQuestion(idx);
                        if (window.innerWidth < 768) setIsOpen(false);
                      }}
                      className={btnClass}
                      aria-label={`Go to question ${q.qno}`}
                    >
                      {q.qno}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50/50">
            {/* Sync Status Indicator */}
            <div className="mb-4 flex items-center justify-center">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-500 ${
                  isSyncing
                    ? "text-amber-600 bg-amber-50 border border-amber-100"
                    : "text-emerald-600 bg-emerald-50 border border-emerald-100"
                }`}
              >
                {isSyncing ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                    <span>Syncing Progress...</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span>Cloud Synced</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-gemini-600 font-bold shadow-sm">
                {userEmail ? userEmail[0].toUpperCase() : "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {userEmail ? userEmail.split("@")[0] : "User"}
                </p>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                  Student Account
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {showResetConfirm ? (
                <div className="p-3 bg-white border border-rose-200 rounded-xl shadow-sm animate-fade-in">
                  <div className="flex items-center gap-2 text-rose-600 mb-2">
                    <AlertTriangle size={16} />
                    <span className="text-xs font-bold uppercase">
                      Are you sure?
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3 leading-tight">
                    This will clear all your answers and progress.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="flex-1 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        onResetAssignment();
                        setShowResetConfirm(false);
                      }}
                      className="flex-1 py-1.5 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-colors"
                >
                  <RefreshCw size={14} />
                  Reset Assignment
                </button>
              )}

              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
