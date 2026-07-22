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

export interface FacultyRow {
  Код_факультету_нні: string;
  Назва_факультету_нні: string | null;
  Декан_факультету_нні: string | null;
  Телефон_факультету_нні: string | null;
  Адреса_факультету_нні: string | null;
  Email_факультету_нні: string | null;
  Корпус_деканату_факультету_нні: string | null;
}

export interface DepartmentRow {
  Код_кафедри: string;
  Код_факультету_нні: string | null;
  Назва_кафедри: string | null;
  Телефон_кафедри: string | null;
  Email_кафедри: string | null;
  Адреса_кафедри: string | null;
  Корпус_кафедри: string | null;
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
      Факультет_ННІ: {
        Row: FacultyRow;
        Insert: FacultyRow;
        Update: Partial<FacultyRow>;
        Relationships: [];
      };
      Кафедра: {
        Row: DepartmentRow;
        Insert: DepartmentRow;
        Update: Partial<DepartmentRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_all_tables: {
        Args: Record<string, never>;
        Returns: { table_name: string }[];
      };
      get_table_columns: {
        Args: { target_table: string };
        Returns: {
          column_name: string;
          data_type: string;
          is_nullable: string;
          column_default: string | null;
          character_maximum_length: number | null;
          udt_name: string;
        }[];
      };
      get_table_constraints: {
        Args: { target_table: string };
        Returns: {
          constraint_name: string;
          constraint_type: string;
          column_name: string;
          foreign_table_name: string | null;
          foreign_column_name: string | null;
        }[];
      };
      get_table_indexes: {
        Args: { target_table: string };
        Returns: {
          index_name: string;
          column_names: string;
          is_unique: boolean;
        }[];
      };
    };
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
  | 'Рівень_навчання'
  | 'Кафедра'
  | 'Факультет_ННІ';

export type DirectoryRow =
  | TeacherTypeRow
  | PositionRow
  | TeacherStatusRow
  | WorkloadRow
  | StudyFormRow
  | EducationLevelRow
  | FacultyRow
  | DepartmentRow;
