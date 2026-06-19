import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <section className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-soft">
        <p className="text-sm text-muted-foreground">Lionel Hotel Istanbul</p>
        <h1 className="mt-1 font-serif text-3xl">Yönetim Paneli</h1>
        <p className="mb-6 mt-2 text-sm text-muted-foreground">
          Menü içeriklerini, QR kodları ve kurumsal ayarları yönetmek için giriş yapın.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
