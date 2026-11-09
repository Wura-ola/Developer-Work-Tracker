import { describe, it, expect, beforeEach } from "vitest";
import { useKanbanStore } from "./useKanbanStore";

describe("Kanban Store Integration Tests", () => {
  beforeEach(() => {
    // Reset Zustand store state before each test run
    useKanbanStore.setState({
      cards: {
        "card-1": { id: "card-1", title: "Write tests", labels: [] },
      },
      columns: {
        todo: { id: "todo", title: "To Do", cardIds: ["card-1"] },
        done: { id: "done", title: "Done", cardIds: [] },
      },
      columnOrder: ["todo", "done"],
      deletedCardHistory: null,
    });
  });

  it("correctly deletes a card and stores it in history", () => {
    const store = useKanbanStore.getState();
    store.deleteCard("card-1", "todo");

    const updatedState = useKanbanStore.getState();
    expect(updatedState.cards["card-1"]).toBeUndefined();
    expect(updatedState.columns["todo"].cardIds).not.toContain("card-1");
    expect(updatedState.deletedCardHistory?.card.title).toBe("Write tests");
  });

  it("restores deleted card back to its exact original column position when undo is clicked", () => {
    const store = useKanbanStore.getState();

    // Step 1: Delete item
    store.deleteCard("card-1", "todo");
    expect(useKanbanStore.getState().cards["card-1"]).toBeUndefined();

    // Step 2: Perform Undo
    store.undoDelete();
    const restoredState = useKanbanStore.getState();

    expect(restoredState.cards["card-1"]).toBeDefined();
    expect(restoredState.columns["todo"].cardIds).toContain("card-1");
    expect(restoredState.deletedCardHistory).toBeNull();
  });
});
