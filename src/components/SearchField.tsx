import SearchIcon from '@mui/icons-material/Search';
import { InputAdornment, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { recordSearchQuery } from '../utils/searchHistory';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  historySource?: string;
}

export function SearchField({
  value,
  onChange,
  placeholder,
  historySource = 'search',
}: SearchFieldProps) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t('common.search');
  const saveSearch = () => recordSearchQuery(value, historySource);

  return (
    <TextField
      fullWidth
      size="small"
      value={value}
      placeholder={resolvedPlaceholder}
      onChange={(event) => onChange(event.target.value)}
      onBlur={saveSearch}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          saveSearch();
        }
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" />
          </InputAdornment>
        ),
      }}
    />
  );
}
