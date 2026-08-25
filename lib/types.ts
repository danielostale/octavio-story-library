export type StoryMode = "historical" | "personal";
export type StoryLanguage = "es" | "fr" | "en";

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  traits: string[];
  likes: string[];
  notes: string;
  photoFileIds?: string[];
}

export interface FamilyMemory {
  id: string;
  title: string;
  detail: string;
  people: string[];
  date?: string;
}

export interface FamilyProfile {
  version: number;
  members: FamilyMember[];
  memories: FamilyMemory[];
  updatedAt: string;
}

export interface StoryRequest {
  topic: string;
  mode: StoryMode;
  language: StoryLanguage;
  durationMinutes: number;
  rawNotes?: string;
}

export interface Story {
  id: string;
  title: string;
  mode: StoryMode;
  language: StoryLanguage;
  durationMinutes: number;
  childAgeLabel: string;
  createdAt: string;
  story: string;
  reflection: string;
  illustrationScenes: Array<{
    title: string;
    description: string;
  }>;
}

export interface LibraryEntry {
  id: string;
  title: string;
  mode: StoryMode;
  language: StoryLanguage;
  durationMinutes: number;
  createdAt: string;
  folderId: string;
  jsonFileId: string;
  markdownFileId: string;
}
