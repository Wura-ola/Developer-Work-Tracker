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
