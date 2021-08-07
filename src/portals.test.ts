import '@testing-library/jest-dom/extend-expect';
import {
  Portal,
  getCurrentPortal,
  setPortalWithDomain,
  getUploadEndpoint,
  getEndpointInDefaultPortal,
  getEndpointInCurrentPortal,
  getPortals,
  getMySkyDomain,
} from './portals';

const realLocation = window.location.href;

const setLocation = (location: string) => {
  // @ts-ignore
  delete window.location;
  // @ts-ignore
  window.location = new URL(location);
};

describe('Portals', () => {
  describe('getCurrentPortal()', () => {
    test('returns default portal when localstorage empty', () => {
      const result = getCurrentPortal();
      const expected: Portal = {
        domain: 'siasky.net',
        displayName: 'Siasky.net',
      };

      expect(result).toEqual(expected);
    });

    test('returns returns correct portal based on localstorage', () => {
      setPortalWithDomain('skydrain.net');
      const expected: Portal = {
        domain: 'skydrain.net',
        displayName: 'Skydrain.net',
      };

      const result = getCurrentPortal();

      expect(result).toEqual(expected);
    });
  });

  describe('getPortals()', () => {
    test('returns correct values', () => {
      const expected: Portal[] = [
        {
          domain: 'siasky.net',
          displayName: 'Siasky.net',
        },
        {
          domain: 'skyportal.xyz',
          displayName: 'SkyPortal.xyz',
        },
        {
          domain: 'skydrain.net',
          displayName: 'Skydrain.net',
        },
        {
          domain: 'siasky.dev',
          displayName: 'Siasky.dev',
        },
      ];
      const result = getPortals();

      expect(result).toEqual(expected);
    });
  });

  describe('getUploadEndpoint()', () => {
    test('returns endpoint based on current portal', () => {
      setPortalWithDomain('skyportal.xyz');
      const expected = 'https://skyportal.xyz/skynet/skyfile';
      const result = getUploadEndpoint();

      expect(result).toEqual(expected);
    });
  });

  describe('getEndpointInDefaultPortal()', () => {
    test('returns endpoint based on default portal', () => {
      setPortalWithDomain('skyportal.xyz');
      const expected = 'https://siasky.net';
      const result = getEndpointInDefaultPortal();

      expect(result).toEqual(expected);
    });
  });

  describe('getEndpointInCurrentPortal()', () => {
    test('returns endpoint based on default portal', () => {
      setPortalWithDomain('skyportal.xyz');
      const expected = 'https://skyportal.xyz';
      const result = getEndpointInCurrentPortal();

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

  describe('getMySkyDomain()', () => {
    test('returns mySky domain', () => {
      setLocation('https://siasky.net');

      const expected = ''; // https://github.com/SkynetLabs/skynet-js/issues/89
      const result = getMySkyDomain();
      expect(result).toEqual(expected);

      setLocation(realLocation);
    });
  });
});
