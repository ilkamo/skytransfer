import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import {
    Portal,
    getCurrentPortal,
    setPortalWithDomain,
    getUploadEndpoint,
    getEndpointInDefaultPortal,
    getEndpointInCurrentPortal,
    getPortals
} from './portals';

describe('Portals', () => {
    describe('getCurrentPortal()', () => {
        test('returns default portal when localstorage empty', () => {
            const result = getCurrentPortal();
            const expected: Portal = {
                domain: 'skytransfer.hns.siasky.net',
                displayName: 'Siasky.net'
            }


            expect(result).toEqual(expected);
        });

        test('returns returns correct portal based on localstorage', () => {
            setPortalWithDomain('skydrain.net');
            const expected: Portal = {
                domain: 'skydrain.net',
                displayName: 'Skydrain.net'
            }

            const result = getCurrentPortal();


            expect(result).toEqual(expected);
        });
    });

    describe('getPortals()', () => {
        test('returns correct values', () => {
            const expected: Portal[] = [
                {
                    domain: 'skytransfer.hns.siasky.net',
                    displayName: 'Siasky.net'
                },
                {
                    domain: 'skytransfer.hns.skyportal.xyz',
                    displayName: 'SkyPortal.xyz'
                },
                {
                    domain: 'skydrain.net',
                    displayName: 'Skydrain.net'
                },
            ];
            const result = getPortals();


            expect(result).toEqual(expected);
        });
    });

    describe('getUploadEndpoint()', () => {
        test('returns endpoint based on current portal', () => {
            setPortalWithDomain('skytransfer.hns.skyportal.xyz');
            const expected = 'https://skytransfer.hns.skyportal.xyz/skynet/skyfile';
            const result = getUploadEndpoint();

            expect(result).toEqual(expected);
        });
    });

    describe('getEndpointInDefaultPortal()', () => {
        test('returns endpoint based on default portal', () => {
            setPortalWithDomain('skytransfer.hns.skyportal.xyz');
            const expected = 'https://skytransfer.hns.siasky.net';
            const result = getEndpointInDefaultPortal();

            expect(result).toEqual(expected);
        });
    });

    describe('getEndpointInCurrentPortal()', () => {
        test('returns endpoint based on default portal', () => {
            setPortalWithDomain('skytransfer.hns.skyportal.xyz');
            const expected = 'https://skytransfer.hns.skyportal.xyz';
            const result = getEndpointInCurrentPortal();

            expect(result).toEqual(expected);
        });
    });
});
