import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';

export function SiteFooter() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-zinc-800 bg-zinc-900 text-zinc-400">
      <div className="mx-auto max-w-content px-4 py-12">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:items-start">
          <div className="text-center md:text-left">
            <p className="text-sm font-medium text-zinc-200">{t('nav.siteName')}</p>
            <p className="mt-2 max-w-sm text-xs leading-relaxed">{t('footer.tagline')}</p>
          </div>
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-zinc-300">
            <Link className="hover:text-white" to="/about">
              {t('footer.navAbout')}
            </Link>
            <span className="cursor-default hover:text-white">{t('footer.navLinks')}</span>
            <span className="cursor-default hover:text-white">{t('footer.navPrivacy')}</span>
          </nav>
        </div>
        <p className="mt-10 text-center text-xs text-zinc-500">
          {t('footer.copyright').replace('{year}', String(year))}
        </p>
      </div>
    </footer>
  );
}
