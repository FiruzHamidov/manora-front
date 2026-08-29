/** Query variants keep a clean canonical but are not separate indexable pages. */
export function residentialRobots(search: Record<string, unknown>) {
  const index = Object.keys(search).length === 0;
  return { index, follow: true, googleBot: { index, follow: true } };
}
