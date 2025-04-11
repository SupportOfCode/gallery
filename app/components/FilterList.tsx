import { TextField } from "@shopify/polaris";

export function FilterList(
  fromDate: string,
  toDate: string,
  handleFilterChange: <Key extends keyof FilterType>(
    key: keyof FilterType,
    value: FilterType[Key],
  ) => void,
) {
  const filtersComponent = [
    {
      key: "dueDate",
      label: "Due Date",
      filter: (
        <>
          <TextField
            type="date"
            label="From"
            value={fromDate}
            onChange={(value) => handleFilterChange("fromDate", value)}
            autoComplete="off"
          />
          <TextField
            type="date"
            label="To"
            value={toDate}
            onChange={(value) => handleFilterChange("toDate", value)}
            autoComplete="off"
          />
        </>
      ),
      pinned: true,
    },
  ];
  return filtersComponent;
}
