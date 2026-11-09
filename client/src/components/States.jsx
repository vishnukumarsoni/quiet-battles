import { Link } from 'react-router-dom';

export function Spinner({ label = 'Loading' }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-4 py-24 text-ash">
      <span className="h-6 w-6 animate-spin rounded-full border border-graphite border-t-clay" />
      <span className="eyebrow">{label}</span>
    </div>
  );
}

export function GridSkeleton({ count = 4, ratio = '4/5' }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <div className="skeleton w-full" style={{ aspectRatio: ratio }} />
          <div className="skeleton mt-4 h-3 w-2/3" />
          <div className="skeleton mt-2 h-3 w-1/4" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <h2 className="font-display text-3xl">{title}</h2>
      {text && <p className="mt-3 text-sm leading-relaxed text-ash">{text}</p>}
      {action && (
        <Link to={action.to} className="btn mt-8">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  const notFound = error?.response?.status === 404;
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <p className="eyebrow">{notFound ? '404' : 'Error'}</p>
      <h2 className="mt-3 font-display text-3xl">{notFound ? 'We could not find that page' : 'Something went wrong'}</h2>
      <p className="mt-3 text-sm text-ash">
        {notFound
          ? 'It may have moved, or it is not published yet.'
          : error?.response?.data?.message || 'The server could not be reached. Please try again.'}
      </p>
      <div className="mt-8 flex justify-center gap-3">
        {onRetry && !notFound && (
          <button onClick={onRetry} className="btn">
            Try again
          </button>
        )}
        <Link to="/" className="btn">
          Back home
        </Link>
      </div>
    </div>
  );
}
