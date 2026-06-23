import type { InputHTMLAttributes } from "react";
import { FieldTranslateButton } from "@/components/admin/field-translate-button";
import { Input } from "@/components/ui/input";
import { LabeledField } from "./labeled-field";

type TranslatedInputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  sourceName: string;
  targetLocale: "en" | "es";
  fieldClassName?: string;
};

export function TranslatedInputField({
  label,
  name,
  sourceName,
  targetLocale,
  fieldClassName,
  ...inputProps
}: TranslatedInputFieldProps) {
  return (
    <LabeledField label={label} className={fieldClassName}>
      <div className="flex gap-2">
        <Input name={name} {...inputProps} />
        <FieldTranslateButton sourceName={sourceName} targetName={name} targetLocale={targetLocale} />
      </div>
    </LabeledField>
  );
}
