"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LabeledField } from "@/components/forms/labeled-field";

export function MediaUploadForm({
  categories,
  action
}: {
  categories: { id: string; name: string }[];
  action: (formData: FormData) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [names, setNames] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  function readFiles(files: FileList | null) {
    const nextFiles = Array.from(files ?? []);
    setSelectedFiles(nextFiles);
    setNames(nextFiles.map((file) => file.name));
  }

  return (
    <form
      action={(formData) => {
        const files = selectedFiles.length ? selectedFiles : formData.getAll("files").filter((file): file is File => file instanceof File);
        formData.delete("files");
        files.forEach((file) => formData.append("files", file));
        return action(formData);
      }}
      className="grid gap-3 xl:grid-cols-[minmax(280px,1fr)_minmax(360px,1fr)_auto] xl:items-end"
    >
      <div
        className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted p-4 text-center xl:min-h-24"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          readFiles(event.dataTransfer.files);
        }}
      >
        <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
        <p className="text-sm font-medium">Görselleri buraya bırakın veya seçin</p>
        <p className="text-xs text-muted-foreground">Toplu yükleme desteklenir. JPEG, PNG, WEBP.</p>
        {names.length ? <p className="mt-2 text-xs text-muted-foreground">{names.length} dosya seçildi</p> : null}
      </div>
      <input
        ref={inputRef}
        name="files"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(event) => readFiles(event.target.files)}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <LabeledField label="Medya kategorisi">
          <select name="categoryId" className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm">
            <option value="">Kategorisiz</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </LabeledField>
        <LabeledField label="Hedef genişlik">
          <Input name="width" type="number" min={320} defaultValue={1600} />
        </LabeledField>
        <LabeledField label="Hedef yükseklik">
          <Input name="height" type="number" min={0} placeholder="Boş bırakılabilir" />
        </LabeledField>
      </div>
      <Button type="submit">Görselleri yükle</Button>
    </form>
  );
}
