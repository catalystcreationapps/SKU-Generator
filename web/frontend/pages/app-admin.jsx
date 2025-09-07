import useAuthContext from "../hooks/useShopContext";
// import SkeletonPageMain from "../components/skeletons/SkeletonPageMain";
import { Page, Banner, Pagination } from "@shopify/polaris";
import { useEffect, useState } from "react";
import ShopsTable from "../components/App-admin/ShopsTable";

export default function Settings() {
  const { loaded, http, shop } = useAuthContext();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const [shopsList, setShopsList] = useState(() => []);
  const [page, setPage] = useState(0);

  const perPage = 50;

  const fetchShops = (query = "") => {
    setIsFetching(true);
    const params = {
      skip: page * perPage,
      take: perPage,
      query,
    };
    http
      .get(`/shop?${new URLSearchParams(params).toString()}`)
      .then((res) => {
        if (Array.isArray(res)) {
          setShopsList(res);
        }
        setIsFetching(false);
      })
      .catch((error) => {
        console.log(error);
        setIsFetching(false);
      });
  };

  useEffect(() => {
    if (http) {
      fetchShops();
    }
  }, [http, page]);

  useEffect(() => {
    if (shop && shop.myshopify_domain) {
      setIsAuthorized(shop.myshopify_domain === shop.myshopify_domain);
    }
  }, [loaded, shop]);

  const bannerMarkup = (
    <Banner title="Under construction" status="critical">
      <p>This page is under construction; inconvenience regretted</p>
    </Banner>
  );

  const pageMarkup = (
    <>
      <ShopsTable
        shops={shopsList}
        baseURL={process.env.HOST}
        fetching={isFetching}
        onQueryChange={fetchShops}
      />
      <div className="mt-8 flex justify-center">
        <Pagination
          hasPrevious={page !== 0}
          onPrevious={() => {
            setPage(page - 1);
          }}
          hasNext={shopsList.length === perPage}
          onNext={() => {
            setPage(page + 1);
          }}
        />
      </div>
    </>
  );

  return loaded ? (
    <Page title="App Admin" fullWidth>
      {isAuthorized ? pageMarkup : bannerMarkup}
    </Page>
  ) : (
    // <SkeletonPageMain />
    <h1>Loading !!!</h1>
  );
}
