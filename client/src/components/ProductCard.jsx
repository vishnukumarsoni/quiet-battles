import { Link } from 'react-router-dom';
import Img from './Img';
import { formatPrice } from '../utils/format';

export default function ProductCard({ product, className = '' }) {
  const soldOut = product.stock < 1;
  const [first, second] = product.images || [];
  return (
    <Link to={`/products/${product.slug}`} className={`group block ${className}`}>
      <div className="relative">
        <Img src={first} alt={product.name} ratio="4/5" className="w-full" />
        {second && (
          // the second photo fades in on hover (desktop only)
          <Img src={second} alt="" ratio="4/5" className="absolute inset-0 w-full opacity-0 transition-opacity duration-500 group-hover:opacity-100 max-md:hidden" />
        )}
        {soldOut && <span className="absolute left-3 top-3 bg-ink/90 px-2.5 py-1 text-[10px] uppercase tracking-wider2">Sold out</span>}
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h3 className="text-[15px] leading-snug transition-colors group-hover:text-clay">{product.name}</h3>
        <p className="shrink-0 text-sm text-ash">{formatPrice(product.price)}</p>
      </div>
      <p className="mt-1 text-[11px] uppercase tracking-wider2 text-ash/70">{product.category}</p>
    </Link>
  );
}
