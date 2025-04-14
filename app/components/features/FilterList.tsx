import { formatDate, parseDate } from "app/common";
import { DateRangePicker } from "../ui/DatePinker";

export function FilterList(
  dateOfPicker: string,
  handleFilterChange: <Key extends keyof FilterType>(
    key: keyof FilterType,
    value: FilterType[Key],
  ) => void,
) {
  const [fromDate, toDate] = (dateOfPicker === "" ? "->" : dateOfPicker).split(
    "->",
  );
  const date = {
    start: parseDate(fromDate) ?? new Date(),
    end: parseDate(toDate) ?? new Date(),
  };

  const filtersComponent = [
    {
      key: "dueDate",
      label: "Due Date",
      filter: (
        <DateRangePicker
          value={date}
          onDateRangeSelect={({ start, end }) => {
            handleFilterChange(
              "dateOfPicker",
              formatDate(start) + "->" + formatDate(end),
            );
          }}
        />
      ),
      pinned: true,
    },
  ];
  return filtersComponent;
}
