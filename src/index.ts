import {
  Adapter,
  Config,
  Contact,
  PhoneNumber,
  PhoneNumberLabel,
  start,
} from "@clinq/bridge";
import { Request } from "express";
import { VincereOAuthResponse } from "./vincere.model";
import { stringify } from "querystring";
import parseEnvironment from "./parse-environment";
import axios, { AxiosInstance } from "axios";

import { mapToClinqContact } from "./utils/mapper";

class VincereAdapter implements Adapter {
  public async getContacts(config: Config): Promise<Contact[]> {
    const contacts: Contact[] = [];
    let startIndex: number = 0;
    const contactCount = await this.fetchContacts(config, contacts, startIndex);
    // more than 100 contacts (=max data sclice sice for search endpoint of vincere) => repeat until fetched all, but max 10x times
    while (contacts.length < contactCount && startIndex < 1000) {
      startIndex += 100;
      await this.fetchContacts(config, contacts, startIndex);
    }
    return contacts;
  }

  private async fetchContacts(
    config: Config,
    contacts: Contact[],
    startIndex: number = 0
  ) {
    const { clientId, apiUrl, clientSecret } = parseEnvironment();
    const vincereContactsResponse = await axios.get(
      config.apiUrl +
        "/contact/search/fl=id,name,email,company,photo,phone,mobile;sort=created_date desc",
      {
        headers: {
          "x-api-key": clientId,
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
        config.apiUrl +
          "contact/{id}/webapp/url".replace("{id}", clinqContact.id),
        {
          headers: {
            "x-api-key": clientId,
            "id-token": config.apiKey,
          },
        }
      );
      clinqContact.contactUrl = vincereContactUrlResponse.data.url;
      const vincereContactPhotoResponse = await axios.get(
        config.apiUrl + "/contact/{id}/photo".replace("{id}", clinqContact.id),
        {
          headers: {
            "x-api-key": clientId,
            "id-token": config.apiKey,
          },
        }
      );
      if (vincereContactPhotoResponse.data.filename) {
        clinqContact.avatarUrl = vincereContactPhotoResponse.data.url;
      }
      contacts.push(clinqContact);
    }
    return contactCount;
  }

  /**
   * REQUIRED FOR OAUTH2 FLOW
   * Return the redirect URL for the given contacts provider.
   * Users will be redirected here to authorize CLINQ.
   */
  public async getOAuth2RedirectUrl(): Promise<string> {
    const { clientId, apiUrl, clientSecret } = parseEnvironment();
    const query = {
      response_type: "code",
      client_id: clientId,
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
    const { clientId, apiUrl, clientSecret } = parseEnvironment();

    const requestParams = stringify({
      grant_type: "authorization_code",
      code: req.query.code?.toString(),
      client_id: clientId,
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
      apiUrl: apiUrl!,
    });
  }
}

start(new VincereAdapter());
