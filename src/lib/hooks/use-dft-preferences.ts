"use client";

import { useEffect, useState } from "react";

import {
  defaultPreferences,
  preferencesChangedEvent,
  preferencesKey,
  readPreferencesFromStorage,
  type DftPreferences
} from "@/lib/preferences";

export function useDftPreferences() {
  const [preferences, setPreferences] = useState<DftPreferences>(defaultPreferences);

  useEffect(() => {
    setPreferences(readPreferencesFromStorage());

    function handlePreferencesChange(event: Event) {
      const detail = (event as CustomEvent<DftPreferences>).detail;
      setPreferences(detail ?? readPreferencesFromStorage());
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === preferencesKey) {
        setPreferences(readPreferencesFromStorage());
      }
    }

    window.addEventListener(preferencesChangedEvent, handlePreferencesChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(preferencesChangedEvent, handlePreferencesChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return preferences;
}
