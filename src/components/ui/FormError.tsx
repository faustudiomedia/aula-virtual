export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-lg bg-red-100/50 border border-red-300/50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
      <span className="mt-0.5 flex-shrink-0">⚠️</span>
      <span>{message}</span>
    </div>
  );
}

export function FormSuccess({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-lg bg-green-100/50 border border-green-300/50 px-4 py-3 text-sm text-green-700 flex items-start gap-2">
      <span className="mt-0.5 flex-shrink-0">✅</span>
      <span>{message}</span>
    </div>
  );
}

export default FormError;
