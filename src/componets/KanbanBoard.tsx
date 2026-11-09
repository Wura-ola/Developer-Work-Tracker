import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useKanbanStore } from "../store/useKanbanStore";
import { KanbanColumn } from "./KanbanColumn";

export function KanbanBoard() {
  const { columnOrder, columns, moveCard } = useKanbanStore();

  // Configure pointer (mouse/touch) and keyboard sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requires 5px drag movement before activating to prevent accidental clicks
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates, // Enables 2D arrow key movements
    }),
  );

  // Accessible ARIA Live Region announcements for screen readers
  const announcements = {
    onDragStart({ active }: { active: { id: string | number } }) {
      return `Picked up task card ${active.id}. Press Arrow keys to reorder. Press Space to drop, Escape to cancel.`;
    },
    onDragOver({
      active,
      over,
    }: {
      active: { id: string | number };
      over: { id: string | number } | null;
    }) {
      if (over) {
        return `Task ${active.id} is currently positioned over drop area ${over.id}.`;
      }
      return `Task ${active.id} is no longer over a valid drop target.`;
    },
    onDragEnd({
      active,
      over,
    }: {
      active: { id: string | number };
      over: { id: string | number } | null;
    }) {
      if (over) {
        return `Dropped task ${active.id} into location ${over.id}.`;
      }
      return `Dropped task ${active.id}. Position unchanged.`;
    },
    onDragCancel({ active }: { active: { id: string | number } }) {
      return `Cancelled dragging. Task ${active.id} returned to original position.`;
    },
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      moveCard(active.id.toString(), over.id.toString());
    }
  };

  return (
    <DndContext
      sensors={sensors}
      accessibility={{ announcements }}
      onDragEnd={handleDragEnd}
    >
      <main className="flex-1 overflow-x-auto p-6 bg-gray-100 min-h-[calc(100vh-64px)]">
        <div className="flex gap-6 items-start justify-start max-w-7xl mx-auto">
          {columnOrder.map((colId) => {
            const column = columns[colId];
            if (!column) return null;
            return <KanbanColumn key={colId} column={column} />;
          })}
        </div>
      </main>
    </DndContext>
  );
}
