import type { DirectoryTableName } from '../types/database';

export const ARCHIVE_TABLE = 'Архів' as const;

export const DIRECTORY_TABLE_NAMES: DirectoryTableName[] = [
  'Тип_викладача',
  'Посада',
  'Статус_викладача',
  'Навантаження',
  'Форма_навчання',
  'Рівень_навчання',
  'Кафедра',
  'Факультет_ННІ',
];
