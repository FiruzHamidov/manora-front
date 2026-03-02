'use client';
import React from 'react';
import DOMPurify from 'isomorphic-dompurify';

interface Props {
    html?: string; // rejection_comment (HTML) from API
    className?: string;
}

export default function SafeHtml({ html = '', className = '' }: Props) {
    if (!html) return null;

    // Опционально: ограничить допустимые тэги/атрибуты
    const clean = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
            'b','i','em','strong','a','ul','ol','li','p','br','span'
        ],
        ALLOWED_ATTR: ['href','target','rel','class']
    });

    return (
        <div
            className={className}
            // ОПАСНО, но безопасно т.к. мы предварительно обработали clean
            dangerouslySetInnerHTML={{ __html: clean }}
        />
    );
}