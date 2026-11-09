import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Card, Column } from "../types/Kanban";

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

  moveCard: (activeId: string, overId: string) => void;
  deleteCard: (cardId: string, columnId: string) => void;
  undoDelete: () => void;
}

export const useKanbanStore = create<KanbanState>()(
  persist(
    (set, get) => ({
      cards: {
        "card-1": {
          id: "card-1",
          title: "Setup Accessibility",
          labels: ["a11y"],
        },
        "card-2": {
          id: "card-2",
          title: "Write Zustand Store",
          labels: ["state"],
        },
      },
      columns: {
        todo: { id: "todo", title: "To Do", cardIds: ["card-1"] },
        "in-progress": {
          id: "in-progress",
          title: "In Progress",
          cardIds: ["card-2"],
        },
        done: { id: "done", title: "Done", cardIds: [] },
      },
      columnOrder: ["todo", "in-progress", "done"],
      deletedCardHistory: null,

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
    { name: "accessible-kanban-storage" },
  ),
);
