export interface NotionPost {
  id: string;
  num: number | string;
  title: string;
  formato: string;
  herramientas: string[];
  estatus: string;
  canal: string[];
  linkCanva: string;
  slides: number | string;
  pilar: string;
  caption: string;
}

export interface Slide {
  type: 'cover' | 'content' | 'cta';
  text: string;
  title?: string;
  subtitle?: string;
  heading?: string;
  body?: string;
}

export interface GeneratedData {
  title?: string;
  slides: Slide[];
  hashtags: string[];
  caption: string;
}

export type FilterType = 'all' | 'carrusel' | 'canva' | 'sinlink';

export type StepNumber = 1 | 2 | 3 | 4;

export interface AppState {
  step: StepNumber;
  posts: NotionPost[];
  selectedPost: NotionPost | null;
  canvaDesignId: string;
  genData: GeneratedData | null;
  filter: FilterType;
  apiKeys: {
    anthropic: string;
    notion: string;
    canva: string;
  };
}
