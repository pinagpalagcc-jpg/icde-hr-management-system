-- Add Admin-to-Admin conversation support without breaking
-- existing Admin-to-Staff conversations.

alter table internal_chat_conversations
add column if not exists conversation_type text;

alter table internal_chat_conversations
add column if not exists admin_one_id uuid
references employees(id)
on delete cascade;

alter table internal_chat_conversations
add column if not exists admin_two_id uuid
references employees(id)
on delete cascade;

update internal_chat_conversations
set conversation_type = 'AdminStaff'
where conversation_type is null
  and employee_id is not null;

alter table internal_chat_conversations
alter column conversation_type
set default 'AdminStaff';

alter table internal_chat_conversations
drop constraint if exists internal_chat_conversations_type_check;

alter table internal_chat_conversations
add constraint internal_chat_conversations_type_check
check (
  conversation_type in (
    'AdminStaff',
    'AdminAdmin'
  )
);

alter table internal_chat_conversations
drop constraint if exists internal_chat_conversations_participants_check;

alter table internal_chat_conversations
add constraint internal_chat_conversations_participants_check
check (
  (
    conversation_type = 'AdminStaff'
    and employee_id is not null
    and admin_one_id is null
    and admin_two_id is null
  )
  or
  (
    conversation_type = 'AdminAdmin'
    and employee_id is null
    and admin_one_id is not null
    and admin_two_id is not null
    and admin_one_id <> admin_two_id
  )
);

alter table internal_chat_conversations
alter column employee_id
drop not null;

create index if not exists
internal_chat_conversations_admin_one_idx
on internal_chat_conversations(admin_one_id);

create index if not exists
internal_chat_conversations_admin_two_idx
on internal_chat_conversations(admin_two_id);

create unique index if not exists
internal_chat_conversations_admin_pair_unique
on internal_chat_conversations (
  least(admin_one_id, admin_two_id),
  greatest(admin_one_id, admin_two_id)
)
where conversation_type = 'AdminAdmin';
