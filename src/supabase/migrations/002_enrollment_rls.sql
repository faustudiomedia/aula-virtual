-- ============================================================
-- MAVIC – Migration 002: Enrollment RLS + Progress policies
-- ============================================================

-- Allow students to enroll themselves in published courses
create policy "student can enroll in published courses"
  on enrollments for insert
    with check (
            student_id = auth.uid()
                and exists (
                          select 1 from courses c
                                where c.id = course_id
                                        and c.published = true
                                                and c.institute_id = auth_institute()
                )
                  );

                  -- Allow students to unenroll themselves
                  create policy "student can unenroll"
                    on enrollments for delete
                      using (student_id = auth.uid());

                      -- Allow students to update their own enrollment progress
                      create policy "student updates own enrollment progress"
                        on enrollments for update  using (student_id = auth.uid())
                          with check (student_id = auth.uid());

                          -- Allow teachers to enroll/manage students in their courses
                          create policy "teacher manages enrollments in own courses"
                            on enrollments for all
                              using (
                                    exists (
                                              select 1 from courses c
                                                    where c.id = enrollments.course_id        and c.teacher_id = auth.uid()
                                    )
                                      );

                                      -- Allow admin to manage all enrollments
                                      create policy "admin manages all enrollments"
                                        on enrollments for all
                                          using (auth_role() = 'admin');
                                    )
                              )
                )
    )