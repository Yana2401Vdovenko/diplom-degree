export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface ArchiveRow {
  id: string;
  Таблиця: string;
  Ключ_запису: string;
  Дані: Json;
  Назва: string | null;
  Дата_архівації: string;
  Архівував: string | null;
}

export interface TeacherTypeRow {
  Код_типу: string;
  Назва_типу: string | null;
}

export interface PositionRow {
  Код_посади: string;
  Назва: string | null;
}

export interface TeacherStatusRow {
  Код_статусу_викладача: string;
  Назва_статусу_викладача: string | null;
}

export interface WorkloadRow {
  Код_статусу_викладача: string;
  Години: number | null;
}

export interface StudyFormRow {
  Код_форми_навчання: string;
  Назва_форми_навчання: string | null;
}

export interface EducationLevelRow {
  Код_рівня_навчання: string;
  Назва_рівня_навчання: string | null;
}

export interface Database {
  public: {
    Tables: {
      Архів: {
        Row: ArchiveRow;
        Insert: Omit<ArchiveRow, 'id' | 'Дата_архівації'> & {
          id?: string;
          Дата_архівації?: string;
        };
        Update: Partial<ArchiveRow>;
        Relationships: [];
      };
      Тип_викладача: {
        Row: TeacherTypeRow;
        Insert: TeacherTypeRow;
        Update: Partial<TeacherTypeRow>;
        Relationships: [];
      };
      Посада: {
        Row: PositionRow;
        Insert: PositionRow;
        Update: Partial<PositionRow>;
        Relationships: [];
      };
      Статус_викладача: {
        Row: TeacherStatusRow;
        Insert: TeacherStatusRow;
        Update: Partial<TeacherStatusRow>;
        Relationships: [];
      };
      Навантаження: {
        Row: WorkloadRow;
        Insert: WorkloadRow;
        Update: Partial<WorkloadRow>;
        Relationships: [];
      };
      Форма_навчання: {
        Row: StudyFormRow;
        Insert: StudyFormRow;
        Update: Partial<StudyFormRow>;
        Relationships: [];
      };
      Рівень_навчання: {
        Row: EducationLevelRow;
        Insert: EducationLevelRow;
        Update: Partial<EducationLevelRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type DirectoryTableName =
  | 'Тип_викладача'
  | 'Посада'
  | 'Статус_викладача'
  | 'Навантаження'
  | 'Форма_навчання'
  | 'Рівень_навчання';

export type DirectoryRow =
  | TeacherTypeRow
  | PositionRow
  | TeacherStatusRow
  | WorkloadRow
  | StudyFormRow
  | EducationLevelRow;
