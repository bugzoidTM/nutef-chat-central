
export interface QuickResponseCategory {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuickResponse {
  id: string;
  title: string;
  content: string;
  category_id: string | null;
  sector_id: string | null;
  is_active: boolean;
  usage_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  category?: QuickResponseCategory;
}

export interface CreateQuickResponseData {
  title: string;
  content: string;
  category_id?: string;
  sector_id?: string;
}

export interface UpdateQuickResponseData {
  title?: string;
  content?: string;
  category_id?: string;
  is_active?: boolean;
}
