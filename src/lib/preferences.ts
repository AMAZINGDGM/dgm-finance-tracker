export type DftLanguage = "en" | "id";

export type DftPreferences = {
  dateFormat: string;
  defaultView: string;
  language: DftLanguage;
};

export const preferencesKey = "dft-settings-preferences";
export const preferencesChangedEvent = "dft-settings-preferences-changed";

export const defaultPreferences: DftPreferences = {
  dateFormat: "dd-mm-yyyy",
  defaultView: "dashboard",
  language: "en"
};

export function normalizePreferences(value?: Partial<DftPreferences> | null): DftPreferences {
  return {
    dateFormat: value?.dateFormat === "yyyy-mm-dd" ? "yyyy-mm-dd" : defaultPreferences.dateFormat,
    defaultView:
      value?.defaultView === "transactions" || value?.defaultView === "reports"
        ? value.defaultView
        : defaultPreferences.defaultView,
    language: value?.language === "id" ? "id" : "en"
  };
}

export function readPreferencesFromStorage() {
  if (typeof window === "undefined") {
    return defaultPreferences;
  }

  const saved = window.localStorage.getItem(preferencesKey);

  if (!saved) {
    return defaultPreferences;
  }

  try {
    return normalizePreferences(JSON.parse(saved) as Partial<DftPreferences>);
  } catch {
    window.localStorage.removeItem(preferencesKey);
    return defaultPreferences;
  }
}

export function savePreferencesToStorage(preferences: DftPreferences) {
  const normalizedPreferences = normalizePreferences(preferences);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(preferencesKey, JSON.stringify(normalizedPreferences));
    window.dispatchEvent(
      new CustomEvent<DftPreferences>(preferencesChangedEvent, {
        detail: normalizedPreferences
      })
    );
  }

  return normalizedPreferences;
}
