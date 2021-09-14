export type EnvConfig = {
  redirectUrl: string;
};

const { REDIRECT_URL } = process.env;

interface IClientId {
  user: string;
  organization: string;
  clientId: string;
}

export function getClientId(user: string, organization: string) : IClientId | null {
  const clientIds  = JSON.parse(process.env.clientIds || "[]") as IClientId[];
  return clientIds.find(c => c.user === user && c.organization === organization) || null;
}

export default function parseEnvironment(): EnvConfig {
  if (!REDIRECT_URL) {
    throw new Error("Missing clientId in environment.");
  }
  return {
    redirectUrl: REDIRECT_URL
  };
}
