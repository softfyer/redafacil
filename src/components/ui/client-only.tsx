'use client';

import { useState, useEffect, type ReactNode } from 'react';

/**
 * A component that only renders its children on the client side.
 * This is useful for preventing hydration mismatches when rendering content
 * that relies on browser-specific APIs or data that might differ from the server.
 */
export function ClientOnly({ children }: { children: ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
}
