import { useEffect, useState } from 'react';

export type Route = { name: 'home' } | { name: 'library' } | { name: 'service'; id: string };

const parse = (hash: string): Route => {
  const match = /^#\/s\/(.+)$/.exec(hash);
  if (match) return { name: 'service', id: decodeURIComponent(match[1]) };
  if (hash === '#/library') return { name: 'library' };
  return { name: 'home' };
};

export const navigate = (path: string) => {
  window.location.hash = path;
};

export const useRoute = (): Route => {
  const [route, setRoute] = useState(() => parse(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parse(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
};
