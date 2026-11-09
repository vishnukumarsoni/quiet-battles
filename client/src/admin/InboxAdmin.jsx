import { useState } from 'react';
import { Mail, MailOpen, Trash2 } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import { formsApi } from '../services';
import { errorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatDateTime } from '../utils/format';
import { ErrorState, Spinner } from '../components/States';
import { Empty, PageHeader } from './components/ui';

export default function InboxAdmin() {
  const toast = useToast();
  const [tab, setTab] = useState('messages');
  const messages = useFetch(() => formsApi.messages({ limit: 100 }), []);
  const subs = useFetch(() => formsApi.subscribers({ limit: 200 }), []);

  const run = async (fn, done, reload) => {
    try { await fn(); toast.success(done); reload(); } catch (err) { toast.error(errorMessage(err)); }
  };
  const tabBtn = (id, label, n) => (
    <button onClick={() => setTab(id)} className={`border-b-2 px-1 pb-3 text-sm ${tab === id ? 'border-clay text-bone' : 'border-transparent text-ash hover:text-bone'}`}>{label} <span className="ml-1 text-xs text-ash">{n ?? ''}</span></button>
  );

  return (
    <>
      <PageHeader title="Inbox" subtitle="Contact-form messages and newsletter sign-ups." />
      <div className="mb-6 flex gap-8 border-b border-graphite">
        {tabBtn('messages', 'Messages', messages.meta?.total)}
        {tabBtn('subs', 'Subscribers', subs.meta?.total)}
      </div>

      {tab === 'messages' && (messages.loading ? <Spinner /> : messages.error ? <ErrorState error={messages.error} onRetry={messages.reload} /> : messages.data.length === 0 ? <Empty>No messages yet.</Empty> : (
        <ul className="divide-y divide-graphite border border-graphite">
          {messages.data.map((m) => (
            <li key={m.id} className={`px-5 py-4 ${m.isRead ? '' : 'bg-coal'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{m.name} <a href={`mailto:${m.email}`} className="ml-2 text-xs font-normal text-clay">{m.email}</a></p>
                  <p className="text-xs text-ash">{formatDateTime(m.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  <button className="adm-btn !px-2" title={m.isRead ? 'Mark unread' : 'Mark read'} aria-label={m.isRead ? 'Mark unread' : 'Mark read'} onClick={() => run(() => formsApi.markRead(m.id, !m.isRead), 'Updated', messages.reload)}>{m.isRead ? <MailOpen size={14} /> : <Mail size={14} />}</button>
                  <button className="adm-btn adm-btn-danger !px-2" aria-label="Delete message" onClick={() => window.confirm('Delete this message?') && run(() => formsApi.removeMessage(m.id), 'Message deleted', messages.reload)}><Trash2 size={14} /></button>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-bone/85">{m.message}</p>
            </li>
          ))}
        </ul>
      ))}

      {tab === 'subs' && (subs.loading ? <Spinner /> : subs.error ? <ErrorState error={subs.error} onRetry={subs.reload} /> : subs.data.length === 0 ? <Empty>No subscribers yet.</Empty> : (
        <ul className="divide-y divide-graphite border border-graphite">
          {subs.data.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
              <span>{s.email}</span>
              <span className="flex items-center gap-4 text-xs text-ash">{formatDateTime(s.createdAt)}
                <button className="adm-btn adm-btn-danger !px-2" aria-label={`Remove ${s.email}`} onClick={() => run(() => formsApi.removeSubscriber(s.id), 'Subscriber removed', subs.reload)}><Trash2 size={13} /></button>
              </span>
            </li>
          ))}
        </ul>
      ))}
    </>
  );
}
