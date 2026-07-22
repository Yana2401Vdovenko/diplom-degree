import type { DirectoryTableName } from '../types/database';

export type SupabaseDirectoryKey =
  | 'teacherTypes'
  | 'positions'
  | 'teacherStatuses'
  | 'workload'
  | 'studyForms'
  | 'educationLevels'
  | 'faculties'
  | 'departments';

export interface DirectoryFieldConfig {
  key: string;
  label: string;
  required?: boolean;
  maxLength?: number;
  type?: 'text' | 'number' | 'select';
  readOnlyOnEdit?: boolean;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  filterable?: boolean;
  format?: 'text' | 'date' | 'status';
  foreignTable?: string;
  foreignKey?: string;
  foreignLabel?: string;
  foreignExtraFields?: string[];
}

export interface DirectoryConfig {
  key: SupabaseDirectoryKey;
  tableName: DirectoryTableName;
  entityLabel: string;
  title: string;
  subtitle: string;
  route: string;
  primaryKey: string;
  displayNameField: string;
  fields: DirectoryFieldConfig[];
}

export const directoryConfigs: Record<SupabaseDirectoryKey, DirectoryConfig> = {
  teacherTypes: {
    key: 'teacherTypes',
    tableName: 'Тип_викладача',
    entityLabel: 'Тип викладача',
    title: 'Типи викладачів',
    subtitle: 'Типи зайнятості викладачів для коректного обліку ставок.',
    route: '/teacher-types',
    primaryKey: 'Код_типу',
    displayNameField: 'Назва_типу',
    fields: [
      { key: 'Код_типу', label: 'Код типу', required: true, maxLength: 3, readOnlyOnEdit: true },
      { key: 'Назва_типу', label: 'Назва типу', required: true, maxLength: 500 },
    ],
  },
  positions: {
    key: 'positions',
    tableName: 'Посада',
    entityLabel: 'Посада',
    title: 'Посади',
    subtitle: 'Посади викладачів для кадрового обліку та правил розподілу.',
    route: '/positions',
    primaryKey: 'Код_посади',
    displayNameField: 'Назва',
    fields: [
      { key: 'Код_посади', label: 'Код посади', required: true, maxLength: 5, readOnlyOnEdit: true },
      { key: 'Назва', label: 'Назва', required: true, maxLength: 500 },
    ],
  },
  teacherStatuses: {
    key: 'teacherStatuses',
    tableName: 'Статус_викладача',
    entityLabel: 'Статус викладача',
    title: 'Статуси викладачів',
    subtitle: 'Стани викладачів, які визначають участь у розподілі навантаження.',
    route: '/teacher-statuses',
    primaryKey: 'Код_статусу_викладача',
    displayNameField: 'Назва_статусу_викладача',
    fields: [
      {
        key: 'Код_статусу_викладача',
        label: 'Код статусу',
        required: true,
        maxLength: 3,
        readOnlyOnEdit: true,
      },
      { key: 'Назва_статусу_викладача', label: 'Назва статусу', required: true, maxLength: 500 },
    ],
  },
  workload: {
    key: 'workload',
    tableName: 'Навантаження',
    entityLabel: 'Навантаження',
    title: 'Навантаження',
    subtitle: 'Нормативні години навантаження за статусом викладача.',
    route: '/workload',
    primaryKey: 'Код_статусу_викладача',
    displayNameField: 'Код_статусу_викладача',
    fields: [
      {
        key: 'Код_статусу_викладача',
        label: 'Статус викладача',
        required: true,
        maxLength: 3,
        readOnlyOnEdit: true,
      },
      { key: 'Години', label: 'Години', required: true, type: 'number' },
    ],
  },
  studyForms: {
    key: 'studyForms',
    tableName: 'Форма_навчання',
    entityLabel: 'Форма навчання',
    title: 'Форми навчання',
    subtitle: 'Форми організації освітнього процесу для планів і контингенту.',
    route: '/study-forms',
    primaryKey: 'Код_форми_навчання',
    displayNameField: 'Назва_форми_навчання',
    fields: [
      {
        key: 'Код_форми_навчання',
        label: 'Код форми',
        required: true,
        maxLength: 1,
        readOnlyOnEdit: true,
      },
      { key: 'Назва_форми_навчання', label: 'Назва форми', required: true, maxLength: 500 },
    ],
  },
  educationLevels: {
    key: 'educationLevels',
    tableName: 'Рівень_навчання',
    entityLabel: 'Рівень навчання',
    title: 'Рівні навчання',
    subtitle: 'Рівні освіти для планування та розподілу навантаження.',
    route: '/education-levels',
    primaryKey: 'Код_рівня_навчання',
    displayNameField: 'Назва_рівня_навчання',
    fields: [
      {
        key: 'Код_рівня_навчання',
        label: 'Код рівня',
        required: true,
        maxLength: 1,
        readOnlyOnEdit: true,
      },
      { key: 'Назва_рівня_навчання', label: 'Назва рівня', required: true, maxLength: 500 },
    ],
  },
  faculties: {
    key: 'faculties',
    tableName: 'Факультет_ННІ',
    entityLabel: 'Факультет/ННІ',
    title: 'Факультети та ННІ',
    subtitle: 'Факультети, інститути та навчально-наукові інститути університету.',
    route: '/faculties',
    primaryKey: 'Код_факультету_нні',
    displayNameField: 'Назва_факультету_нні',
    fields: [
      { key: 'Код_факультету_нні', label: 'Код', required: true, maxLength: 3, readOnlyOnEdit: true },
      { key: 'Назва_факультету_нні', label: 'Назва', required: true, maxLength: 500 },
      { key: 'Декан_факультету_нні', label: 'Декан', maxLength: 50 },
      { key: 'Телефон_факультету_нні', label: 'Телефон', maxLength: 13 },
      { key: 'Адреса_факультету_нні', label: 'Адреса', maxLength: 500 },
      { key: 'Email_факультету_нні', label: 'Email', maxLength: 500 },
      { key: 'Корпус_деканату_факультету_нні', label: 'Корпус деканату', maxLength: 50 },
    ],
  },
  departments: {
    key: 'departments',
    tableName: 'Кафедра',
    entityLabel: 'Кафедра',
    title: 'Кафедри',
    subtitle: 'Кафедри факультетів та ННІ для обліку викладачів і навантаження.',
    route: '/departments',
    primaryKey: 'Код_кафедри',
    displayNameField: 'Назва_кафедри',
    fields: [
      { key: 'Код_кафедри', label: 'Код', required: true, maxLength: 6, readOnlyOnEdit: true },
      { key: 'Код_факультету_нні', label: 'Факультет', required: true, type: 'select', foreignTable: 'Факультет_ННІ', foreignKey: 'Код_факультету_нні', foreignLabel: 'Код_факультету_нні', foreignExtraFields: ['Назва_факультету_нні'] },
      { key: 'Назва_кафедри', label: 'Назва', required: true, maxLength: 500 },
      { key: 'Телефон_кафедри', label: 'Телефон', maxLength: 13 },
      { key: 'Email_кафедри', label: 'Email', maxLength: 500 },
      { key: 'Адреса_кафедри', label: 'Адреса', maxLength: 500 },
      { key: 'Корпус_кафедри', label: 'Корпус', maxLength: 500 },
    ],
  },
};

export const supabaseDirectoryKeys = Object.keys(directoryConfigs) as SupabaseDirectoryKey[];

export function getDirectoryConfig(key: SupabaseDirectoryKey): DirectoryConfig {
  return directoryConfigs[key];
}

export function getDirectoryConfigByTable(tableName: string): DirectoryConfig | undefined {
  return supabaseDirectoryKeys
    .map((key) => directoryConfigs[key])
    .find((config) => config.tableName === tableName);
}
