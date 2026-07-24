create extension if not exists pgcrypto;

create table if not exists internal_chat_conversations (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(employee_id)
);

create table if not exists internal_chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null
    references internal_chat_conversations(id)
    on delete cascade,

  sender_id uuid not null,
  sender_role text not null
    check (sender_role in ('Admin', 'Staff')),

  message_text text,
  attachment_name text,
  attachment_url text,
  attachment_type text,

  seen_by_admin boolean not null default false,
  seen_by_employee boolean not null default false,

  created_at timestamptz not null default now(),

  check (
    coalesce(length(trim(message_text)), 0) > 0
    or attachment_url is not null
  )
);

create index if not exists internal_chat_conversations_employee_idx
on internal_chat_conversations(employee_id);

create index if not exists internal_chat_messages_conversation_idx
on internal_chat_messages(conversation_id, created_at);

create or replace function update_internal_chat_conversation_time()
returns trigger
language plpgsql
as $$
begin
  update internal_chat_conversations
  set updated_at = now()
  where id = new.conversation_id;

  return new;
end;
$$;

drop trigger if exists internal_chat_message_timestamp
on internal_chat_messages;

create trigger internal_chat_message_timestamp
after insert on internal_chat_messages
for each row
execute function update_internal_chat_conversation_time();

-- Chat tables are private.
-- The public browser key cannot read or change chat records.
alter table internal_chat_conversations
enable row level security;

alter table internal_chat_messages
enable row level security;

revoke all
on internal_chat_conversations
from anon, authenticated;

revoke all
on internal_chat_messages
from anon, authenticated;
