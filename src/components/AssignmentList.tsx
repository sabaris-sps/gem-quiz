import React from "react";
import { Assignment, QuizProgress } from "../types";
import {
  Book,
  ChevronRight,
  CheckCircle2,
  Clock,
  Moon,
  Sun,
} from "lucide-react";

interface AssignmentListProps {
  assignments: Assignment[];
  progress: QuizProgress | null;
  onSelect: (assignment: Assignment) => void;
  onLogout: () => void;
  userEmail: string | null;
  darkMode: boolean;
  toggleTheme: () => void;
}

const AssignmentList: React.FC<AssignmentListProps> = ({
  assignments,
  progress,
  onSelect,
  onLogout,
  userEmail,
  darkMode,
  toggleTheme,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12 transition-colors">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              My Assignments
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Welcome back,{" "}
              <span className="text-gemini-600 dark:text-gemini-400 font-semibold">
                {userEmail}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={onLogout}
              className="px-6 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              Sign Out
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((asgn) => {
            const asgnProgress =
              progress?.assignments[asgn["asgn-unique-name"]];
            const answeredCount = Object.keys(
              asgnProgress?.answers || {}
            ).length;
            const isCompleted =
              answeredCount > 0 && answeredCount >= asgn.num_of_questions;
            const lastActive = asgnProgress?.lastUpdated
              ? new Date(asgnProgress.lastUpdated).toLocaleDateString()
              : "Not started";

            return (
              <div
                key={asgn["asgn-unique-name"]}
                onClick={() => onSelect(asgn)}
                className="group relative bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-gemini-300 dark:hover:border-gemini-600 transition-all cursor-pointer overflow-hidden flex flex-col h-full"
              >
                <div className="flex items-start justify-between mb-6">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      isCompleted
                        ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                        : "bg-gemini-50 dark:bg-gemini-950/30 text-gemini-600 dark:text-gemini-400"
                    }`}
                  >
                    <Book size={24} />
                  </div>
                  {isCompleted ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-full">
                      <CheckCircle2 size={12} />
                      Completed
                    </div>
                  ) : answeredCount > 0 ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider rounded-full">
                      <Clock size={12} />
                      In Progress
                    </div>
                  ) : null}
                </div>

                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-gemini-600 dark:group-hover:text-gemini-400 transition-colors">
                  {asgn["asgn-display-name"]}
                </h3>

                <div className="space-y-3 mt-auto pt-6">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-400 dark:text-slate-500">
                    <span>Questions</span>
                    <span className="text-slate-600 dark:text-slate-300">
                      {asgn.num_of_questions}
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isCompleted ? "bg-emerald-500" : "bg-gemini-500"
                      }`}
                      style={{
                        width: `${
                          (answeredCount / (asgn.num_of_questions || 1)) * 100
                        }%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">
                      Last activity: {lastActive}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-gemini-600 group-hover:text-white transition-all">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AssignmentList;
