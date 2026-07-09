import SearchIcon from '@mui/icons-material/Search';
import { InputAdornment, TextField } from '@mui/material';
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
  placeholder = 'Пошук',
  historySource = 'Пошук',
}: SearchFieldProps) {
  const saveSearch = () => recordSearchQuery(value, historySource);

  return (
    <TextField
      fullWidth
      size="small"
      value={value}
      placeholder={placeholder}
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
