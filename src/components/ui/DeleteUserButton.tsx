'use client'

interface DeleteUserButtonProps {
  userId: string
  action: (prevState: unknown, formData: FormData) => Promise<void>
}

export default function DeleteUserButton({ userId, action }: DeleteUserButtonProps) {
  return (
    <form action={action}>
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        onClick={(e) => {
          if (!confirm('¿Estás seguro de que querés eliminar este usuario? Esta acción no se puede deshacer.')) {
            e.preventDefault()
          }
        }}
        className="px-3 py-1 rounded-lg text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-all"
      >
        Eliminar
      </button>
    </form>
  )
}
