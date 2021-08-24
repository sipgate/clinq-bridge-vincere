export const anonymizeKey = (apiKey: string) => `******${apiKey.substr(apiKey.length - 10)}`;

export const infoLogger = (apiKey : string, message: string, ...args: any[]) => {
    // tslint:disable-next-line:no-console
    console.log(`${anonymizeKey(apiKey)}: ${message}`, args && args.length ? args : "");
};

export const errorLogger = (apiKey : string, message: string, ...args: any[]) => {
    // tslint:disable-next-line:no-console
    console.error(`${anonymizeKey(apiKey)}: ${message}`, args && args.length ? args : "");
};

export const warnLogger = (apiKey : string, message: string, ...args: any[]) => {
    // tslint:disable-next-line:no-console
    console.warn(`${anonymizeKey(apiKey)}: ${message}`, args && args.length ? args : "");
};
