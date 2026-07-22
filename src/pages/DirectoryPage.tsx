import { useLocation } from 'react-router-dom';
import { SupabaseDirectoryTemplate } from '../components/SupabaseDirectoryTemplate';
import {
  directoryConfigs,
  supabaseDirectoryKeys,
  type SupabaseDirectoryKey,
} from '../config/directories';
import { NotFoundPage } from './NotFoundPage';

const pathToDirectoryKey: Record<string, SupabaseDirectoryKey> = {};
for (const key of supabaseDirectoryKeys) {
  pathToDirectoryKey[directoryConfigs[key].route] = key;
}

export function DirectoryPage() {
  const location = useLocation();
  const directoryKey = pathToDirectoryKey[location.pathname];

  if (!directoryKey) {
    return <NotFoundPage />;
  }

  return <SupabaseDirectoryTemplate directoryKey={directoryKey} />;
}
