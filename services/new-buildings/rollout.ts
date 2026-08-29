/** One build-time switch is shared by server rendering, proxy and client bundles.
 * Rebuild when changing it; URL parameters/cookies never enable the new UI.
 * The compatible backend and accepted CRM receipts remain available in both modes.
 */
export function residentialV2Enabled(value: string | undefined): boolean {
  // The approved first release is on by default; an explicit build-time false
  // remains the single rollback mechanism. Malformed configured values fail closed.
  return value === undefined || value === 'true';
}

export const RESIDENTIAL_V2_ENABLED = residentialV2Enabled(process.env.NEXT_PUBLIC_RESIDENTIAL_V2_ENABLED);

export function residentialV2OnlyPath(pathname: string): boolean {
  return /^\/new-buildings\/[^/]+\/units(?:\/|$)/.test(pathname) || /^\/comparison\/units(?:\/|$)/.test(pathname);
}

/** Preserve saved targets during rollback; their building still has a legacy view. */
export function residentialRolloutHref(href: string, enabled = RESIDENTIAL_V2_ENABLED): string {
  if (enabled) return href;
  const unit = /^\/new-buildings\/([1-9]\d{0,14})\/units\/[^/?#]+(?:[/?#]|$)/.exec(href);
  return unit ? '/new-buildings/' + unit[1] : href;
}

export function residentialRolloutUnavailableHtml(): string {
  return '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>Раздел временно недоступен — Manora</title></head><body style="font:18px/1.6 system-ui;margin:8vh auto;padding:24px;max-width:700px"><main><h1>Раздел временно недоступен</h1><p>Новый интерфейс квартир временно отключён. Информацию о жилом комплексе можно посмотреть в каталоге.</p><a href="/new-buildings">Открыть каталог ЖК</a></main></body></html>';
}
