import i18n from 'i18n';
import path from 'path';

i18n.configure({
  locales: ['ru', 'en'],
  defaultLocale: 'ru',
  directory: path.join(__dirname, 'locales'),
  objectNotation: true,
  updateFiles: false,
});

export { i18n };
