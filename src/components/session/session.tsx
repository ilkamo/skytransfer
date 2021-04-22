import { useRef } from 'react';
import { SkynetClient } from 'skynet-js';

const useConstructor = (callBack = () => { }) => {
    const hasBeenCalled = useRef(false);
    if (hasBeenCalled.current) return;
    callBack();
    hasBeenCalled.current = true;
};

const Session = () => {
    const initSession = async () => {
        console.log("init session");

        const client = new SkynetClient();
        const dataDomain = 'skytransfer.hns';

        try {
            const mySky = await client.loadMySky(dataDomain);
            const loggedIn = await mySky.checkLogin();
            if (!loggedIn) {
                const status = await mySky.requestLoginAccess();
                console.log(status);
            }

            console.log(await mySky.userID());
            console.log(await mySky.setJSON("skytransfer.hns/test.json", { test: "hello test" }));
            console.log(await mySky.getJSON("skytransfer.hns/test.json"));
        } catch (e) {
            console.error(e);
        }
    };

    useConstructor(() => {
        initSession();
    });

    return (
        <div></div>
    );
};

export default Session;