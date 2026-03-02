'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Use this hook to warn about unsaved changes.
 * - when: показывать предупреждение
 * - message: текст confirm
 */
export function useUnsavedChanges(when: boolean, message = 'Есть несохранённые изменения. Выйти со страницы?') {
    const router = useRouter();
    const initialUrlRef = useRef<string | null>(null);

    useEffect(() => {
        if (!when) {
            // если флаг false — ничего не делаем
            return;
        }

        // сохраняем текущий URL при активации (может пригодиться)
        initialUrlRef.current = window.location.href;

        // beforeunload — при перезагрузке/закрытии вкладки
        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            // большинство браузеров игнорируют пользовательский текст, возвращаем пустую строку
            e.returnValue = '';
            return '';
        };
        window.addEventListener('beforeunload', onBeforeUnload);

        // перехват ссылок <a>
        const onDocumentClick = (e: MouseEvent) => {
            const anchor = (e.target as HTMLElement)?.closest('a[href]') as HTMLAnchorElement | null;
            if (!anchor) return;

            // игнорируем внешние/target=_blank/якоря на той же странице
            try {
                const sameOrigin = anchor.origin === window.location.origin;
                if (!sameOrigin || anchor.target === '_blank' || anchor.href === window.location.href) return;
            } catch {
                return;
            }

            e.preventDefault();
            const href = anchor.getAttribute('href') || '/';
            if (window.confirm(message)) {
                // разрешил уход — SPA-навигация
                router.push(href);
            } else {
                // пользователь отменил — ничего не делаем
            }
        };
        document.addEventListener('click', onDocumentClick);

        // Обработка кнопки "назад/вперёд" (popstate)
        // Если пользователь отменил уход — мы встаём на место, чтобы он не ушёл
        const onPopState = (ev: PopStateEvent) => {
            // вопрос пользователю
            const ok = window.confirm(message);
            if (!ok) {
                // отменил уход — вставим текущую запись обратно, чтобы не уходить
                try {
                    // pushState здесь нужен, чтобы "вернуть" пользователя назад в текущую страницу
                    history.pushState(null, '', window.location.href);
                } catch {
                    // ignore
                }
            } else {
                // согласился — позволяем навигации происходить
                // ничего дополнительно не делаем
            }
        };
        window.addEventListener('popstate', onPopState);

        return () => {
            window.removeEventListener('beforeunload', onBeforeUnload);
            document.removeEventListener('click', onDocumentClick);
            window.removeEventListener('popstate', onPopState);
            initialUrlRef.current = null;
        };
    }, [when, message, router]);
}