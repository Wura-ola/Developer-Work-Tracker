import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Card } from "../types/Kanban";
import { useKanbanStore } from "../store/useKanbanStore";
import { Trash2 } from "lucide-react";

interface KanbanCardProps {
  card: Card;
  columnId: string;
}

export function KanbanCard({ card, columnId }: KanbanCardProps) {
  const deleteCard = useKanbanStore((state) => state.deleteCard);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      tabIndex={0}
      role="button"
      aria-roledescription="sortable task item"
      aria-label={`${card.title}. Press spacebar to grab and reorder.`}
      className="group relative p-4 mb-3 bg-white rounded-lg shadow-sm border border-gray-200 
                 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-grab active:cursor-grabbing"
    >
      <div className="flex justify-between items-start">
        <h4 className="font-medium text-gray-900">{card.title}</h4>
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteCard(card.id, columnId);
          }}
          aria-label={`Delete task ${card.title}`}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-gray-400 hover:text-red-600 p-1"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {card.labels.map((label) => (
            <span
              key={label}
              className="text-xs px-2 py-0.5 font-medium bg-indigo-50 text-indigo-700 rounded-md"
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
