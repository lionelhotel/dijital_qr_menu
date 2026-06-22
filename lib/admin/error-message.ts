export function errorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "İşlem sırasında beklenmeyen bir hata oluştu.";
}
