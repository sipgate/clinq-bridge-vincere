import { Adapter, Config, Contact, start, CallEvent, CallDirection, OAuthURLConfig } from "@clinq/bridge";
import axios from "axios";
import { Request } from "express";
import { stringify } from "querystring";
import parseEnvironment, { EnvConfig } from "./parse-environment";
import {
  mapCallEventToDescription,
  mapVincereCandidateToClinqContact,
  mapVincereContactToClinqContact
} from "./utils/mapper";
import {infoLogger} from "./utils/logger";
import {TokenInfo, isTokenValid} from "./utils/tokenMgm";
import * as moment from 'moment';

class VincereAdapter implements Adapter {

  private tokenCache:Map<string, TokenInfo> = new Map<string, TokenInfo>();
  private envConfig: EnvConfig = parseEnvironment();

  public async handleCallEvent(config: Config, event: CallEvent): Promise<void> {
    infoLogger(this.envConfig.clientId, `Processing call event`);
    const phoneNumber = event.direction === CallDirection.OUT ? event.to : event.from;
    // first check if number is from contacts
    let vincereResponse = await axios.get(
        this.envConfig.apiUrl + `/contact/search/fl=id;?q=phone:${phoneNumber}%23`,
        {headers: await this.getFreshToken(config)}
    );
    if (vincereResponse.data.result.total > 0){
      infoLogger(this.envConfig.clientId, "Found vincere contact, creating comment in vincere")
      const commentData = {
        contact_ids:[vincereResponse.data.result.items[0].id],
        category_ids:[4], // category id 4 = "Phone Call "
        content: mapCallEventToDescription(event),
        insert_timestamp: (moment.utc(new Date(event.start))).format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
        kpi_action_id: "5", // kpi_action_id 5 = "Client BD Phone Call", https://api.vincere.io/#operation/getActivityCategories
        main_entity_type: "CONTACT"
      }
      await axios.post(this.envConfig.apiUrl + `/activity/comment`, commentData, {headers: await this.getFreshToken(config)});
    }
    else {
      // number is not from contacts -> check candidates
      vincereResponse = await axios.get(
          this.envConfig.apiUrl + `/candidate/search/fl=id;?q=phone:${phoneNumber}%23`,
          {headers: await this.getFreshToken(config)}
      );
      if (vincereResponse.data.result.total > 0){
        infoLogger(this.envConfig.clientId, "Found vincere candidate, creating comment in vincere")
        const commentData = {
          candidate_ids:[vincereResponse.data.result.items[0].id],
          category_ids:[4], // category id 4 = "Phone Call "
          content: mapCallEventToDescription(event),
          insert_timestamp: (moment.utc(new Date(event.start))).format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
          kpi_action_id: "60", // kpi_action_id 60 = "Candidate Meeting", https://api.vincere.io/#operation/getActivityCategories
          main_entity_type: "CANDIDATE"
        }
        await axios.post(this.envConfig.apiUrl + `/activity/comment`, commentData, {headers: await this.getFreshToken(config)});
      }
      else {
        infoLogger(this.envConfig.clientId, "Found no vincere candidate nor contact for given phone number, doing nothing")
      }
    }
  }

  public async getContacts(config: Config): Promise<Contact[]> {
    infoLogger(this.envConfig.clientId, `Fetching vincere candidates and contacts and converting them to clinq contacts`);
    const candidates: Contact[] = await this.fetchAllVincereCandidates(config);
    const contacts: Contact[] = await this.fetchAllVincereContacts(config);
    infoLogger(this.envConfig.clientId, `Successfully fetched ${candidates.length + contacts.length} ` +
        `entries: ${candidates.length} vincere candidates and ${contacts.length} vincere contacts`);
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
    const vincereContactsResponse = await axios.get(
      this.envConfig.apiUrl +
        "/contact/search/fl=id,name,email,company,phone,mobile;sort=created_date desc",
      {
        headers: await this.getFreshToken(config),
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
          "/contact/{id}/webapp/url".replace("{id}", clinqContact.id),{headers: await this.getFreshToken(config)}
      );
      clinqContact.contactUrl = vincereContactUrlResponse.data.url;
      const vincereContactPhotoResponse = await axios.get(
        this.envConfig.apiUrl +
          "/contact/{id}/photo".replace("{id}", clinqContact.id), {headers: await this.getFreshToken(config),}
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
    const vincereCandidateResponse = await axios.get(
        this.envConfig.apiUrl +
        "/candidate/search/fl=id,name,primary_email,phone,mobile;sort=created_date desc",
        {
          headers: await this.getFreshToken(config),
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
          "/candidate/{id}/webapp/url".replace("{id}", clinqContact.id),{headers: await this.getFreshToken(config)}
      );
      clinqContact.contactUrl = vincereCandidateUrlResponse.data.url;
      const vincereCandidateDetailsResponse = await axios.get(
          this.envConfig.apiUrl +
          "/candidate/{id}/".replace("{id}", clinqContact.id),{headers: await this.getFreshToken(config),}
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
  public async getOAuth2RedirectUrl(config?: OAuthURLConfig): Promise<string> {
    const envConfig = parseEnvironment();
    // TODO: Resolve correct Vincere config based on OAuthUrlConfig
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

    const oauthResponse = await axios.post("https://id.vincere.io/oauth2/token",requestParams);
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

  private async getFreshToken(config: Config) {
    const [idToken, refreshToken] = config.apiKey.split(":");
    if (!isTokenValid(config.apiKey, this.tokenCache)) {
      infoLogger(idToken, `Refreshing api access token`);
      const requestParams = stringify({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: this.envConfig.clientId,
      });
      const oauthResponse = await axios.post("https://id.vincere.io/oauth2/token",requestParams);
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
      return {
        "x-api-key": this.envConfig.clientId,
        "id-token": this.tokenCache.get(config.apiKey)?.token
      };
    }
  }
}

start(new VincereAdapter());
