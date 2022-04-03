import '@testing-library/jest-dom/extend-expect';
import { getPortals, Portal } from './portals';

describe('Portals', () => {
  describe('getPortals()', () => {
    test('returns correct values', () => {
      const expected: Portal[] = [
        {
          domain: 'siasky.net',
          displayName: 'siasky.net',
        },
        {
          domain: 'fileportal.org',
          displayName: 'fileportal.org',
        },
        {
          domain: 'skynetfree.net',
          displayName: 'skynetfree.net',
        },
        {
          domain: 'skynetpro.net',
          displayName: 'skynetpro.net',
        },
      ];
      const result = getPortals();

      expect(result).toEqual(expected);
    });
  });
});
