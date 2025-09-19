// Shared types for the application

export interface User {
  id: string;
  name?: string;
  email?: string;
  picture?: string;
}

export interface Document {
  id: string;
  name: string;
  mime_type?: string;
  mimeType?: string; // Fallback for different API response formats
  created_time?: string;
  modified_time?: string;
  web_view_link?: string;
  size?: string;
  parent_id?: string;
  is_folder?: boolean;
  file_extension?: string;
  source_subfolder?: string;
}

export interface KnowledgeBaseDocument {
  id: string;
  name: string;
  mime_type: string;
  chunk_count: number;
}

export interface Folder {
  id: string;
  name: string;
  mime_type?: string;
  web_view_link?: string;
  parent_id?: string;
  modified_time?: string;
  size?: string;
}
