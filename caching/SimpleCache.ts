interface ExpiryingCacheItem<T> {
    Data: T;
    Expires?: Date;
}

export class SimpleCache {
    public static async GetAndCache<T>(cacheKey: string, getterPromise: () => Promise<T>, expiresAt?: Date): Promise<T> {
        const cachedItem = SimpleCache.GetFromCache<T>(cacheKey);
        if (cachedItem !== undefined) {
            return cachedItem;
        }

        const result = await getterPromise();
        SimpleCache.StoreInCache(cacheKey, result, expiresAt);
        return result;
    }

    public static ClearCache() {
        localStorage.clear();
    }

    public static ClearExpiredKeys(regexes?: RegExp[]) {
        const len = localStorage.length;
        for (let i = len - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key) {
                if (!regexes || regexes.filter(r => key.match(r)).length > 0) {
                    const jsonItem = localStorage.getItem(key);
                    if (jsonItem) {
                        try {
                            const dataItem = JSON.parse(jsonItem) as ExpiryingCacheItem<any>;
                            if ((dataItem.Expires && new Date(dataItem.Expires) < new Date())) {
                                localStorage.removeItem(key);
                            }
                        } catch {
                            // Don't care
                        }
                    }
                }
            }
        }
    }

    public static ClearAll(regexes: RegExp[], condition?: (item: string | null) => boolean) {
        const len = localStorage.length;
        for (let i = len - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key) {
                if (regexes.filter(r => key.match(r)).length > 0) {
                    if (condition) {
                        const val = localStorage.getItem(key);
                        if (condition(val)) {
                            localStorage.removeItem(key);
                        }
                    } else {
                        localStorage.removeItem(key);
                    }
                }
            }
        }
    }

    public static GetFromCache<T>(cacheKey: string): T | undefined {
        const jsonItem = localStorage.getItem(cacheKey);
        if (!jsonItem) {
            return undefined;
        }
        const dataItem = JSON.parse(jsonItem) as ExpiryingCacheItem<T>;
        if ((dataItem.Expires && new Date(dataItem.Expires) < new Date())) {
            return undefined;
        }
        return dataItem.Data;
    }

    public static StoreInCache<T>(cacheKey: string, item: T, expiresAt?: Date) {
        const jsonStr = JSON.stringify({ Expires: expiresAt, Data: item });
        localStorage.setItem(cacheKey, jsonStr);
    }

    public static Unset(cacheKey: string) {
        localStorage.removeItem(cacheKey);
    }
}
