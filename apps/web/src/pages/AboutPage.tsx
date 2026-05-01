import { useI18n } from '../i18n/I18nProvider';

export function AboutPage() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-content px-4 py-16">
      <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-100 bg-white p-10 shadow-card">
        <h1 className="text-2xl font-bold text-zinc-900">{t('about.title')}</h1>
        <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-zinc-600">{t('about.body')}</p>
      </div>
    </div>
  );
}
