
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_goal_minutes INT NOT NULL DEFAULT 180;

CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  color TEXT NOT NULL DEFAULT 'violet',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subject_id UUID NOT NULL REFERENCES public.subjects ON DELETE CASCADE,
  name TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  strength TEXT NOT NULL DEFAULT 'average',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subject_id UUID REFERENCES public.subjects ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  storage_path TEXT,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'ready',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_id UUID NOT NULL REFERENCES public.documents ON DELETE CASCADE,
  kind TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  score INT NOT NULL DEFAULT 0,
  total INT NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.study_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  subject TEXT,
  task_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TEXT,
  end_time TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  subject TEXT,
  exam_date DATE NOT NULL,
  syllabus_percent INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subject TEXT,
  minutes INT NOT NULL DEFAULT 0,
  studied_on DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects, public.topics, public.documents, public.ai_outputs, public.quiz_attempts, public.study_tasks, public.exams, public.study_sessions, public.chat_messages TO authenticated;
GRANT ALL ON public.subjects, public.topics, public.documents, public.ai_outputs, public.quiz_attempts, public.study_tasks, public.exams, public.study_sessions, public.chat_messages TO service_role;

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own subjects" ON public.subjects FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own topics" ON public.topics FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own documents" ON public.documents FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own ai outputs" ON public.ai_outputs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own quiz attempts" ON public.quiz_attempts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own study tasks" ON public.study_tasks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own exams" ON public.exams FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own study sessions" ON public.study_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own chat messages" ON public.chat_messages FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  u UUID := NEW.id;
  py UUID; cn UUID; ma UUID; ml UUID;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    u,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email, 'Student'), '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.subjects (user_id, name, code, color) VALUES (u, 'Python Programming', 'CS201', 'violet') RETURNING id INTO py;
  INSERT INTO public.subjects (user_id, name, code, color) VALUES (u, 'Computer Networks', 'CS305', 'sky') RETURNING id INTO cn;
  INSERT INTO public.subjects (user_id, name, code, color) VALUES (u, 'Mathematics', 'MA202', 'emerald') RETURNING id INTO ma;
  INSERT INTO public.subjects (user_id, name, code, color) VALUES (u, 'Machine Learning', 'CS402', 'amber') RETURNING id INTO ml;

  INSERT INTO public.topics (user_id, subject_id, name, completed, strength) VALUES
    (u, py, 'Variables & Data Types', true, 'strong'),
    (u, py, 'Operators', true, 'strong'),
    (u, py, 'Conditional Statements', true, 'strong'),
    (u, py, 'Loops', true, 'weak'),
    (u, py, 'Functions', true, 'weak'),
    (u, py, 'Lists & Tuples', true, 'average'),
    (u, py, 'Dictionaries & Sets', false, 'average'),
    (u, py, 'File Handling', false, 'average'),
    (u, py, 'OOP in Python', false, 'weak'),
    (u, py, 'Exception Handling', false, 'average'),
    (u, cn, 'OSI Model', true, 'strong'),
    (u, cn, 'TCP/IP Model', true, 'average'),
    (u, cn, 'IP Addressing', true, 'average'),
    (u, cn, 'Subnetting', true, 'weak'),
    (u, cn, 'Routing Algorithms', false, 'weak'),
    (u, cn, 'Transport Layer', false, 'average'),
    (u, cn, 'Application Layer', false, 'average'),
    (u, cn, 'Network Security', false, 'weak'),
    (u, cn, 'Wireless Networks', false, 'average'),
    (u, cn, 'Error Detection', false, 'average'),
    (u, ma, 'Limits & Continuity', true, 'strong'),
    (u, ma, 'Differentiation', true, 'strong'),
    (u, ma, 'Integration', true, 'average'),
    (u, ma, 'Matrices', true, 'strong'),
    (u, ma, 'Determinants', true, 'strong'),
    (u, ma, 'Probability', true, 'average'),
    (u, ma, 'Vectors', true, 'average'),
    (u, ma, 'Differential Equations', false, 'weak'),
    (u, ma, 'Complex Numbers', false, 'average'),
    (u, ma, 'Series & Sequences', false, 'average'),
    (u, ml, 'Supervised Learning', true, 'strong'),
    (u, ml, 'Linear Regression', true, 'strong'),
    (u, ml, 'Logistic Regression', true, 'average'),
    (u, ml, 'Decision Trees', true, 'average'),
    (u, ml, 'Model Evaluation', true, 'weak'),
    (u, ml, 'Unsupervised Learning', false, 'average'),
    (u, ml, 'Neural Networks', false, 'weak'),
    (u, ml, 'Overfitting & Regularization', false, 'weak'),
    (u, ml, 'Feature Engineering', false, 'average'),
    (u, ml, 'Clustering', false, 'average');

  INSERT INTO public.exams (user_id, title, subject, exam_date, syllabus_percent) VALUES
    (u, 'Python Programming Exam', 'Python Programming', CURRENT_DATE + 12, 65),
    (u, 'Computer Networks Mid-Term', 'Computer Networks', CURRENT_DATE + 21, 40),
    (u, 'Mathematics Final', 'Mathematics', CURRENT_DATE + 34, 75);

  INSERT INTO public.study_tasks (user_id, title, subject, task_date, start_time, end_time, completed) VALUES
    (u, 'Revise Python loops', 'Python Programming', CURRENT_DATE, '17:00', '17:45', false),
    (u, 'Practice Matrices problems', 'Mathematics', CURRENT_DATE, '18:00', '18:45', false),
    (u, 'Quick revision of OSI model', 'Computer Networks', CURRENT_DATE, '19:00', '19:30', false),
    (u, 'Read ML model evaluation notes', 'Machine Learning', CURRENT_DATE + 1, '17:00', '17:45', false),
    (u, 'Solve 10 Python MCQs', 'Python Programming', CURRENT_DATE + 1, '18:00', '18:30', false),
    (u, 'Subnetting practice', 'Computer Networks', CURRENT_DATE + 2, '17:30', '18:15', false);

  INSERT INTO public.study_sessions (user_id, subject, minutes, studied_on) VALUES
    (u, 'Python Programming', 95, CURRENT_DATE),
    (u, 'Mathematics', 60, CURRENT_DATE),
    (u, 'Computer Networks', 75, CURRENT_DATE - 1),
    (u, 'Python Programming', 120, CURRENT_DATE - 2),
    (u, 'Machine Learning', 45, CURRENT_DATE - 3),
    (u, 'Mathematics', 90, CURRENT_DATE - 4),
    (u, 'Computer Networks', 50, CURRENT_DATE - 5),
    (u, 'Python Programming', 80, CURRENT_DATE - 6);

  INSERT INTO public.quiz_attempts (user_id, subject, topic, difficulty, questions, answers, score, total, completed, created_at) VALUES
    (u, 'Python Programming', 'Loops', 'medium', '[]'::jsonb, '[]'::jsonb, 6, 10, true, now() - interval '2 days'),
    (u, 'Mathematics', 'Matrices', 'easy', '[]'::jsonb, '[]'::jsonb, 9, 10, true, now() - interval '4 days'),
    (u, 'Computer Networks', 'Subnetting', 'hard', '[]'::jsonb, '[]'::jsonb, 5, 10, true, now() - interval '6 days');

  RETURN NEW;
END; $$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
