export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
  phonePrefix: string;
  currency: string;
  locale: string;
  timezone: string;
}

export const COUNTRIES: readonly CountryInfo[] = [
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', phonePrefix: '+57', currency: 'COP', locale: 'es-CO', timezone: 'America/Bogota' },
  { code: 'MX', name: 'México', flag: '🇲🇽', phonePrefix: '+52', currency: 'MXN', locale: 'es-MX', timezone: 'America/Mexico_City' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪', phonePrefix: '+51', currency: 'PEN', locale: 'es-PE', timezone: 'America/Lima' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨', phonePrefix: '+593', currency: 'USD', locale: 'es-EC', timezone: 'America/Guayaquil' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', phonePrefix: '+56', currency: 'CLP', locale: 'es-CL', timezone: 'America/Santiago' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', phonePrefix: '+54', currency: 'ARS', locale: 'es-AR', timezone: 'America/Buenos_Aires' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪', phonePrefix: '+58', currency: 'VES', locale: 'es-VE', timezone: 'America/Caracas' },
  { code: 'PA', name: 'Panamá', flag: '🇵🇦', phonePrefix: '+507', currency: 'USD', locale: 'es-PA', timezone: 'America/Panama' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷', phonePrefix: '+506', currency: 'CRC', locale: 'es-CR', timezone: 'America/Costa_Rica' },
  { code: 'DO', name: 'Rep. Dominicana', flag: '🇩🇴', phonePrefix: '+1', currency: 'DOP', locale: 'es-DO', timezone: 'America/Santo_Domingo' },
];

export function getCountry(code: string | null | undefined): CountryInfo {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}
