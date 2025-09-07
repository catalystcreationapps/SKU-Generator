import { BrowserRouter } from "react-router-dom";
import React, { useState } from "react";
import { NavigationMenu } from "@shopify/app-bridge-react";
import Routes from "./Routes";
import {
  AppBridgeProvider,
  QueryProvider,
  PolarisProvider,
} from "./components";
import ShopContextProvider from "./components/providers/ShopContextProvider";
import i18n from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";
import enTranslations from "./alljsondata/en.json";
import csTranslations from "./alljsondata/cs.json";
import daTranslations from "./alljsondata/da.json";
import deTranslations from "./alljsondata/de.json";
import esTranslations from "./alljsondata/es.json";
import fiTranslations from "./alljsondata/fi.json";
import frTranslations from "./alljsondata/fr.json";
import itTranslations from "./alljsondata/it.json";
import jaTranslations from "./alljsondata/ja.json";
import koTranslations from "./alljsondata/ko.json";
import nlTranslations from "./alljsondata/nl.json";
import noTranslations from "./alljsondata/no.json";
import plTranslations from "./alljsondata/pl.json";
import ptPtTranslations from "./alljsondata/pt-PT.json";
import ptTranslations from "./alljsondata/pt.json";
import svTranslations from "./alljsondata/sv.json";
import thTranslations from "./alljsondata/th.json";
import trTranslations from "./alljsondata/tr.json";
import viTranslations from "./alljsondata/vi.json";
import zhTWTranslations from "./alljsondata/zh-TW.json";
import zhTranslations from "./alljsondata/zh.json";
import "./pages/main.scss";

export default function App() {
  // Any .tsx or .jsx files in /pages will become a route
  // See documentation for <Routes /> for more info
  const pages = import.meta.globEager("./pages/**/!(*.test.[jt]sx)*.([jt]sx)");

  const locale = new URL(location).searchParams.get("locale");

  const [selectedAppLanguage, setSelectedAppLanguage] = useState(
    locale ? locale.split("-")[0] : "en"
  );

  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: enTranslations },
      es: { translation: esTranslations },
      cs: { translation: csTranslations },
      da: { translation: daTranslations },
      de: { translation: deTranslations },
      fi: { translation: fiTranslations },
      fr: { translation: frTranslations },
      it: { translation: itTranslations },
      ja: { translation: jaTranslations },
      ko: { translation: koTranslations },
      nl: { translation: nlTranslations },
      no: { translation: noTranslations },
      pl: { translation: plTranslations },
      pt: { translation: ptTranslations },
      ptPT: { translation: ptPtTranslations },
      sv: { translation: svTranslations },
      th: { translation: thTranslations },
      tr: { translation: trTranslations },
      vi: { translation: viTranslations },
      zh: { translation: zhTranslations },
      zhTW: { translation: zhTWTranslations },
    },
    lng: selectedAppLanguage,
    interpolation: { escapeValue: false },
  });

  return (
    <div className="pokemon-wrapper">
      <div className="pokemon">
        Lorem Ipsum is simply dummy text of the printing and typesetting
        industry. Lorem Ipsum has been the industry's standard dummy text ever
        since the 1500s, when an unknown printer took a galley of type and
        scrambled it to make a type specimen book. It has survived not only five
        centuries, but also the leap into electronic typesetting, remaining
        essentially unchanged. It was popularised in the 1960s with the release
        of Letraset sheets containing Lorem Ipsum passages, and more recently
        with desktop publishing software like Aldus PageMaker including versions
        of Lorem Ipsum.
      </div>
      <PolarisProvider>
        <BrowserRouter>
          <AppBridgeProvider>
            <QueryProvider>
              <ShopContextProvider
                value={{ selectedAppLanguage, setSelectedAppLanguage }}
              >
                <I18nextProvider i18n={i18n}></I18nextProvider>
                <NavigationMenu
                  navigationLinks={[
                    {
                      label: "Generate SKU",
                      destination: "/generate-sku",
                    },
                    {
                      label: "Automated SKU",
                      destination: "/AutomatedSKU",
                    },
                    {
                      label: "Duplicated SKUs",
                      destination: "/duplicated-skus",
                    },
                    {
                      label: "Progress / History",
                      destination: "/progress-page",
                    },
                    {
                      label: "Plans & Pricing",
                      destination: "/PlansPricing",
                    },
                    {
                      label: "Help",
                      destination: "/Help",
                    },
                    {
                      label: "Settings",
                      destination: "/Settings",
                    },
                  ]}
                />
                <Routes pages={pages} />
              </ShopContextProvider>
            </QueryProvider>
          </AppBridgeProvider>
        </BrowserRouter>
      </PolarisProvider>
    </div>
  );
}
