"use client";

import { createContext, ReactNode, useContext, useState } from "react";

interface HeaderVisibilityValue {
  hidden: boolean;
  setHidden: (hidden: boolean) => void;
}

const HeaderVisibilityContext = createContext<HeaderVisibilityValue>({
  hidden: false,
  setHidden: () => {},
});

export function HeaderVisibilityProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [hidden, setHidden] = useState(false);

  return (
    <HeaderVisibilityContext.Provider value={{ hidden, setHidden }}>
      {children}
    </HeaderVisibilityContext.Provider>
  );
}

export function useHeaderVisibility(): HeaderVisibilityValue {
  return useContext(HeaderVisibilityContext);
}