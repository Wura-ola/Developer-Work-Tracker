import { useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Kanban,
  Search,
  Plus,
  Trash2,
  RotateCcw,
  Volume2,
  Tag,
  X,
  CheckCircle2,
} from "lucide-react";

// ==========================================
// TYPES
// ==========================================
export interface Card {
  id: string;
  title: string;
  description?: string;
  labels: string[];
}

export interface Column {
  id: string;
  title: string;
  cardIds: string[];
}

interface DeletedHistory {
  card: Card;
  columnId: string;
  index: number;
}

interface KanbanState {
  cards: Record<string, Card>;
  columns: Record<string, Column>;
  columnOrder: string[];
  deletedCardHistory: DeletedHistory | null;

  addCard: (title: string, columnId: string, labels: string[]) => void;
  moveCard: (activeId: string, overId: string) => void;
  deleteCard: (cardId: string, columnId: string) => void;
  undoDelete: () => void;
}

// ==========================================
// ZUSTAND STORE
// ==========================================
export const useKanbanStore = create<KanbanState>()(
  persist(
    (set, get) => ({
      cards: {
        "card-1": {
          id: "card-1",
          title: "Update GitHub README & Add Live Demo",
          labels: ["portfolio", "github"],
        },
        "card-2": {
          id: "card-2",
          title: "Fix Mobile Navigation Menu Bug",
          labels: ["bug", "css"],
        },
        "card-3": {
          id: "card-3",
          title: "Tailor Resume for Senior Role",
          labels: ["job-hunting"],
        },
        "card-4": {
          id: "card-4",
          title: "Build Accessible Kanban Board",
          labels: ["react", "a11y"],
        },
        "card-5": {
          id: "card-5",
          title: "Practice 2 LeetCode Problems",
          labels: ["interview"],
        },
      },
      columns: {
        todo: {
          id: "todo",
          title: "To Do",
          cardIds: ["card-1", "card-2", "card-3"],
        },
        "in-progress": {
          id: "in-progress",
          title: "In Progress",
          cardIds: ["card-4", "card-5"],
        },
        done: {
          id: "done",
          title: "Done",
          cardIds: [],
        },
      },
      columnOrder: ["todo", "in-progress", "done"],
      deletedCardHistory: null,

      addCard: (title, columnId, labels) => {
        const id = `card-${Date.now()}`;
        const newCard: Card = { id, title, labels };
        const { cards, columns } = get();

        set({
          cards: { ...cards, [id]: newCard },
          columns: {
            ...columns,
            [columnId]: {
              ...columns[columnId],
              cardIds: [...columns[columnId].cardIds, id],
            },
          },
        });
      },

      moveCard: (activeId, overId) => {
        const { columns } = get();
        let sourceColId: string | null = null;
        let targetColId: string | null = null;

        Object.values(columns).forEach((col) => {
          if (col.cardIds.includes(activeId)) sourceColId = col.id;
          if (col.cardIds.includes(overId) || col.id === overId)
            targetColId = col.id;
        });

        if (!sourceColId || !targetColId) return;

        const sourceCardIds = [...columns[sourceColId].cardIds];
        const targetCardIds =
          sourceColId === targetColId
            ? sourceCardIds
            : [...columns[targetColId].cardIds];

        const oldIndex = sourceCardIds.indexOf(activeId);
        sourceCardIds.splice(oldIndex, 1);

        const newIndex = targetCardIds.includes(overId)
          ? targetCardIds.indexOf(overId)
          : targetCardIds.length;

        targetCardIds.splice(newIndex, 0, activeId);

        set({
          columns: {
            ...columns,
            [sourceColId]: { ...columns[sourceColId], cardIds: sourceCardIds },
            [targetColId]: { ...columns[targetColId], cardIds: targetCardIds },
          },
        });
      },

      deleteCard: (cardId, columnId) => {
        const { cards, columns } = get();
        const cardToDelete = cards[cardId];
        const index = columns[columnId].cardIds.indexOf(cardId);

        const newCards = { ...cards };
        delete newCards[cardId];

        set({
          cards: newCards,
          columns: {
            ...columns,
            [columnId]: {
              ...columns[columnId],
              cardIds: columns[columnId].cardIds.filter((id) => id !== cardId),
            },
          },
          deletedCardHistory: { card: cardToDelete, columnId, index },
        });
      },

      undoDelete: () => {
        const { deletedCardHistory, cards, columns } = get();
        if (!deletedCardHistory) return;

        const { card, columnId, index } = deletedCardHistory;
        const targetCardIds = [...columns[columnId].cardIds];
        targetCardIds.splice(index, 0, card.id);

        set({
          cards: { ...cards, [card.id]: card },
          columns: {
            ...columns,
            [columnId]: { ...columns[columnId], cardIds: targetCardIds },
          },
          deletedCardHistory: null,
        });
      },
    }),
    { name: "accessible-kanban-mobile-v1" },
  ),
);

