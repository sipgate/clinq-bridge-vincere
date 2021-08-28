import { Adapter, Config, Contact, start } from "@clinq/bridge";
import axios from "axios";
import { Request } from "express";
import { stringify } from "querystring";
import parseEnvironment, { EnvConfig } from "./parse-environment";
import {mapVincereCandidateToClinqContact, mapVincereContactToClinqContact} from "./utils/mapper";
import { VincereOAuthResponse } from "./vincere.model";
import {infoLogger} from "./utils/logger";
import {TokenInfo, isTokenValid} from "./utils/tokenMgm";


class VincereAdapter implements Adapter {

  private tokenCache:Map<string, TokenInfo> = new Map<string, TokenInfo>();
  private envConfig: EnvConfig = parseEnvironment();

  public async getContacts(config: Config): Promise<Contact[]> {
    infoLogger(this.envConfig.clientId, `Fetching vincere candidates and contacts and converting them to clinq contacts`);
    const candidates: Contact[] = await this.fetchAllVincereCandidates(config);
    const contacts: Contact[] = await this.fetchAllVincereContacts(config);
    infoLogger(this.envConfig.clientId, `Successfully fetched ${candidates.length + contacts.length} ' + 
    'vincere contacts: ${candidates.length} vincere candidates and ${contacts.length} vincere contacts`);
    return [...candidates, ...contacts];
  }

  private async fetchAllVincereContacts(config: Config): Promise<Contact[]> {
    const contacts: Contact[] = [];
    let startIndex: number = 0;
    const contactCount = await this.fetchContacts(
        config,
        contacts,
        startIndex
    );
    // more than 100 contacts (=max data sclice sice for search endpoint of vincere) => repeat until fetched all
    while (contacts.length < contactCount) {
      startIndex += 100;
      await this.fetchContacts(config, contacts, startIndex);
    }
    infoLogger(this.envConfig.clientId, `Successfully fetched ${contacts.length} vincere contacts`);
    return contacts;
  }

  private async fetchAllVincereCandidates(config: Config): Promise<Contact[]>{
    const candidates: Contact[] = [];
    let startIndex: number = 0;
    const candidateCount = await this.fetchCandidates(
        config,
        candidates,
        startIndex
    );
    // more than 100 contacts (=max data sclice sice for search endpoint of vincere) => repeat until fetched all
    while (candidates.length < candidateCount) {
      startIndex += 100;
      await this.fetchCandidates(config, candidates, startIndex);
    }
    infoLogger(this.envConfig.clientId, `Successfully fetched ${candidates.length} vincere candidates`);
    return candidates;
  }

  private async fetchContacts(
    config: Config,
    contacts: Contact[],
    startIndex: number = 0
  ) {
    const headers = await this.getFreshApiKey(config);
    const vincereContactsResponse = await axios.get(
      this.envConfig.apiUrl +
        "/contact/search/fl=id,name,email,company,phone,mobile;sort=created_date desc",
      {
        headers,
        params: {
          start: startIndex,
          limit: 100,
        },
      }
    );
    const contactCount: number = vincereContactsResponse.data.result.total;
    for (const vincereContact of vincereContactsResponse.data.result.items) {
      const clinqContact: Contact = mapVincereContactToClinqContact(vincereContact);
      const vincereContactUrlResponse = await axios.get(
        this.envConfig.apiUrl +
          "/contact/{id}/webapp/url".replace("{id}", clinqContact.id),{headers}
      );
      clinqContact.contactUrl = vincereContactUrlResponse.data.url;
      const vincereContactPhotoResponse = await axios.get(
        this.envConfig.apiUrl +
          "/contact/{id}/photo".replace("{id}", clinqContact.id), {headers}
      );
      if (vincereContactPhotoResponse.data.file_name) {
        clinqContact.avatarUrl = vincereContactPhotoResponse.data.url;
      }
      contacts.push(clinqContact);
    }
    infoLogger(this.envConfig.clientId, `Fetched contacts (${contacts.length}/${contactCount})`);
    return contactCount;
  }

  private async fetchCandidates(
      config: Config,
      contacts: Contact[],
      startIndex: number = 0
  ) {

    const headers = await this.getFreshApiKey(config);
    const vincereCandidateResponse = await axios.get(
        this.envConfig.apiUrl +
        "/candidate/search/fl=id,name,primary_email,phone,mobile;sort=created_date desc",
        {
          headers,
          params: {
            start: startIndex,
            limit: 100,
          },
        }
    );
    const candidateCount: number = vincereCandidateResponse.data.result.total;
    for (const vincereCandidate of vincereCandidateResponse.data.result.items) {
      const clinqContact: Contact = mapVincereCandidateToClinqContact(vincereCandidate);
      const vincereCandidateUrlResponse = await axios.get(
          this.envConfig.apiUrl +
          "/candidate/{id}/webapp/url".replace("{id}", clinqContact.id),{headers}
      );
      clinqContact.contactUrl = vincereCandidateUrlResponse.data.url;
      const vincereCandidateDetailsResponse = await axios.get(
          this.envConfig.apiUrl +
          "/candidate/{id}/".replace("{id}", clinqContact.id),{headers}
      );
      clinqContact.avatarUrl = vincereCandidateDetailsResponse.data.photo_url;
      contacts.push(clinqContact);
    }

    infoLogger(this.envConfig.clientId, `Fetched candidates (${contacts.length}/${candidateCount})`);

    return candidateCount;
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

    const requestParams = stringify({
      grant_type: "authorization_code",
      code: req.query.code?.toString(),
      client_id: this.envConfig.clientId,
    });

    const oauthResponse = await axios.post<VincereOAuthResponse>(
      "https://id.vincere.io/oauth2/token",
      requestParams,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    const apiKey: string = `${oauthResponse.data.id_token}:${oauthResponse.data.refresh_token}`;
    this.tokenCache.set(apiKey, {
      token: oauthResponse.data.id_token,
      expiresIn: oauthResponse.data.expires_in,
      updatedAt: Date.now()
    });
    return Promise.resolve({
      apiKey,
      apiUrl: this.envConfig.apiUrl,
    });
  }

  private async getFreshApiKey(config: Config) {
    const [idToken, refreshToken] = config.apiKey.split(":");
    if (!isTokenValid(config.apiKey, this.tokenCache)) {
      infoLogger(idToken, `Refreshing api access token`);
      const requestParams = stringify({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: this.envConfig.clientId,
      });
      const oauthResponse = await axios.post<VincereOAuthResponse>(
          "https://id.vincere.io/oauth2/token",
          requestParams,
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
      );
      this.tokenCache.set(config.apiKey, {
        token: oauthResponse.data.id_token,
        expiresIn: oauthResponse.data.expires_in,
        updatedAt: Date.now()
      });
      return {
        "x-api-key": this.envConfig.clientId,
        "id-token": oauthResponse.data.id_token
      };
    }
    else {
      infoLogger(idToken, `Api access token is fresh enough`);
      return {
        "x-api-key": this.envConfig.clientId,
        "id-token": this.tokenCache.get(config.apiKey)?.token
      };
    }
  }
}

start(new VincereAdapter());
