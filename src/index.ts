import { Adapter, Config, Contact, start } from "@clinq/bridge";
import axios from "axios";
import { Request } from "express";
import { stringify } from "querystring";
import parseEnvironment, { EnvConfig } from "./parse-environment";
import { mapToClinqContact } from "./utils/mapper";
import { VincereOAuthResponse } from "./vincere.model";

const anonymizeKey = (apiKey: string) =>
  `******${apiKey.substr(apiKey.length - 10)}`;

class VincereAdapter implements Adapter {
  public async getContacts(config: Config): Promise<Contact[]> {
    const envConfig = parseEnvironment();

    console.log(`Fetching contacts for ${anonymizeKey(envConfig.clientId)}`);

    const contacts: Contact[] = [];
    let startIndex: number = 0;
    const contactCount = await this.fetchContacts(
      config,
      contacts,
      startIndex,
      envConfig
    );
    // more than 100 contacts (=max data sclice sice for search endpoint of vincere) => repeat until fetched all, but max 10x times
    while (contacts.length < contactCount) {
      startIndex += 100;
      await this.fetchContacts(config, contacts, startIndex, envConfig);
    }
    console.log(
      `Successfully fetched ${contacts.length} contacts for ${anonymizeKey(
        envConfig.clientId
      )}`
    );
    return contacts;
  }

  private async fetchContacts(
    config: Config,
    contacts: Contact[],
    startIndex: number = 0,
    envConfig: EnvConfig
  ) {
    const headers = {
      "x-api-key": envConfig.clientId,
      "id-token": config.apiKey,
    };

    const vincereContactsResponse = await axios.get(
      envConfig.apiUrl +
        "/contact/search/fl=id,name,email,company,photo,phone,mobile;sort=created_date desc",
      {
        headers: {
          "x-api-key": envConfig.clientId,
          "id-token": config.apiKey,
        },
        params: {
          start: startIndex,
          limit: 100,
        },
      }
    );
    const contactCount: number = vincereContactsResponse.data.result.total;
    for (const vincereContact of vincereContactsResponse.data.result.items) {
      const clinqContact: Contact = mapToClinqContact(vincereContact);
      const vincereContactUrlResponse = await axios.get(
        envConfig.apiUrl +
          "contact/{id}/webapp/url".replace("{id}", clinqContact.id),
        {
          headers: {
            "x-api-key": envConfig.clientId,
            "id-token": config.apiKey,
          },
        }
      );
      clinqContact.contactUrl = vincereContactUrlResponse.data.url
        ? `${vincereContactUrlResponse.data.url}`
        : "";
      const vincereContactPhotoResponse = await axios.get(
        envConfig.apiUrl +
          "/contact/{id}/photo".replace("{id}", clinqContact.id),
        {
          headers: {
            "x-api-key": envConfig.clientId,
            "id-token": config.apiKey,
          },
        }
      );
      if (vincereContactPhotoResponse.data.filename) {
        clinqContact.avatarUrl = vincereContactPhotoResponse.data.url
          ? `${vincereContactPhotoResponse.data.url}`
          : "";
      }
      contacts.push(clinqContact);
    }

    console.log(
      `Fetched contacts (${contacts.length}/${contactCount}) for ${anonymizeKey(
        envConfig.clientId
      )}`
    );

    return contactCount;
  }

  /**
   * REQUIRED FOR OAUTH2 FLOW
   * Return the redirect URL for the given contacts provider.
   * Users will be redirected here to authorize CLINQ.
   */
  public async getOAuth2RedirectUrl(): Promise<string> {
    const envConfig = parseEnvironment();
    const query = {
      response_type: "code",
      client_id: envConfig.clientId,
      redirect_uri: "http://localhost:8080/oauth2/callback",
      state: "",
    };
    return `https://id.vincere.io/oauth2/authorize?${stringify(query)}`;
  }

  /**
   * REQUIRED FOR OAUTH2 FLOW
   * Users will be redirected here after authorizing CLINQ.
   *
   * TODO: Extract the 'code' from request, fetch an access token
   * and return it as 'apiKey'
   */
  public async handleOAuth2Callback(
    req: Request
  ): Promise<{ apiKey: string; apiUrl: string }> {
    const envConfig = parseEnvironment();

    const requestParams = stringify({
      grant_type: "authorization_code",
      code: req.query.code?.toString(),
      client_id: envConfig.clientId,
    });

    const data = await axios.post<VincereOAuthResponse>(
      "https://id.vincere.io/oauth2/token",
      requestParams,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return Promise.resolve({
      apiKey: data.data.id_token,
      apiUrl: envConfig.apiUrl,
    });
  }
}

start(new VincereAdapter());
