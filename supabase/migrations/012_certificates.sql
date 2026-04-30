-- Agregamos información del director a Institutos
ALTER TABLE institutes
ADD COLUMN IF NOT EXISTS director_name text,
ADD COLUMN IF NOT EXISTS director_signature_url text;

-- Agregamos firma al perfil (para profesores)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS signature_url text;

-- Tabla de Solicitudes de Certificados
CREATE TYPE certificate_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE IF NOT EXISTS certificate_requests (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    
    status certificate_status NOT NULL DEFAULT 'pending',
    
    -- Quién lo aprobó
    approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at timestamptz,
    
    -- Código alfanumérico único para URL bonita (ej. /certificates/ABCD-1234)
    certificate_code text UNIQUE,
    
    created_at timestamptz NOT NULL DEFAULT now(),
    
    -- Un alumno solo puede pedir/tener un certificado por cada curso
    UNIQUE(student_id, course_id)
);

-- Políticas RLS
ALTER TABLE certificate_requests ENABLE ROW LEVEL SECURITY;

-- 1. Alumnos pueden ver sus propias solicitudes
CREATE POLICY "student reads own certificate_requests"
  ON certificate_requests FOR SELECT
  USING (student_id = auth.uid());

-- 2. Alumnos pueden insertar sus propias solicitudes (solo si están enrollados)
CREATE POLICY "student inserts own certificate_requests"
  ON certificate_requests FOR INSERT
  WITH CHECK (
    student_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM enrollments 
      WHERE course_id = certificate_requests.course_id 
      AND student_id = auth.uid() 
      AND completed = true
    )
  );

-- 3. Profesores pueden ver y actualizar solicitudes de sus cursos
CREATE POLICY "teacher manages certificate_requests in own courses"
  ON certificate_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = certificate_requests.course_id
      AND c.teacher_id = auth.uid()
    )
  );

-- 4. Admins pueden hacer todo en las solicitudes (de su instituto o super_admins)
CREATE POLICY "admin manages all certificate_requests"
  ON certificate_requests FOR ALL
  USING (auth_role() = 'admin' OR auth_role() = 'super_admin');

-- Visor de certificado: Cualquier persona con el código puede verlo
CREATE POLICY "public reads valid certificates"
  ON certificate_requests FOR SELECT
  USING (status = 'approved');
