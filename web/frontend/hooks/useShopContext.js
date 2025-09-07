import { useContext, createContext } from "react";
export const ShopContext = createContext(null);

export default function useShopContext() {
  return useContext(ShopContext);
}
