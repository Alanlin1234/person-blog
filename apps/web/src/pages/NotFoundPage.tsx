import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';

export function NotFoundPage() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
      <p className="text-8xl font-black text-brand/20">{t('notFound.title')}</p>
      <p className="mt-4 text-xl font-medium text-zinc-800">{t('notFound.message')}</p>
      <div className="mt-10 text-6xl" aria-hidden>
        🛸
      </div>
      <Link
        to="/"
        className="mt-10 inline-flex rounded-xl bg-brand px-8 py-3 text-sm font-semibold text-white shadow-lg hover:bg-brand-hover"
      >
        {t('notFound.cta')}
      </Link>
    </div>
  );
}
