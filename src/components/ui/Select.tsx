import NativeSelect, { type NativeSelectProps } from "@mui/material/NativeSelect";
import FormControl from "@mui/material/FormControl";
import OutlinedInput from "@mui/material/OutlinedInput";

export function Select({ className, ...props }: NativeSelectProps & { className?: string }) {
  return (
    <FormControl size="small" fullWidth className={className}>
      <NativeSelect {...props} input={<OutlinedInput />} />
    </FormControl>
  );
}

