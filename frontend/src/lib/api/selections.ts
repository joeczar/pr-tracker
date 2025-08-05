import { http } from './http';

export interface Selection {
  id: number;
  user_id: number;
  name: string | null;
  created_at: string;
  updated_at: string;
}

export interface SelectionItem {
  id: number;
  selection_id: number;
  repository_id: number;
  pr_number: number;
  created_at: string;
}

export interface ActiveSelectionResponse {
  selection: Selection | null;
  items: SelectionItem[];
}

export const selectionsApi = {
  getActive: async (): Promise<ActiveSelectionResponse> => {
    return http.get('/api/selections/active');
  },

  ensureActive: async (): Promise<ActiveSelectionResponse> => {
    return http.post('/api/selections/active');
  },

  addItems: async (items: Array<{ repository_id: number; pr_number: number }>): Promise<{
    added: number;
    selection: Selection | null;
    items: SelectionItem[];
  }> => {
    return http.post('/api/selections/active/items', items);
  },

  removeItems: async (items: Array<{ repository_id: number; pr_number: number }>): Promise<{
    removed: number;
    selection: Selection | null;
    items: SelectionItem[];
  }> => {
    // Some environments may not allow DELETE with body; backend expects JSON body. Our http.ts supports JSON body via init.json.
    return http.delete('/api/selections/active/items', { json: items });
  },

  clearActive: async (): Promise<{ success: boolean }> => {
    return http.delete('/api/selections/active');
  },
};
