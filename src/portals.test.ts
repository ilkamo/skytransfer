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
        displayName: 'siasky.net',
      };

      expect(result).toEqual(expected);
    });

    test('returns returns correct portal based on localstorage', () => {
      setPortalWithDomain('fileportal.org');
      const expected: Portal = {
        domain: 'fileportal.org',
        displayName: 'fileportal.org',
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

  describe('getUploadEndpoint()', () => {
    test('returns endpoint based on current portal', () => {
      setPortalWithDomain('fileportal.org');
      const expected = 'https://fileportal.org/skynet/skyfile';
      const result = getUploadEndpoint();

      expect(result).toEqual(expected);
    });
  });

  describe('getEndpointInDefaultPortal()', () => {
    test('returns endpoint based on default portal', () => {
      setPortalWithDomain('fileportal.org');
      const expected = 'https://siasky.net';
      const result = getEndpointInDefaultPortal();

      expect(result).toEqual(expected);
    });
  });

  describe('getEndpointInCurrentPortal()', () => {
    test('returns endpoint based on default portal', () => {
      setPortalWithDomain('fileportal.org');
      const expected = 'https://fileportal.org';
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
