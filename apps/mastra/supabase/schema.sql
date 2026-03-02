-- Enable UUID generation support.
create extension if not exists pgcrypto;

create table if not exists public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  level text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.interview_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  question text not null,
  initial_code text,
  type text not null check (type in ('coding', 'theoretical')),
  created_at timestamptz not null default now()
);

create unique index if not exists interview_questions_session_question_uk
  on public.interview_questions(session_id, question);

create index if not exists interview_questions_session_created_idx
  on public.interview_questions(session_id, created_at);

create table if not exists public.interview_feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  question_id uuid not null references public.interview_questions(id) on delete cascade,
  answer text not null,
  level text not null,
  score numeric(4,2) not null check (score >= 0 and score <= 10),
  critique text not null,
  missed_points text[] not null default '{}',
  improved_code text,
  created_at timestamptz not null default now()
);

create index if not exists interview_feedback_session_created_idx
  on public.interview_feedback(session_id, created_at);
