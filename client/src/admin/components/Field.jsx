export default function Field({ label, error, hint, children, className = '' }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-medium text-ash">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ash/70">{hint}</p>}
      {error && <p role="alert" className="mt-1 text-xs text-[#e2958c]">{error}</p>}
    </div>
  );
}
