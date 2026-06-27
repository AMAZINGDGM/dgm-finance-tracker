"use client";

import { useEffect, useState } from "react";

function getBrowserGreeting(now = new Date()) {
  const hour = now.getHours();

  if (hour >= 5 && hour < 12) {
    return "Good morning";
  }

  if (hour >= 12 && hour < 17) {
    return "Good afternoon";
  }

  if (hour >= 17 && hour < 21) {
    return "Good evening";
  }

  return "Good night";
}

export function ClientGreeting({ userName }: { userName: string }) {
  const [greeting, setGreeting] = useState<string | null>(null);

  useEffect(() => {
    setGreeting(getBrowserGreeting());
  }, []);

  return (
    <span suppressHydrationWarning>
      {greeting ?? "Welcome back"}, {userName}
    </span>
  );
}
