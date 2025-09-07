import { useContext, createContext } from "react";

export const UIContext = createContext(null);

export const useUIContext = () => {
  return useContext(UIContext);
};
