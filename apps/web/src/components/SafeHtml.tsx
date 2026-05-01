import DOMPurify from 'dompurify';

type Props = { html: string; className?: string };

export function SafeHtml({ html, className = 'article-body' }: Props) {
  const clean = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
