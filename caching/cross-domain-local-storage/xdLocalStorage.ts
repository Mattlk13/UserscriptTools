/**
 * xdLocalStorage is a port of https://github.com/ofirdagan/cross-domain-local-storage to typescript using modules
 */
/**
 * Created by dagan on 07/04/2014.
 */

export interface XdLocalStorageOptions {
    iframeId: string;
    iframeUrl: string;
    initCallback: () => void;
}

export type xdLocationStorageAction = 'set' | 'get' | 'remove' | 'key' | 'size' | 'index' | 'length' | 'clear';

interface XdLocationStorageItem {
    namespace: string;
    id: number;
    action: xdLocationStorageAction;
    key: string | number | null;
    value: any;
}

export class XdLocalStorage {
    public static init(customOptions: Partial<XdLocalStorageOptions>) {
        if (!customOptions.iframeUrl) {
            throw Error('You must specify iframeUrl');
        }
        const validatedOptions = {
            iframeId: customOptions.iframeId,
            iframeUrl: customOptions.iframeUrl,
            initCallback: customOptions.initCallback
        };
        if (XdLocalStorage.wasInitFlag) {
            return;
        }
        XdLocalStorage.wasInitFlag = true;
        if (XdLocalStorage.isDomReady()) {
            XdLocalStorage.internalInit(validatedOptions);
        } else {
            if (document.addEventListener) {
                // All browsers expect IE < 9
                document.addEventListener('readystatechange', () => {
                    if (XdLocalStorage.isDomReady()) {
                        XdLocalStorage.internalInit(validatedOptions);
                    }
                });
            } else {
                // IE < 9
                (document as any).attachEvent('readystatechange', () => {
                    if (XdLocalStorage.isDomReady()) {
                        XdLocalStorage.internalInit(validatedOptions);
                    }
                });
            }
        }
    }

    public static setItem(key: string, value: any, callback?: (data: { success: boolean }) => void) {
        if (!XdLocalStorage.isApiReady()) {
            return;
        }
        XdLocalStorage.buildMessage('set', key, value, callback);
    }
    public static getItem<T>(key: string, callback?: (data: { key: string, value: T }) => void) {
        if (!XdLocalStorage.isApiReady()) {
            return;
        }
        XdLocalStorage.buildMessage('get', key, null, callback);
    }

    public static removeItem<T>(key: string, callback?: (data: never) => void) {
        if (!XdLocalStorage.isApiReady()) {
            return;
        }
        XdLocalStorage.buildMessage('remove', key, null, callback);
    }

    public static key(index: number, callback?: (data: { key: string }) => void) {
        if (!XdLocalStorage.isApiReady()) {
            return;
        }
        XdLocalStorage.buildMessage('key', index, null, callback);
    }

    public static getSize(callback?: (data: { size: number }) => void) {
        if (!XdLocalStorage.isApiReady()) {
            return;
        }
        XdLocalStorage.buildMessage('size', null, null, callback);
    }

    public static getLength(callback?: (data: { length: number }) => void) {
        if (!XdLocalStorage.isApiReady()) {
            return;
        }
        XdLocalStorage.buildMessage('length', null, null, callback);
    }
    public static clear(callback?: (data: never) => void) {
        if (!XdLocalStorage.isApiReady()) {
            return;
        }
        XdLocalStorage.buildMessage('clear', null, null, callback);
    }

    public static wasInit() {
        return XdLocalStorage.wasInitFlag;
    }

    private static MESSAGE_NAMESPACE = 'cross-domain-local-message';
    private static defaultOptions = {
        iframeId: 'cross-domain-iframe',
        // tslint:disable-next-line:no-empty
        initCallback: () => { }
    };
    private static options: XdLocalStorageOptions;
    private static requestId = 1;
    private static iframe: HTMLIFrameElement;
    private static requests: any = {};
    private static wasInitFlag = false;
    private static iframeReady = true;

    private static applyCallback(data: any) {
        if (XdLocalStorage.requests[data.id]) {
            XdLocalStorage.requests[data.id](data);
            delete XdLocalStorage.requests[data.id];
        }
    }

    private static receiveMessage(event: { data: string }) {
        let data;
        try {
            data = JSON.parse(event.data);
        } catch (err) {
            // not our message, can ignore
        }
        if (data && data.namespace === XdLocalStorage.MESSAGE_NAMESPACE) {
            if (data.id === 'iframe-ready') {
                XdLocalStorage.iframeReady = true;
                XdLocalStorage.options.initCallback();
            } else {
                XdLocalStorage.applyCallback(data);
            }
        }
    }

    private static buildMessage(action: xdLocationStorageAction, key: string | number | null, value: any, callback: any) {
        XdLocalStorage.requestId++;
        XdLocalStorage.requests[XdLocalStorage.requestId] = callback;
        const data: XdLocationStorageItem = {
            namespace: XdLocalStorage.MESSAGE_NAMESPACE,
            id: XdLocalStorage.requestId,
            action,
            key,
            value
        };
        XdLocalStorage.iframe.contentWindow.postMessage(JSON.stringify(data), '*');
    }

    private static internalInit(customOptions: Partial<XdLocalStorageOptions> & { iframeUrl: string }) {
        XdLocalStorage.options = { ...XdLocalStorage.defaultOptions, ...customOptions };
        const temp = document.createElement('div');

        if (window.addEventListener) {
            window.addEventListener('message', XdLocalStorage.receiveMessage, false);
        } else {
            (window as any).attachEvent('onmessage', XdLocalStorage.receiveMessage);
        }

        temp.innerHTML = '<iframe id="' + XdLocalStorage.options.iframeId + '" src=' + XdLocalStorage.options.iframeUrl + ' style="display: none;"></iframe>';
        document.body.appendChild(temp);
        const element = document.getElementById(XdLocalStorage.options.iframeId) as HTMLIFrameElement;
        if (element) {
            XdLocalStorage.iframe = element;
        }
    }

    private static isApiReady() {
        if (!XdLocalStorage.wasInitFlag) {
            return false;
        }
        if (!XdLocalStorage.iframeReady) {
            return false;
        }
        return true;
    }

    private static isDomReady() {
        return (document.readyState === 'complete');
    }
}
