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

class MyAdapter implements Adapter {
  /**
   * TODO: Fetch contacts from the contacts provider using config.apiKey and config.apiUrl or throw on error
   */
  public async getContacts(config: Config): Promise<Contact[]> {
    const phoneNumber: PhoneNumber = {
      label: PhoneNumberLabel.MOBILE,
      phoneNumber: "+4915799912345",
    };
    const contact: Contact = {
      id: "7f23375d-35e2-4034-889a-2bdc9cba9633",
      name: null,
      firstName: "Max",
      lastName: "Mustermann",
      email: "mustermann@example.com",
      organization: "MyCompany GmbH",
      contactUrl:
        "https://www.example.com/contact/7f23375d-35e2-4034-889a-2bdc9cba9633",
      avatarUrl:
        "https://www.example.com/contact/7f23375d-35e2-4034-889a-2bdc9cba9633/avatar.png",
      phoneNumbers: [phoneNumber],
    };
    const contacts: Contact[] = await Promise.resolve([contact]);
    return contacts;
  }

  /**
   * REQUIRED FOR OAUTH2 FLOW
   * Return the redirect URL for the given contacts provider.
   * Users will be redirected here to authorize CLINQ.
   */
  public async getOAuth2RedirectUrl(): Promise<string> {
    const redirectUrl = await Promise.resolve(
      "https://crm.example.com/oauth2/authorize"
    );
    return redirectUrl;
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
    const { clientId, redirectUrl } = parseEnvironment();

    const requestParams = stringify({
      grant_type: "authorization_code",
      code: req.query.code?.toString(),
      client_id: clientId,
    });

    const {
      data: { refresh_token, access_token, id_token, token_type, expires_in },
    } = await axios.post<VincereOAuthResponse>(
      "https://id.vincere.io/oauth2/token",
      requestParams,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return Promise.resolve({
      apiKey: access_token,
      apiUrl: "https://api.vincere.io/api/v2/",
    });
  }
}

start(new MyAdapter());
