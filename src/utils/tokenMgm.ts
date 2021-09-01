export type TokenInfo = {
    token: string;
    expiresIn: number;
    updatedAt: number;
};

export const isTokenValid = (apiKey: string, tokenCache: Map<string, TokenInfo>) => {
    const tokenInfo = tokenCache.get(apiKey);
    if (!tokenInfo) {
        return false;
    }
    return Date.now() < tokenInfo.updatedAt + tokenInfo.expiresIn*1000;
};
