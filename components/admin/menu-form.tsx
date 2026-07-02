"use client";

import { MediaPickerField } from "@/components/admin/media-picker-field";
import { LabeledField } from "@/components/forms/labeled-field";
import { TranslatedInputField } from "@/components/forms/translated-input-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type MenuTranslation = {
  locale: string;
  name: string;
  description: string | null;
  heroTitle?: string | null;
};

export type MenuFormMenu = {
  id: string;
  slug: string;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  translations: MenuTranslation[];
};

type MediaItem = { id: string; url: string; originalName: string; category: { name: string } | null };
type MediaCategory = { id: string; name: string };
type FormActionResult = void | { ok?: boolean };

export function MenuForm({
  action,
  menu,
  media,
  mediaCategories,
  onClose,
  variant = "edit"
}: {
  action: (formData: FormData) => FormActionResult | Promise<FormActionResult>;
  menu?: MenuFormMenu;
  media: MediaItem[];
  mediaCategories: MediaCategory[];
  onClose?: () => void;
  variant?: "create" | "edit";
}) {
  const tr = menu?.translations.find((item) => item.locale === "tr");
  const en = menu?.translations.find((item) => item.locale === "en");
  const es = menu?.translations.find((item) => item.locale === "es");

  return (
    <form
      action={async (formData) => {
        await action(formData);
      }}
      className="mt-4 space-y-3"
    >
      {menu ? <input type="hidden" name="id" value={menu.id} /> : null}

      <Section number="1" title="Temel bilgiler">
        <div className="grid gap-3 xl:grid-cols-3">
          <div className="rounded-md border border-border p-3">
            <h3 className="mb-3 font-semibold">Menü adı</h3>
            <LabeledField label="Türkçe menü adı">
              <Input name="name_tr" defaultValue={tr?.name} required />
            </LabeledField>
            <TranslatedInputField
              label="İngilizce menü adı"
              name="name_en"
              sourceName="name_tr"
              targetLocale="en"
              defaultValue={en?.name}
              required
              fieldClassName="mt-3"
            />
            <TranslatedInputField
              label="İspanyolca menü adı"
              name="name_es"
              sourceName="name_tr"
              targetLocale="es"
              defaultValue={es?.name}
              required
              fieldClassName="mt-3"
            />
          </div>

          <div className="rounded-md border border-border p-3 xl:col-span-2">
            <h3 className="mb-3 font-semibold">Açıklama</h3>
            <div className="space-y-3">
              <LabeledField label="Türkçe açıklama">
                <Input name="description_tr" defaultValue={tr?.description ?? ""} />
              </LabeledField>
              <TranslatedInputField
                label="İngilizce açıklama"
                name="description_en"
                sourceName="description_tr"
                targetLocale="en"
                defaultValue={en?.description ?? ""}
              />
              <TranslatedInputField
                label="İspanyolca açıklama"
                name="description_es"
                sourceName="description_tr"
                targetLocale="es"
                defaultValue={es?.description ?? ""}
              />
            </div>
          </div>
        </div>
      </Section>

      <Section number="2" title="Kapak basligi">
        <div className="grid gap-3 xl:grid-cols-3">
          <LabeledField label="Turkce kapak basligi">
            <Input name="heroTitle_tr" defaultValue={tr?.heroTitle ?? ""} placeholder="Gourmet Deneyimi" />
          </LabeledField>
          <TranslatedInputField
            label="Ingilizce kapak basligi"
            name="heroTitle_en"
            sourceName="heroTitle_tr"
            targetLocale="en"
            defaultValue={en?.heroTitle ?? ""}
            placeholder="Gourmet Experience"
          />
          <TranslatedInputField
            label="Ispanyolca kapak basligi"
            name="heroTitle_es"
            sourceName="heroTitle_tr"
            targetLocale="es"
            defaultValue={es?.heroTitle ?? ""}
            placeholder="Experiencia Gourmet"
          />
        </div>
      </Section>

      <Section number="3" title="Adres ve durum">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_140px_160px]">
          <LabeledField label="URL slug">
            <Input name="slug" defaultValue={menu?.slug} />
          </LabeledField>
          <LabeledField label="Sıra">
            <Input name="sortOrder" type="number" defaultValue={menu?.sortOrder ?? 0} />
          </LabeledField>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input name="isActive" type="checkbox" defaultChecked={menu?.isActive ?? true} />
            Aktif
          </label>
        </div>
      </Section>

      <Section number="4" title="Menu gorseli">
        <MediaPickerField
          name="imageUrl"
          defaultValue={menu?.imageUrl ?? ""}
          media={media}
          categories={mediaCategories}
          label="Menü görseli seç"
          targetWidth={1400}
          targetHeight={520}
        />
      </Section>

      <div className="flex flex-wrap justify-end gap-2">
        {onClose ? (
          <Button type="button" variant="outline" onClick={onClose}>
            Kapat
          </Button>
        ) : null}
        <Button type="submit">{variant === "create" ? "Menüyü kaydet" : "Kaydet"}</Button>
        {onClose ? (
          <Button
            type="submit"
            variant="accent"
            formAction={async (formData) => {
              const result = await action(formData);
              if (!result || result.ok !== false) onClose();
            }}
          >
            Kaydet kapat
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border p-3">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-muted text-sm font-semibold">
          {number}
        </span>
        <h3 className="font-semibold">{title}</h3>
      </div>
      {children}
    </section>
  );
}
