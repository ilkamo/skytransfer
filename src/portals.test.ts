import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { Portal, Portals } from './portals';

const setWindowLocation = (url: string) => {
    delete global.window.location;
    global.window = Object.create(window);
    // @ts-ignore
    global.window.location = new URL(url);
};

describe('Portals', () => {
    describe('current()', () => {
        test('returns correct values for unknown portal', () => {
            setWindowLocation('https://skytransfer.hns.some-portal-name');
            const result = Portals.current();
            const expected: Portal = {
                domain: 'some-portal-name',
                displayName: 'Some-Portal-Name'
            }


            expect(result).toEqual(expected);
        });

        test('returns correct values for known portal', () => {
            setWindowLocation('https://skytransfer.hns.siasky.net');
            const result = Portals.current();
            const expected: Portal = {
                domain: 'siasky.net',
                displayName: 'Siasky.net'
            }


            expect(result).toEqual(expected);
        });
    });

    describe('alternatives()', () => {
        test('returns correct values for unknown portal', () => {
            setWindowLocation('https://skytransfer.hns.some-portal-name');
            const result = Portals.alternatives();
            const expected: Portal[] = [
                {
                    domain:'siasky.net',
                    displayName:'Siasky.net'
                },
                {
                    domain: 'skyportal.xyz',
                    displayName: 'SkyPortal.xyz'
                },
            ];


            expect(result).toEqual(expected);
        });

        test('returns correct values for known portal', () => {
            setWindowLocation('https://skytransfer.hns.skyportal.xyz');
            const result = Portals.alternatives();
            const expected: Portal[] = [
                {
                    domain:'siasky.net',
                    displayName:'Siasky.net'
                },
            ];


            expect(result).toEqual(expected);
        });
    });

    describe('getUploadEndpoint()', () => {
        test('returns default upload endpoint for localhost', () => {
            setWindowLocation('http://localhost:3000/');
            const result = Portals.getUploadEndpoint();
            const expected = 'https://skytransfer.hns.siasky.net/skynet/skyfile';


            expect(result).toEqual(expected);
        });

        test('returns correct upload endpoint', () => {
            setWindowLocation('https://skytransfer.hns.skyportal.xyz');
            const result = Portals.getUploadEndpoint();
            const expected = 'https://skytransfer.hns.skyportal.xyz/skynet/skyfile';


            expect(result).toEqual(expected);
        });
    });

    describe('getEndpoint()', () => {
        test('returns correct value for localhost', () => {
            setWindowLocation('http://localhost:3000/');
            const result = Portals.getEndpoint();
            const expected = 'https://skytransfer.hns.siasky.net';


            expect(result).toEqual(expected);
        });

        test('returns correct value', () => {
            setWindowLocation('https://skytransfer.hns.skyportal.xyz');
            const result = Portals.getEndpoint();
            const expected = 'https://skytransfer.hns.skyportal.xyz';


            expect(result).toEqual(expected);
        });
    });

    describe('getEndpointInPortal()', () => {
        test('returns correct value for localhost', () => {
            setWindowLocation('http://localhost:3000/');
            const portal: Portal = {
                domain: 'SOME_PORTAL_DOMAIN',
                displayName: 'SOME_PORTAL_DISPLAY_NAME',
            };
            const result = Portals.getEndpointInPortal(portal);
            const expected = 'https://skytransfer.hns.SOME_PORTAL_DOMAIN';


            expect(result).toEqual(expected);
        });

        test('returns correct value', () => {
            setWindowLocation('https://skytransfer.hns.skyportal.xyz');
            const portal: Portal = {
                domain: 'SOME_PORTAL_DOMAIN',
                displayName: 'SOME_PORTAL_DISPLAY_NAME',
            };
            const result = Portals.getEndpointInPortal(portal);
            const expected = 'https://skytransfer.hns.SOME_PORTAL_DOMAIN';


            expect(result).toEqual(expected);
        });
    });
});
