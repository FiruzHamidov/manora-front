'use client';

import { useId, useState } from 'react';
import { residentialCanonical, shareResidential, type ResidentialShareTarget } from '@/services/new-buildings/sharing';

export default function ResidentialShareButton({ title, className, ...target }: ResidentialShareTarget & { title: string; className?: string }) {
  const id = useId(), [busy, setBusy] = useState(false), [result, setResult] = useState<string | null>(null), [manual, setManual] = useState(false);
  const url = residentialCanonical(target);
  async function share() {
    setBusy(true); setResult(null); setManual(false);
    try {
      const outcome = await shareResidential(target, title, navigator);
      setManual(outcome === 'manual');
      setResult(outcome === 'copied' ? 'Ссылка скопирована.' : outcome === 'native' ? 'Ссылка передана системному меню.'
        : outcome === 'cancelled' ? 'Отправка отменена.' : 'Браузер не разрешил копирование. Выделите и скопируйте ссылку вручную.');
    } finally { setBusy(false); }
  }
  return <div className="mb-4 min-w-0 space-y-2">
    <button type="button" disabled={busy} className={className || 'min-h-11 rounded-xl border border-green-800 px-4 py-2 text-green-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800'} onClick={() => void share()}>Поделиться</button>
    {result && <p role="status" className="text-sm">{result}</p>}
    {manual && <div><label htmlFor={id} className="text-sm">Ссылка без личных параметров</label><input id={id} readOnly value={url} onFocus={event => event.currentTarget.select()} className="min-h-11 w-full rounded border bg-white p-2 text-sm text-gray-900" /></div>}
  </div>;
}
