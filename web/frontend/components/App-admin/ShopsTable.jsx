import {
  Card,
  IndexTable,
  Text,
  useIndexResourceState,
  Button,
  TextField,
  ButtonGroup,
} from "@shopify/polaris";
import { useCallback, useEffect, useState } from "react";
// import { copyToClipboard } from "../../utils/general";
import { debounce } from "lodash";
// import UsageEditModal from "./UsageEditModal";
import useAuthContext from "../../hooks/useShopContext";
import { useUIContext } from "../../hooks/useUIContext";

export default function ShopsTable({
  shops = [],
  baseURL = "",
  fetching = false,
  onQueryChange,
}) {
  const resourceName = {
    singular: "shop",
    plural: "shops",
  };
  const { toast } = useUIContext();
  const { http } = useAuthContext();

  const [query, setQuery] = useState("");
  const [shopToEdit, setShopToEdit] = useState(null);
  const [tempShops, setTempShops] = useState([]);

  useEffect(() => {
    setTempShops(shops);
  }, [shops]);

  const debouncedQueryChange = debounce(onQueryChange, 400);

  const handleQueryChange = useCallback(
    (value) => {
      setQuery(value);
      debouncedQueryChange(value);
    },
    [onQueryChange]
  );

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(shops);

  const copyLoginURL = (token) => {
    if (!token) {
      toast.show("Token missing");
      return;
    }

    const url = `${baseURL}?token=${token}`;
    // copyToClipboard(url);
    toast.show("URL copied!");
  };

  const handleUpdateBonus = async (name, showBranding) => {
    try {
      await http.post("/shop/toggle-branding", {
        shop: name,
        showBranding,
      });

      setTempShops([
        ...tempShops,
        (tempShops.find((el) => el.name === name)["settings"]["showBranding"] =
          showBranding),
      ]);
    } catch (error) {
      console.log("error: ", error);
    }
  };

  const rowMarkup = shops.map((shop, index) => {
    const { id, name, token, usage } = shop;

    const hasBranding = tempShops[index]?.settings?.showBranding;
    return (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
      >
        <IndexTable.Cell>
          <Text variation="strong">{name}</Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{usage?.bonusUsage || 0}</IndexTable.Cell>
        <IndexTable.Cell>
          <span style={{ textTransform: "capitalize", fontWeight: "bold" }}>
            {!hasBranding ? "Yes" : "No"}
          </span>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <ButtonGroup>
            <Button
              size="slim"
              onClick={() =>
                handleUpdateBonus(name, !tempShops[index].settings.showBranding)
              }
              primary={hasBranding}
            >
              {hasBranding ? "Remove Branding" : "Show Branding"}
            </Button>
            <Button size="slim" onClick={() => setShopToEdit(shop)}>
              Update Bonus
            </Button>
            <Button primary size="slim" onClick={() => copyLoginURL(token)}>
              Copy Login URL
            </Button>
          </ButtonGroup>
        </IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  return (
    <Card>
      <div className="pt-4 mb-2 mx-6">
        <TextField
          label="Store name"
          value={query}
          onChange={handleQueryChange}
          autoComplete="off"
        />
      </div>

      <IndexTable
        resourceName={resourceName}
        itemCount={shops.length}
        selectedItemsCount={
          allResourcesSelected ? "All" : selectedResources.length
        }
        onSelectionChange={handleSelectionChange}
        headings={[
          { title: "Name" },
          { title: "Bonus" },
          { title: "Verified for branding removal" },
          { title: "Action" },
        ]}
        loading={fetching}
      >
        {rowMarkup}
      </IndexTable>
      {shopToEdit && (
        // <UsageEditModal
        //   shop={shopToEdit}
        //   onClose={() => {
        //     setShopToEdit(null);
        //   }}
        // ></UsageEditModal>
        <h1>Modal opened</h1>
      )}
    </Card>
  );
}
