export type TokenInfo = {
    token: string;
    expiresIn: number;
    updatedAt: number;
};

export type UserConfig = {
    apiKey: string;
    clientId: string;
    refreshToken: string;
    idToken: string;
}

export const isTokenValid = (apiKey: string, tokenCache: Map<string, TokenInfo>) => {
    const tokenInfo = tokenCache.get(apiKey);
    if (!tokenInfo) {
        return false;
    }
    return Date.now() < tokenInfo.updatedAt + tokenInfo.expiresIn*1000;
};

export const getUserConfig = (apiKey: string) => {
    return {
        apiKey: apiKey.split(':')[0],
        clientId : apiKey.split(':')[1],
        refreshToken: apiKey.split(':')[2],
        idToken: apiKey.split(':')[3]
    }
}
