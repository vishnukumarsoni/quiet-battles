import { useState } from 'react';
import { imgUrl } from '../utils/format';

// An <img> that is lazy-loaded, has a grey block while loading, and fades in.
// Pass eager for the first big image on a page (so it is not delayed).
export default function Img({ src, alt = '', className = '', eager = false, ratio, ...rest }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const url = imgUrl(src);

  return (
    <div className={`relative overflow-hidden bg-coal ${className}`} style={ratio ? { aspectRatio: ratio } : undefined}>
      {url && !failed ? (
        <img
          src={url}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          fetchpriority={eager ? 'high' : 'auto'}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`img-fade ${loaded ? 'loaded' : ''} absolute inset-0 h-full w-full object-cover`}
          {...rest}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-wider2 text-ash/60">
          No image
        </div>
      )}
    </div>
  );
}
