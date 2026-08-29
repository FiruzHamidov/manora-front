/** Keep floating actions out of sections with their own form or contact controls. */
export function observeContactSections(sections: (Element | null)[], onVisibilityChange: (show: boolean) => void) {
  onVisibilityChange(false);
  if (typeof IntersectionObserver === 'undefined') return () => {};
  const visible = new Set<Element>();
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
    }
    onVisibilityChange(visible.size === 0);
  });
  for (const section of sections) if (section) observer.observe(section);
  return () => observer.disconnect();
}
