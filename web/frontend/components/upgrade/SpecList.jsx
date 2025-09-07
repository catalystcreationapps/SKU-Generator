import { Icon } from "@shopify/polaris";
import "./SpecList.scss";
import { CheckCircleIcon, CheckSmallIcon } from "@shopify/polaris-icons";

export default function SpecList({ specifications = [] }) {
  const enhanceText = (text) => {
    const enhancedText = text.replace(
      /(Unlimited product|unlimited products|Free Plan|20 products|Basic Monthly|100 product)/g,
      '<strong class="bold-unlimited">$1</strong>'
    );
    return { __html: enhancedText };
  };
  return (
    <ul className="specList">
      {specifications.map((spec, ind) => {
        let isCross = false;
        if (spec.charAt(0) === "!") {
          spec = spec.substring(1);
          isCross = true;
        }
        return (
          <li className={isCross ? "cross" : "check"} key={ind}>
            <Icon source={CheckCircleIcon} tone="success" />
            <p dangerouslySetInnerHTML={enhanceText(spec)}></p>
          </li>
        );
      })}
    </ul>
  );
}
