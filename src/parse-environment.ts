export interface OAuth2Options {
  clientId: string | undefined;
  redirectUri: string | undefined;
}

export default function parseEnvironment(): OAuth2Options {
  const clientId: string | undefined = process.env.clientId;
  const redirectUri: string | undefined = process.env.redirectUri;
  if (!process.env.clientId) {
    throw new Error("Missing client ID in environment.");
  }

  if (!process.env.redirectUri) {
    throw new Error("Missing redirect URI in environment.");
  }

  return {
    clientId,
    redirectUri,
  };
}
