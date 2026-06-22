"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AdminError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="max-w-lg p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-1 h-5 w-5 text-destructive" />
          <div>
            <h1 className="font-serif text-2xl">İşlem sırasında hata oluştu</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              İşlem tamamlanamadı. Bilgileri kontrol edip tekrar deneyin.
            </p>
            {error.digest ? <p className="mt-2 text-xs text-muted-foreground">Hata kodu: {error.digest}</p> : null}
            <Button type="button" onClick={reset} className="mt-4">
              <RotateCcw className="h-4 w-4" />
              Tekrar dene
            </Button>
          </div>
        </div>
      </Card>
    </main>
  );
}
