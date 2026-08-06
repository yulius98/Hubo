import en from './en';
import id from './id';

const locales: Record<string, Record<string, string>> = { id, en };

export function t(
    key: string,
    locale: string = 'id',
    params?: Record<string, string | number>,
): string {
    const translations = locales[locale] ?? locales.id;
    let text = translations[key] ?? key;

    if (params) {
        for (const [k, v] of Object.entries(params)) {
            text = text.replace(`{${k}}`, String(v));
        }
    }

    return text;
}
