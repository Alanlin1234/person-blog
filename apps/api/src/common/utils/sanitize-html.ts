import { JSDOM } from 'jsdom';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const domPurifyModule = require('dompurify');
const createDOMPurify =
  typeof domPurifyModule === 'function' ? domPurifyModule : domPurifyModule.default;

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window as any);

export function sanitizePostHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target'],
  });
}
