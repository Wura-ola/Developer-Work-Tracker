import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Column, Card } from "../types/Kanban";
import { KanbanCard } from "./KanbanCard";
import { useKanbanStore } from "../store/useKanbanStore";

interface KanbanColumnProps {
  column: Column;
}

export function KanbanColumn({ column }: KanbanColumnProps) {
  // Access global cards state dictionary
  const cards = useKanbanStore((state) => state.cards);

  // Make the column container droppable
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  // Map array of card IDs to actual Card objects
  const columnCards = column.cardIds
    .map((id) => cards[id])
    .filter((card): card is Card => Boolean(card));

  return (
    <div
      ref={setNodeRef}
      className="w-80 bg-gray-200/60 rounded-xl p-4 flex flex-col min-h-[500px]"
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-700 text-lg">{column.title}</h3>
        <span className="bg-gray-300 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full">
          {columnCards.length}
        </span>
      </div>

      {/* Sortable Context for Draggable Cards */}
      <SortableContext
        items={column.cardIds}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 flex flex-col gap-2">
          {columnCards.map((card) => (
            <KanbanCard key={card.id} card={card} columnId={column.id} />
          ))}

          {columnCards.length === 0 && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-400 text-sm">
              Drop tasks here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
