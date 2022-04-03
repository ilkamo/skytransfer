import '@testing-library/jest-dom/extend-expect';
import { getMySkyDomain, getPortals, Portal } from './portals';

const realLocation = window.location.href;

const setLocation = (location: string) => {
  // @ts-ignore
  delete window.location;
  // @ts-ignore
  window.location = new URL(location);
};

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

  describe('getMySkyDomain()', () => {
    test('returns dev mySky domain', () => {
      setLocation('http://localhost:3000');

      const expected = 'https://siasky.net';
      const result = getMySkyDomain();
      expect(result).toEqual(expected);

      setLocation(realLocation);
    });
  });

  describe('getMySkyDomain()_empty', () => {
    test('returns mySky domain', () => {
      setLocation('https://siasky.net');

      const expected = ''; // https://github.com/SkynetLabs/skynet-js/issues/89
      const result = getMySkyDomain();
      expect(result).toEqual(expected);

      setLocation(realLocation);
    });
  });
});
