// src/components/UndoToast.tsx
import { useKanbanStore } from "../store/useKanbanStore";
import { RotateCcw } from "lucide-react";

export function UndoToast() {
  const { deletedCardHistory, undoDelete } = useKanbanStore();

  if (!deletedCardHistory) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-4 z-50 animate-bounce"
    >
      <p className="text-sm">
        Deleted task{" "}
        <span className="font-semibold text-indigo-300">
          "{deletedCardHistory.card.title}"
        </span>
      </p>
      <button
        onClick={undoDelete}
        className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors focus:ring-2 focus:ring-indigo-300"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Undo
      </button>
    </div>
  );
}
