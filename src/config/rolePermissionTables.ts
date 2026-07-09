export type RolePermissionTableName =
  | 'Архів'
  | 'Навантаження'
  | 'Кафедральна_інформація'
  | 'Завантаження_навантаження'
  | 'Дисципліни'
  | 'Посада'
  | 'Статус_викладача'
  | 'Тип_викладача'
  | 'Форма_навчання'
  | 'Рівень_навчання'
  | 'Завантажені_документи'
  | 'Кафедра'
  | 'Викладач'
  | 'Факультет_ННІ'
  | 'Абревіатура'
  | 'ОПП'
  | 'Спеціальність';

export interface RolePermissionTableConfig {
  tableName: RolePermissionTableName;
  label: string;
  group: string;
}

export const rolePermissionTables: RolePermissionTableConfig[] = [
  { tableName: 'Архів', label: 'Архів', group: 'Система' },
  { tableName: 'Навантаження', label: 'Навантаження', group: 'Навчальне навантаження' },
  {
    tableName: 'Кафедральна_інформація',
    label: 'Кафедральна інформація',
    group: 'Кафедри та викладачі',
  },
  {
    tableName: 'Завантаження_навантаження',
    label: 'Завантаження навантаження',
    group: 'Навчальне навантаження',
  },
  { tableName: 'Дисципліни', label: 'Дисципліни', group: 'Навчальні дані' },
  { tableName: 'Посада', label: 'Посади', group: 'Довідники' },
  { tableName: 'Статус_викладача', label: 'Статуси викладачів', group: 'Довідники' },
  { tableName: 'Тип_викладача', label: 'Типи викладачів', group: 'Довідники' },
  { tableName: 'Форма_навчання', label: 'Форми навчання', group: 'Довідники' },
  { tableName: 'Рівень_навчання', label: 'Рівні навчання', group: 'Довідники' },
  {
    tableName: 'Завантажені_документи',
    label: 'Завантажені документи',
    group: 'Документи',
  },
  { tableName: 'Кафедра', label: 'Кафедри', group: 'Факультет/ННІ' },
  { tableName: 'Викладач', label: 'Викладачі', group: 'Кафедри та викладачі' },
  { tableName: 'Факультет_ННІ', label: 'Факультет/ННІ', group: 'Факультет/ННІ' },
  { tableName: 'Абревіатура', label: 'Абревіатура', group: 'Навчальне навантаження' },
  { tableName: 'ОПП', label: 'ОПП', group: 'Освітні програми' },
  { tableName: 'Спеціальність', label: 'Спеціальності', group: 'Освітні програми' },
];
