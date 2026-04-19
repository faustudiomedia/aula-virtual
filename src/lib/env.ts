import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Debe ser una URL válida de Supabase'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'La anon key no puede estar vacía'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'La service role key no puede estar vacía').optional(),
});

const _env = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
});

if (!_env.success) {
  console.error(
    '❌ Variables de entorno inválidas — la aplicación no puede iniciar:',
    JSON.stringify(_env.error.flatten().fieldErrors, null, 2)
  );
  throw new Error('Variables de entorno inválidas. Revisá tu .env.local');
}

export const env = _env.data;
