# CLINQ-Bridge for vincere

This service provides vincere contacts for CLINQ.

The vincere API authentication process is described [here](https://api.vincere.io/#section/Step-by-Step-Vincere-API-Authentication-Process) 

The vincere data model is described [here](https://api.vincere.io/#section/Vincere-Data-Model-Concept).
The distinction between candidates and contacts is important to understand the integration.


To run the integration you need to contact vincere and 
* get your client Id
* get your API Key
* communicate the sipgate redirect uri to vincere (redirect uri is called callback in the vincere oauth terminology)

For local development the follwoing environment variables must be set (use .env file, see envTemplate):
* clientId - the client id you get from vincere
* apiUrl - your personal api url (https://<your-domain>.vincere.io/api/v2/)
* clientSecret - the API Key you get from vincere
* REDIS_URL_OFF (disable usage of redis -> in memory caching, ok for local development)

You can start the oauth process with the following link:

https://id.vincere.io/oauth2/authorize?response_type=code&client_id=<CLIENT_ID>&redirect_uri=<REDIRECT_URI>&state=STATE

Replace the values in the link:

CLIENT_ID = Your vincere.io Client ID, contact the vincere.io support to get yours  
REDIRECT_URI = The sipgate oauth callback uri, http://localhost:8080/oauth2/callback for local development


This urls can be useful in local development.
Both calls need header 'X-Provider-Key' set to 'idToken:refreshToken',
you can get both tokens in the oauth handling, index.ts -> handleOAuth2Callback()

* http://localhost:8080/contacts 
  * trigger fetching contacts from vincere
* http://localhost:8080/events/calls 
  * trigger handling phone calls event, see example payload in callEvent.json




