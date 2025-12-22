import React from "react";
import { PieChart, CheckCircle2, XCircle } from "lucide-react";

interface StatsProps {
  total: number;
  correct: number;
  incorrect: number;
}

const Stats: React.FC<StatsProps> = ({ total, correct, incorrect }) => {
  const answered = correct + incorrect;
  const percentage = total > 0 ? Math.round((answered / total) * 100) : 0;
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 transition-colors space-y-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Progress
        </span>
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {percentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gemini-500 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 pt-1">
        <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center">
          <span className="text-emerald-600 dark:text-emerald-400 font-bold text-base">
            {correct}
          </span>
          <span className="text-[8px] uppercase text-slate-400 dark:text-slate-500 font-bold tracking-tight">
            Correct
          </span>
        </div>
        <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center">
          <span className="text-rose-500 dark:text-rose-400 font-bold text-base">
            {incorrect}
          </span>
          <span className="text-[8px] uppercase text-slate-400 dark:text-slate-500 font-bold tracking-tight">
            Wrong
          </span>
        </div>
        <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center">
          <span className="text-indigo-600 dark:text-indigo-400 font-bold text-base">
            {accuracy}%
          </span>
          <span className="text-[8px] uppercase text-slate-400 dark:text-slate-500 font-bold tracking-tight">
            Accuracy
          </span>
        </div>
      </div>
    </div>
  );
};

export default Stats;
