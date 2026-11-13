export type BoqCategory = 'concrete' | 'rebar' | 'masonry' | 'roads';

export interface SavedBoqItem {
  id: string;
  category: BoqCategory;
  categoryLabel: string;
  title: string;
  summary: string;
  metrics: { label: string; value: string }[];
  createdAtIso: string;
}
