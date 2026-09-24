import { describe, it, expect } from 'vitest';
import { COUNTRIES, getCountry } from './countries';

describe('getCountry', () => {
  it('devuelve el pais por codigo', () => {
    const mx = getCountry('MX');
    expect(mx).toMatchObject({ code: 'MX', currency: 'MXN', locale: 'es-MX', timezone: 'America/Mexico_City' });
  });

  it('cae en Colombia para un codigo desconocido', () => {
    expect(getCountry('XX').code).toBe('CO');
  });

  it('cae en Colombia para null/undefined', () => {
    expect(getCountry(null).code).toBe('CO');
    expect(getCountry(undefined).code).toBe('CO');
  });

  it('incluye los 10 paises soportados con Colombia primero', () => {
    expect(COUNTRIES).toHaveLength(10);
    expect(COUNTRIES[0].code).toBe('CO');
  });
});
