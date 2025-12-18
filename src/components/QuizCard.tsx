import React, { useState, useEffect, useRef } from "react";
import { Question } from "../types";
import {
  Lightbulb,
  BookOpen,
  Check,
  X,
  RotateCcw,
  StickyNote,
  Save,
  Bookmark,
} from "lucide-react";

interface QuizCardProps {
  question: Question;
  selectedOption: string | undefined;
  note: string;
  markColor: string | null;
  onOptionSelect: (option: string) => void;
  onUpdateNote: (note: string) => void;
  onMarkUpdate: (color: string | null) => void;
  onReset: () => void;
}

const MARKER_COLORS = [
  { id: "rose", class: "bg-rose-500" },
  { id: "amber", class: "bg-amber-500" },
  { id: "emerald", class: "bg-emerald-500" },
  { id: "sky", class: "bg-sky-500" },
  { id: "indigo", class: "bg-indigo-500" },
];

const QuizCard: React.FC<QuizCardProps> = ({
  question,
  selectedOption,
  note,
  markColor,
  onOptionSelect,
  onUpdateNote,
  onMarkUpdate,
  onReset,
}) => {
  const [showHint, setShowHint] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isMarkingExpanded, setIsMarkingExpanded] = useState(false);

  // Local state to manage note input before saving
  const [localNote, setLocalNote] = useState(note);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const markerRef = useRef<HTMLDivElement>(null);
  const isAnswered = selectedOption !== undefined;

  // Update localNote when note prop changes (e.g. during sync)
  useEffect(() => {
    setLocalNote(note);
    setHasUnsavedChanges(false);
  }, [note]);

  // Close marker picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        markerRef.current &&
        !markerRef.current.contains(event.target as Node)
      ) {
        setIsMarkingExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
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

          <div className="flex items-center gap-3">
            {/* Expandable Marker Color Picker */}
            <div
              ref={markerRef}
              className={`
                    flex items-center transition-all duration-300 ease-in-out h-9 overflow-hidden
                    bg-slate-100 border border-slate-200 shadow-sm rounded-full
                    ${
                      isMarkingExpanded
                        ? "px-3 gap-3"
                        : "px-2 w-9 justify-center cursor-pointer hover:bg-slate-200"
                    }
                  `}
              onClick={() => !isMarkingExpanded && setIsMarkingExpanded(true)}
            >
              <button
                onClick={(e) => {
                  if (isMarkingExpanded) {
                    e.stopPropagation();
                    setIsMarkingExpanded(false);
                  }
                }}
                className={`transition-colors ${
                  markColor
                    ? markColor.replace("bg-", "text-")
                    : "text-slate-400"
                }`}
              >
                <Bookmark
                  size={16}
                  fill={markColor ? "currentColor" : "none"}
                />
              </button>

              {isMarkingExpanded && (
                <div className="flex items-center gap-2 animate-fade-in">
                  {MARKER_COLORS.map((color) => (
                    <button
                      key={color.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkUpdate(
                          markColor === color.class ? null : color.class
                        );
                      }}
                      className={`w-4 h-4 rounded-full transition-all hover:scale-125 ${
                        color.class
                      } ${
                        markColor === color.class
                          ? "ring-2 ring-offset-2 ring-slate-400"
                          : "opacity-60 hover:opacity-100"
                      }`}
                      title={`Mark as ${color.id}`}
                    />
                  ))}
                  <div className="w-px h-4 bg-slate-300 mx-0.5"></div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkUpdate(null);
                    }}
                    className="p-1 hover:bg-slate-200 rounded-md transition-colors"
                    title="Clear mark"
                  >
                    <X size={12} className="text-slate-400" />
                  </button>
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
            {question.solution ? (
              <p className="text-slate-600 leading-relaxed">
                {question.solution}
              </p>
            ) : (
              <p className="text-slate-400 italic text-sm leading-relaxed">
                Explanation not available
              </p>
            )}
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
                💡{" "}
                {question.hint ? (
                  <span className="italic">{question.hint}</span>
                ) : (
                  <span className="text-slate-400 italic">
                    Hint not available
                  </span>
                )}
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
