import dayjs, { type Dayjs } from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

export type BasicDatePickerProps = {
  /** Fecha en formato `YYYY-MM-DD` (vacío = sin selección). */
  value: string;
  onChange?: (value: string) => void;
  /** Se dispara al confirmar la fecha (calendario o Enter en el campo). */
  onAccept?: (value: string) => void;
  onOpen?: () => void;
  label?: string;
  className?: string;
  disabled?: boolean;
};

/**
 * Usa el `LocalizationProvider` + `AdapterDayjs` definidos una sola vez en `main.tsx`
 * (ver https://mui.com/x/react-date-pickers/quickstart/#installation ).
 */
export default function BasicDatePicker({
  value,
  onChange,
  onAccept,
  onOpen,
  label,
  className,
  disabled = false,
}: BasicDatePickerProps) {
  const emit = (v: Dayjs | null) => v?.format("YYYY-MM-DD") ?? "";

  return (
    <DatePicker
      label={label}
      className={className}
      disabled={disabled}
      value={value ? dayjs(value) : null}
      onOpen={onOpen}
      onChange={(v: Dayjs | null) => {
        onChange?.(emit(v));
      }}
      onAccept={(v: Dayjs | null) => {
        onAccept?.(emit(v));
      }}
      slotProps={{
        textField: {
          size: "small",
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === "Enter") e.preventDefault();
          },
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
