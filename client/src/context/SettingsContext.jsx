import { createContext, useContext, useEffect, useState } from 'react';
import { settingsApi } from '../services';

// Fallbacks so the footer never looks empty if the API is slow or down.
const DEFAULTS = {
  siteName: 'QUIET BATTLES™',
  tagline: 'Wear your battles.',
  announcement: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  instagram: '',
  twitter: '',
  youtube: '',
};

const SettingsContext = createContext(DEFAULTS);
export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  useEffect(() => {
    settingsApi
      .get()
      .then((res) => setSettings({ ...DEFAULTS, ...res.data }))
      .catch(() => {});
  }, []);
  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}
