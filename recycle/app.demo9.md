import { Autocomplete, Icon, Page } from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";
import { useState } from "react";

export default function AutocompleteExample() {
  const deselectedOptions = [
    { value: "rustic", label: "Rustic" },
    { value: "antique", label: "Antique" },
    { value: "vinyl", label: "Vinyl" },
    { value: "vintage", label: "Vintage" },
    { value: "refurbished", label: "Refurbished" },
  ];

  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState(deselectedOptions);

  const updateText = (value: string) => {
    setInputValue(value);
    if (value === "") {
      setOptions(deselectedOptions);
      return;
    }

    const filterRegex = new RegExp(value, "i");
    const resultOptions = deselectedOptions.filter((option) =>
      option.label.match(filterRegex),
    );
    setOptions(resultOptions);
  };

  const updateSelection = (selected: string[]) => {
    const selectedValue = selected.map((selectedItem) => {
      const matchedOption = options.find((option) => {
        return option.value.match(selectedItem);
      });
      return matchedOption && matchedOption.label;
    });

    setSelectedOptions(selected);
    setInputValue(selectedValue[0] || "");
  };

  const textField = (
    <Autocomplete.TextField
      onChange={updateText}
      label="Tags"
      value={inputValue}
      prefix={<Icon source={SearchIcon} tone="base" />}
      placeholder="Search"
      autoComplete="off"
    />
  );

  return (
    <Page narrowWidth>
      <div style={{ height: "225px" }}>
        <Autocomplete
          options={options}
          selected={selectedOptions}
          onSelect={updateSelection}
          textField={textField}
        />
      </div>
    </Page>
  );
}
