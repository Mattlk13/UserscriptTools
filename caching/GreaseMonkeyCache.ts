export class GreaseMonkeyCache {
    public static async GetAndCache<T>(cacheKey: string, getterPromise: () => Promise<T>, expiresAt?: Date): Promise<T> {
        return getterPromise();
    }

    // tslint:disable-next-line:no-empty
    public static ClearExpiredKeys(regexes?: RegExp[]) {
    }

    // tslint:disable-next-line:no-empty
    public static ClearAll(regexes: RegExp[], condition?: (item: string | null) => boolean) {
    }

    public static GetFromCache<T>(cacheKey: string): T | undefined {
        return undefined;
    }

    // tslint:disable-next-line:no-empty
    public static StoreInCache<T>(cacheKey: string, item: T, expiresAt?: Date) {
    }

    // tslint:disable-next-line:no-empty
    public static Unset(cacheKey: string) {
    }
}
