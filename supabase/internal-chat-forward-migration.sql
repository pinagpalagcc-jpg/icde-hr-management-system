alter table internal_chat_messages
add column if not exists forwarded_from_message_id uuid
references internal_chat_messages(id)
on delete set null;

create index if not exists
internal_chat_messages_forwarded_idx
on internal_chat_messages(forwarded_from_message_id);
