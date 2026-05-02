import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// ── Re-declare schemas here to test them in isolation ───────────────────────
// Mirrors the schemas in src/app/actions/courses.ts
const courseSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  published: z.boolean().optional(),
})

const materialSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  file_url: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
  file_type: z.string().optional(),
  order_index: z.coerce.number().min(0).optional(),
})

const instituteSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  slug: z.string().regex(/^[a-z0-9\-]+$/, 'El slug solo puede contener minúsculas, números y guiones'),
  domain: z.string().optional(),
  primary_color: z.string().optional(),
  secondary_color: z.string().optional(),
})

// ── courseSchema tests ──────────────────────────────────────────────────────
describe('courseSchema', () => {
  it('acepta datos válidos', () => {
    const result = courseSchema.safeParse({
      title: 'Inglés A2',
      description: 'Curso de inglés nivel A2',
      published: true,
    })
    expect(result.success).toBe(true)
  })

  it('rechaza un título menor a 3 caracteres', () => {
    const result = courseSchema.safeParse({ title: 'AB' })
    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.title).toContain('El título debe tener al menos 3 caracteres')
  })

  it('acepta curso sin descripción ni published', () => {
    const result = courseSchema.safeParse({ title: 'Matemáticas' })
    expect(result.success).toBe(true)
  })
})

// ── materialSchema tests ────────────────────────────────────────────────────
describe('materialSchema', () => {
  it('acepta datos válidos con URL', () => {
    const result = materialSchema.safeParse({
      title: 'Clase 1 - Introducción',
      file_url: 'https://storage.supabase.co/materials/clase1.pdf',
      file_type: 'pdf',
      order_index: 0,
    })
    expect(result.success).toBe(true)
  })

  it('rechaza una URL malformada', () => {
    const result = materialSchema.safeParse({
      title: 'Clase 2',
      file_url: 'no-es-una-url',
    })
    expect(result.success).toBe(false)
  })

  it('acepta file_url vacía (string vacío)', () => {
    const result = materialSchema.safeParse({
      title: 'Clase 3',
      file_url: '',
    })
    expect(result.success).toBe(true)
  })

  it('convierte order_index string a número', () => {
    const result = materialSchema.safeParse({
      title: 'Clase 4',
      order_index: '2',
    })
    expect(result.success).toBe(true)
    expect((result as { success: true; data: { order_index?: number } }).data.order_index).toBe(2)
  })
})

// ── instituteSchema tests ───────────────────────────────────────────────────
describe('instituteSchema', () => {
  it('acepta datos válidos', () => {
    const result = instituteSchema.safeParse({
      name: 'Instituto San Martín',
      slug: 'san-martin',
      primary_color: var(--ag-navy),
      secondary_color: 'var(--ag-navy)',
    })
    expect(result.success).toBe(true)
  })

  it('rechaza un slug con mayúsculas', () => {
    const result = instituteSchema.safeParse({
      name: 'Instituto Test',
      slug: 'InstitutoTest',
    })
    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.slug).toBeDefined()
  })

  it('rechaza un slug con espacios', () => {
    const result = instituteSchema.safeParse({
      name: 'Instituto Test',
      slug: 'instituto test',
    })
    expect(result.success).toBe(false)
  })

  it('rechaza un nombre menor a 3 caracteres', () => {
    const result = instituteSchema.safeParse({ name: 'AB', slug: 'ab' })
    expect(result.success).toBe(false)
  })
})