// ==========================================
// UI COMPONENTS (MOBILE ADAPTIVE)
// ==========================================

function KanbanCard({ card, columnId }: { card: Card; columnId: string }) {
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
    opacity: isDragging ? 0.3 : 1,
    touchAction: "none", // Critical for mobile touch dragging
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
      aria-label={`${card.title}. Press spacebar to grab and move.`}
      className="group relative p-4 bg-white rounded-xl shadow-sm border border-gray-200 
                 hover:shadow-md transition-all focus:outline-none focus:ring-2 
                 focus:ring-indigo-600 focus:border-transparent cursor-grab active:cursor-grabbing select-none"
    >
      <div className="flex justify-between items-start gap-2">
        <h4 className="font-semibold text-gray-800 text-sm leading-snug">
          {card.title}
        </h4>
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteCard(card.id, columnId);
          }}
          aria-label={`Delete card ${card.title}`}
          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 text-gray-400 hover:text-red-600 p-1.5 rounded transition-opacity"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {card.labels.map((label) => (
            <span
              key={label}
              className="text-[11px] font-medium px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100"
            >
              #{label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function KanbanColumn({
  column,
  searchQuery,
  selectedLabel,
}: {
  column: Column;
  searchQuery: string;
  selectedLabel: string;
}) {
  const cards = useKanbanStore((state) => state.cards);
  const { setNodeRef } = useDroppable({ id: column.id });

  const columnCards = column.cardIds
    .map((id) => cards[id])
    .filter((card): card is Card => Boolean(card))
    .filter((card) => {
      const matchesSearch = card.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesLabel = selectedLabel
        ? card.labels.includes(selectedLabel)
        : true;
      return matchesSearch && matchesLabel;
    });

  return (
    <div
      ref={setNodeRef}
      className="w-[85vw] sm:w-80 shrink-0 bg-gray-200/60 rounded-2xl p-4 flex flex-col min-h-[450px] sm:min-h-[550px] border border-gray-200/80 snap-center"
    >
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-gray-800 text-base">{column.title}</h3>
          <span className="bg-gray-300 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {columnCards.length}
          </span>
        </div>
      </div>

      <SortableContext
        items={column.cardIds}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 flex flex-col gap-3">
          {columnCards.map((card) => (
            <KanbanCard key={card.id} card={card} columnId={column.id} />
          ))}

          {columnCards.length === 0 && (
            <div className="flex-1 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center p-6 text-center text-gray-400 text-xs font-medium">
              Drop items here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ==========================================
// MAIN APP INTERFACE
// ==========================================
export default function App() {
  const {
    columnOrder,
    columns,
    moveCard,
    addCard,
    deletedCardHistory,
    undoDelete,
  } = useKanbanStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [announcementText, setAnnouncementText] = useState(
    "Keyboard navigation ready. Use Tab to focus cards, Space to lift/drop, Arrow keys to reorder.",
  );

  // Configure Mouse, Touch, and Keyboard Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 }, // 250ms hold to drag on phones
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const announcements = {
    onDragStart({ active }: { active: { id: string | number } }) {
      const text = `Picked up task card ${active.id}. Press Arrow keys to reorder, Space to drop, Escape to cancel.`;
      setAnnouncementText(text);
      return text;
    },
    onDragOver({
      active,
      over,
    }: {
      active: { id: string | number };
      over: { id: string | number } | null;
    }) {
      const text = over
        ? `Task ${active.id} positioned over ${over.id}.`
        : `Task ${active.id} not over target.`;
      setAnnouncementText(text);
      return text;
    },
    onDragEnd({
      active,
      over,
    }: {
      active: { id: string | number };
      over: { id: string | number } | null;
    }) {
      const text = over
        ? `Dropped task ${active.id} into location ${over.id}.`
        : `Dropped task ${active.id}. Position unchanged.`;
      setAnnouncementText(text);
      return text;
    },
    onDragCancel({ active }: { active: { id: string | number } }) {
      const text = `Cancelled dragging. Task ${active.id} returned to original position.`;
      setAnnouncementText(text);
      return text;
    },
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      moveCard(active.id.toString(), over.id.toString());
    }
  };

  const handleCreateCard = () => {
    const title = prompt("Enter task description:");
    if (!title) return;
    const tag = prompt("Enter tag (e.g., portfolio, bug, interview):") || "";
    addCard(title, "todo", tag ? [tag] : []);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* 1. TOP NAVBAR (RESPONSIVE FLEX) */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3.5 flex flex-col md:flex-row gap-3 md:items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-lg shrink-0">
              <Kanban className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-base sm:text-lg leading-none">
                Developer Work Tracker
              </h1>
              <span className="text-[11px] sm:text-xs text-gray-500 font-medium">
                Accessible Mobile Board
              </span>
            </div>
          </div>

          {/* Add Task Button for Mobile Screen Header */}
          <button
            onClick={handleCreateCard}
            className="md:hidden flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        {/* Search & Tag Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-100 text-sm border-0 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tag Filter */}
          <div className="relative flex items-center w-full sm:w-auto">
            <Tag className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
            <select
              value={selectedLabel}
              onChange={(e) => setSelectedLabel(e.target.value)}
              className="w-full sm:w-auto pl-9 pr-8 py-2 bg-gray-100 text-sm border-0 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:bg-white appearance-none cursor-pointer text-gray-700"
            >
              <option value="">All Tags</option>
              <option value="portfolio">#portfolio</option>
              <option value="bug">#bug</option>
              <option value="job-hunting">#job-hunting</option>
              <option value="react">#react</option>
              <option value="interview">#interview</option>
            </select>
          </div>

          {/* Add Task Button for Desktop */}
          <button
            onClick={handleCreateCard}
            className="hidden md:flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all focus:ring-2 focus:ring-indigo-600 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </header>

      {/* 2. ACCESSIBILITY LIVE ANNOUNCER BANNER */}
      <div className="bg-indigo-900 text-indigo-100 px-4 sm:px-6 py-2 text-[11px] sm:text-xs flex items-center gap-2 font-medium">
        <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400 shrink-0 animate-pulse" />
        <span className="hidden sm:inline">
          Screen Reader Live Announcement:
        </span>
        <span className="text-white font-mono truncate bg-indigo-800/80 px-2 py-0.5 rounded border border-indigo-700">
          {announcementText}
        </span>
      </div>

      {/* 3. MAIN BOARD BOARD AREA (SWIPEABLE HORIZONTAL CAROUSEL ON MOBILE) */}
      <DndContext
        sensors={sensors}
        accessibility={{ announcements }}
        onDragEnd={handleDragEnd}
      >
        <main className="flex-1 p-4 sm:p-8 overflow-x-auto snap-x snap-mandatory">
          <div className="flex gap-4 sm:gap-6 items-start max-w-7xl mx-auto">
            {columnOrder.map((colId) => {
              const column = columns[colId];
              if (!column) return null;
              return (
                <KanbanColumn
                  key={colId}
                  column={column}
                  searchQuery={searchQuery}
                  selectedLabel={selectedLabel}
                />
              );
            })}
          </div>
        </main>
      </DndContext>

      {/* 4. UNDO TOAST NOTIFICATION BANNER */}
      {deletedCardHistory && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-gray-900 text-white px-4 sm:px-5 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 z-50 animate-in slide-in-from-bottom-5 duration-200 left-4 sm:left-auto"
        >
          <div className="flex items-center gap-2 truncate">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-xs sm:text-sm truncate">
              Deleted{" "}
              <span className="font-semibold text-indigo-300">
                "{deletedCardHistory.card.title}"
              </span>
            </p>
          </div>
          <button
            onClick={undoDelete}
            className="flex items-center gap-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-all focus:ring-2 focus:ring-indigo-400 shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
