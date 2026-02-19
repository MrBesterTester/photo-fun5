/** Google reCAPTCHA v2 global type declarations */
interface GrecaptchaRenderParameters {
  sitekey: string;
  callback?: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: () => void;
  theme?: 'dark' | 'light';
  size?: 'compact' | 'normal' | 'invisible';
}

interface Grecaptcha {
  render: (container: string | HTMLElement, parameters: GrecaptchaRenderParameters) => number;
  reset: (widgetId?: number) => void;
  getResponse: (widgetId?: number) => string;
  execute: (widgetId?: number) => void;
  ready: (callback: () => void) => void;
}

declare const grecaptcha: Grecaptcha;
