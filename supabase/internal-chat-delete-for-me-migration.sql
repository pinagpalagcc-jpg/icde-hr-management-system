alter table internal_chat_messages
add column if not exists hidden_by_admin boolean
not null default false;

alter table internal_chat_messages
add column if not exists hidden_by_employee boolean
not null default false;
