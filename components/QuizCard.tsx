import React, { useState } from "react";
import { Question } from "../types";
import {
  Lightbulb,
  BookOpen,
  Check,
  X,
  RotateCcw,
  StickyNote,
  Save,
} from "lucide-react";

interface QuizCardProps {
  question: Question;
  selectedOption: string | undefined;
  note: string;
  onOptionSelect: (option: string) => void;
  onUpdateNote: (note: string) => void;
  onReset: () => void;
}

const QuizCard: React.FC<QuizCardProps> = ({
  question,
  selectedOption,
  note,
  onOptionSelect,
  onUpdateNote,
  onReset,
}) => {
  const [showHint, setShowHint] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);

  // Local state to manage note input before saving
  const [localNote, setLocalNote] = useState(note);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const isAnswered = selectedOption !== undefined;

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalNote(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleSaveNote = () => {
    onUpdateNote(localNote);
    setHasUnsavedChanges(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in pb-20">
      {/* Question Header - Flattened */}
      <div className="mb-8 md:mb-12">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-gemini-100 text-gemini-700 text-xs font-bold uppercase tracking-wider">
              Question {question.qno}
            </span>
            {question.page_ref && (
              <div
                className="flex items-center gap-1.5 text-xs font-medium text-slate-400"
                title="Reference Page"
              >
                <BookOpen size={14} />
                <span>Ref: Pg {question.page_ref}</span>
              </div>
            )}
          </div>

          {isAnswered && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
              title="Clear answer and reattempt"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>

        <h2 className="text-2xl md:text-4xl font-medium text-slate-800 leading-tight">
          {question.question_text}
        </h2>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {question.options.map((option, idx) => {
          const isSelected = selectedOption === option;
          const isThisCorrect = option === question.answer;

          let containerClass =
            "relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex items-center justify-between group ";

          if (!isAnswered) {
            containerClass +=
              "bg-white border-transparent shadow-sm hover:shadow-md hover:border-gemini-300 hover:bg-white";
          } else {
            if (isSelected && isThisCorrect) {
              containerClass += "bg-emerald-50 border-emerald-500 shadow-md";
            } else if (isSelected && !isThisCorrect) {
              containerClass += "bg-rose-50 border-rose-500 shadow-md";
            } else if (!isSelected && isThisCorrect) {
              containerClass +=
                "bg-white border-emerald-200 border-dashed opacity-100";
            } else {
              containerClass += "bg-slate-100/50 border-transparent opacity-60";
            }
          }

          return (
            <div
              key={idx}
              onClick={() => !isAnswered && onOptionSelect(option)}
              className={containerClass}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`
                    w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-colors
                    ${
                      !isAnswered
                        ? "bg-slate-100 text-slate-500 group-hover:bg-gemini-100 group-hover:text-gemini-600"
                        : ""
                    }
                    ${
                      isAnswered && isSelected && isThisCorrect
                        ? "bg-emerald-500 text-white"
                        : ""
                    }
                    ${
                      isAnswered && isSelected && !isThisCorrect
                        ? "bg-rose-500 text-white"
                        : ""
                    }
                    ${
                      isAnswered && !isSelected && isThisCorrect
                        ? "bg-emerald-200 text-emerald-700"
                        : ""
                    }
                    ${
                      isAnswered && !isSelected && !isThisCorrect
                        ? "bg-slate-200 text-slate-400"
                        : ""
                    }
                `}
                >
                  {String.fromCharCode(65 + idx)}
                </div>
                <span
                  className={`text-base ${
                    isAnswered && isSelected ? "font-semibold" : "font-medium"
                  } text-slate-700`}
                >
                  {option}
                </span>
              </div>

              {isAnswered && isSelected && isThisCorrect && (
                <Check className="text-emerald-500" />
              )}
              {isAnswered && isSelected && !isThisCorrect && (
                <X className="text-rose-500" />
              )}
            </div>
          );
        })}
      </div>

      {/* Interactions Area */}
      <div className="space-y-6">
        {/* Solution Section */}
        {isAnswered && (
          <div className="animate-slide-up bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gemini-500"></div>
            <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <span className="text-lg">🎓</span> Explanation
            </h4>
            <p className="text-slate-600 leading-relaxed">
              {question.solution}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hint Section */}
          <div>
            <button
              onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-gemini-600 transition-colors mb-2 ml-1"
            >
              <Lightbulb size={16} />
              {showHint ? "Hide Hint" : "Show Hint"}
            </button>

            <div
              className={`
                    overflow-hidden transition-all duration-300 ease-in-out
                    ${showHint ? "max-h-32 opacity-100" : "max-h-0 opacity-0"}
                `}
            >
              <div className="p-4 bg-yellow-50 text-yellow-900 text-sm rounded-2xl border border-yellow-200/60 inline-block w-full">
                💡 <span className="italic">{question.hint}</span>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="flex flex-col items-start md:items-end">
            <button
              onClick={() => setIsEditingNote(!isEditingNote)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors mb-2 mr-1
                        ${
                          localNote
                            ? "text-gemini-600"
                            : "text-slate-500 hover:text-gemini-600"
                        }
                    `}
            >
              <StickyNote size={16} />
              {isEditingNote
                ? "Close Notes"
                : localNote
                ? "Edit Note"
                : "Add Note"}
            </button>

            <div
              className={`
                    w-full overflow-hidden transition-all duration-300 ease-in-out
                    ${
                      isEditingNote || localNote
                        ? "opacity-100 max-h-72"
                        : "opacity-0 max-h-0"
                    }
                `}
            >
              <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm">
                <textarea
                  value={localNote}
                  onChange={handleNoteChange}
                  placeholder="Write your notes here..."
                  className="w-full h-32 p-3 pb-12 rounded-2xl bg-transparent text-sm text-slate-700 focus:ring-2 focus:ring-gemini-500 focus:border-transparent outline-none resize-none"
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-3">
                  {hasUnsavedChanges && (
                    <span className="text-xs text-rose-500 font-medium animate-pulse">
                      Unsaved changes
                    </span>
                  )}
                  <button
                    onClick={handleSaveNote}
                    disabled={!hasUnsavedChanges}
                    className={`
                                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                                    ${
                                      hasUnsavedChanges
                                        ? "bg-gemini-600 text-white hover:bg-gemini-700 shadow-md transform active:scale-95"
                                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    }
                                `}
                  >
                    <Save size={14} />
                    {hasUnsavedChanges ? "Save Note" : "Saved"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizCard;
