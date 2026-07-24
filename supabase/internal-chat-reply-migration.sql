alter table internal_chat_messages
add column if not exists reply_to_message_id uuid
references internal_chat_messages(id)
on delete set null;

create index if not exists
internal_chat_messages_reply_idx
on internal_chat_messages(reply_to_message_id);
