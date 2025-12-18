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
  Bug,
  CheckCircle2,
  Loader2,
  Bookmark,
} from "lucide-react";
import Stats from "./Stats";

interface SidebarProps {
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<number, string>;
  marks: Record<number, string>;
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
  marks,
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
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-gemini-600 font-bold text-lg">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-gemini-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-gemini-200/50">
                <Sparkles size={14} />
              </div>
              <span className="truncate max-w-[120px]">Salt Analysis</span>
            </div>

            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-50 border border-slate-100"
                title={isSyncing ? "Syncing to cloud..." : "All changes saved"}
              >
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider ${
                    isSyncing
                      ? "text-amber-500 animate-pulse"
                      : "text-emerald-500"
                  }`}
                >
                  {isSyncing ? "Syncing" : "Synced"}
                </span>
                {isSyncing ? (
                  <Loader2 size={12} className="text-amber-500 animate-spin" />
                ) : (
                  <CheckCircle2 size={12} className="text-emerald-500" />
                )}
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="md:hidden p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-2 space-y-5">
            <Stats
              total={stats.total}
              correct={stats.correct}
              incorrect={stats.incorrect}
            />

            <div>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
                Question Map
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const isAnswered = answers[q.qno] !== undefined;
                  const isCurrent = idx === currentQuestionIndex;
                  const isCorrect = isAnswered && answers[q.qno] === q.answer;
                  const isWrong = isAnswered && !isCorrect;
                  const markColor = marks[q.qno];

                  let btnClass =
                    "relative h-8 w-full rounded-lg text-[11px] font-semibold transition-all duration-200 flex items-center justify-center border overflow-hidden ";

                  if (isCurrent) {
                    btnClass +=
                      "ring-2 ring-offset-1 ring-gemini-500 border-gemini-600 bg-gemini-600 text-white shadow-md shadow-gemini-200";
                  } else if (isCorrect) {
                    btnClass +=
                      "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100";
                  } else if (isWrong) {
                    btnClass +=
                      "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100";
                  } else {
                    btnClass +=
                      "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100 hover:border-slate-200";
                  }

                  return (
                    <button
                      key={q.qno}
                      onClick={() => {
                        onSelectQuestion(idx);
                        if (window.innerWidth < 768) setIsOpen(false);
                      }}
                      className={btnClass}
                    >
                      {/* Bookmark Icon Indicator (Small icon in top right corner) */}
                      {markColor && (
                        <div className="absolute top-0.5 right-0.5 pointer-events-none">
                          <Bookmark
                            size={10}
                            className={markColor.replace("bg-", "text-")}
                            fill="currentColor"
                          />
                        </div>
                      )}
                      {q.qno}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-gemini-600 font-bold text-[10px] shadow-sm flex-shrink-0">
                  {userEmail ? userEmail[0].toUpperCase() : "U"}
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p
                    className="text-[10px] font-semibold text-slate-700 truncate"
                    title={userEmail || ""}
                  >
                    {userEmail || "Guest User"}
                  </p>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0"
                title="Sign Out"
              >
                <LogOut size={14} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {showResetConfirm ? (
                <div className="flex-1 flex items-center gap-2 animate-fade-in bg-white p-1 rounded-lg border border-rose-100">
                  <button
                    onClick={() => {
                      onResetAssignment();
                      setShowResetConfirm(false);
                    }}
                    className="flex-1 py-1 text-[9px] font-bold text-white bg-rose-500 rounded-md hover:bg-rose-600"
                  >
                    Confirm Reset
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-2 py-1 text-slate-400"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[9px] font-bold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition-colors"
                >
                  <RefreshCw size={11} />
                  Reset Progress
                </button>
              )}

              <a
                href="mailto:spssabaris@gmail.com?subject=Salt Analysis App Bug Report"
                className="p-1.5 text-slate-400 hover:text-gemini-600 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
                title="Report Bug"
              >
                <Bug size={14} />
              </a>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
