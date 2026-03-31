export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface GarmentItem {
  id: string;
  user_id: string;
  name: string;
  brand?: string;
  category: string;
  color?: string;
  image_url?: string;
  created_at: string;
}

export interface Fit {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  items: GarmentItem[];
  created_at: string;
}
