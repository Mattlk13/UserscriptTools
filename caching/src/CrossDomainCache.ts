import { XdLocalStorage } from './cross-domain-local-storage/xdLocalStorage';

interface ExpiryingCacheItem<T> {
    Data: T;
    Expires?: Date;
}

export class CrossDomainCache {
    public static InitializeCache(iframeUrl: string) {
        CrossDomainCache.xdLocalStorageInitialized = new Promise((resolve, reject) => {
            XdLocalStorage.init({
                iframeUrl,
                initCallback: () => {
                    resolve();
                }
            });
        });
    }
    public static async GetAndCache<T>(cacheKey: string, getterPromise: () => Promise<T>, expiresAt?: Date): Promise<T> {
        const cachedItem = await this.GetFromCache<T>(cacheKey);
        if (cachedItem !== undefined) {
            return cachedItem;
        }

        const result = await getterPromise();
        this.StoreInCache(cacheKey, result, expiresAt);
        return result;
    }

    public static async ClearCache() {
        await CrossDomainCache.AwaitInitialization();
        XdLocalStorage.clear();
    }

    public static async GetFromCache<T>(cacheKey: string): Promise<T | undefined> {
        await CrossDomainCache.AwaitInitialization();
        return new Promise<T | undefined>((resolve, reject) => {
            XdLocalStorage.getItem<string>(cacheKey, data => {
                if (data.value === undefined) {
                    resolve();
                }
                const actualItem = JSON.parse(data.value) as ExpiryingCacheItem<T>;
                if (actualItem === null || actualItem.Expires && actualItem.Expires < new Date()) {
                    resolve();
                    return;
                }
                return resolve(actualItem.Data);
            });
        });
    }

    public static async StoreInCache<T>(cacheKey: string, item: T, expiresAt?: Date) {
        await CrossDomainCache.AwaitInitialization();
        const jsonStr = JSON.stringify({ Expires: expiresAt, Data: item });
        return new Promise((resolve, reject) => {
            XdLocalStorage.setItem(cacheKey, jsonStr, () => {
                resolve();
            });
        });
    }

    public static async Unset(cacheKey: string) {
        await CrossDomainCache.AwaitInitialization();
        return new Promise((resolve, reject) => {
            XdLocalStorage.removeItem(cacheKey, () => {
                resolve();
            });
        });
    }

    private static xdLocalStorageInitialized: Promise<void> | null;
    private static async AwaitInitialization() {
        if (CrossDomainCache.xdLocalStorageInitialized === null) {
            throw Error('Cache must be initialized before use');
        }
        await CrossDomainCache.xdLocalStorageInitialized;
    }
}
