import dayjs, { type Dayjs } from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

export type BasicDatePickerProps = {
  /** Fecha en formato `YYYY-MM-DD` (vacío = sin selección). */
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
};

/**
 * Usa el `LocalizationProvider` + `AdapterDayjs` definidos una sola vez en `main.tsx`
 * (ver https://mui.com/x/react-date-pickers/quickstart/#installation ).
 */
export default function BasicDatePicker({
  value,
  onChange,
  label,
  className,
}: BasicDatePickerProps) {
  return (
    <DatePicker
      label={label}
      className={className}
      value={value ? dayjs(value) : null}
      onChange={(v: Dayjs | null) => onChange(v?.format("YYYY-MM-DD") ?? "")}
      slotProps={{
        textField: {
          size: "small",
          slotProps: {
            htmlInput: { placeholder: "Fecha" },
          },
          sx: {
            minWidth: 132,
            "& .MuiInputBase-root": { fontSize: "0.75rem" },
            "& .MuiInputBase-input": { py: 0.5 },
          },
        },
      }}
    />
  );
}
