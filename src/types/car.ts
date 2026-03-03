export type CarSize = 'compact' | 'sedan' | 'suv' | 'truck';

export interface CarProps {
  id: number;
  name: string;
  color: string;
  size: CarSize;
  isCrooked: boolean;
  isCovered: boolean;
  isDusty: boolean;
  stars: number;
  topics: string[];
  isPinned: boolean;
  url: string;
  description: string;
  language: string;
  lastPushed: string;
  forks: number;
}
