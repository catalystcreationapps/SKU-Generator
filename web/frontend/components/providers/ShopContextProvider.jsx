import { useCallback, useEffect, useState } from "react";
import { ShopContext } from "../../hooks/useShopContext.js";
import { useAuthenticatedFetch } from "../../hooks/useAuthenticatedFetch.js";

const ShopContextProvider = ({ children }) => {
  const fetch = useAuthenticatedFetch();
  const [shop, setShop] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [proPlan, setProPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAppLanguage, setSelectedAppLanguage] = useState("en");

  const setShopHandler = useCallback(async () => {
    try {
      const res = await fetch("/api/getdetails", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      const resp = await res.json();
      setShop(resp.response.body);
      getPlans(resp.response.body.shop.id);
    } catch (error) {
      console.log("Error getting shop details:", error);
    }
  }, []);

  const getPlans = useCallback(async (shopId) => {
    try {
      return await fetch(`/api/upgradeplan/${shopId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
        .then((res) => res.json())
        .then((resp) => {
          setLoading(false);
          setCurrentPlan(resp.chargeName);
          if (resp.proPlan) {
            setProPlan(true);
          } else {
            setProPlan(false);
          }
        });
    } catch (error) {
      console.log(error);
    }
  });

  useEffect(() => {
    setShopHandler();
  }, [setShopHandler]);

  const sharedState = {
    shop,
    currentPlan,
    proPlan,
    loading,
    selectedAppLanguage,
    setSelectedAppLanguage,
  };

  return (
    <ShopContext.Provider value={sharedState}>{children}</ShopContext.Provider>
  );
};

export default ShopContextProvider;
