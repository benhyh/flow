# Gmail API Overview

The Gmail API is a RESTful API that can be used to access Gmail mailboxes and send mail. For most web applications the Gmail API is the best choice for authorized access to a user's Gmail data and is suitable for various applications, such as:

- Read-only mail extraction, indexing, and backup
- Automated or programmatic message sending
- Email account migration
- Email organization including filtering and sorting of messages
- Standardization of email signatures across an organization

Following is a list of common terms used in the Gmail API:

## Message

    An email message containing the sender, recipients, subject, and body. After a message has been created, a message cannot be changed. A message is represented by a message resource.

## Thread

    A collection of related messages forming a conversation. In an email client app, a thread is formed when one or more recipients respond to a message with their own message.

## Label

    A mechanism for organizing messages and threads. For example, the label "taxes" might be created and applied to all messages and threads having to do with a user's taxes. There are two types of labels:

    ## System labels
        Internally-created labels, such as ```INBOX```, ```TRASH```,``` or ```SPAM```. These labels cannot be deleted or modified. However, some system labels, such as ```INBOX``` can be applied to, or removed from, messages and threads.

    ## User labels
        Labels created by a user. These labels can be deleted or modified by the user or an application. A user label is represented by a label resource.

## Draft

    An unsent message. A message contained within the draft can be replaced. Sending a draft automatically deletes the draft and creates a message with the ```SENT``` system label. A draft is represented by a draft resource.

---

# Authentication & authorization

## Choose Gmail API scopes

This document contains Gmail API-specific authorization and authentication information. Before reading this document, be sure to read the Google Workspace's general authentication and authorization information at Learn about authentication and authorization.

## Configure OAuth 2.0 for authorization

Configure the OAuth consent screen and choose scopes [https://developers.google.com/workspace/guides/configure-oauth-consent] to define what information is displayed to users and app reviewers, and register your app so that you can publish it later.

## Gmail API scopes

To define the level of access granted to your app, you need to identify and declare authorization scopes. An authorization scope is an OAuth 2.0 URI string that contains the Google Workspace app name, what kind of data it accesses, and the level of access. Scopes are your app's requests to work with Google Workspace data, including users' Google Account data.

When your app is installed, a user is asked to validate the scopes used by the app. Generally, you should choose the most narrowly focused scope possible and avoid requesting scopes that your app doesn't require. Users more readily grant access to limited, clearly described scopes.

The Gmail API supports the following scopes:

https://www.googleapis.com/auth/gmail.addons.current.action.compose: Manage drafts and send emails when you interact with the add-on. (Non-sensitive)

https://www.googleapis.com/auth/gmail.addons.current.message.action: View your email messages when you interact with the add-on. (Non-sensitive)

https://www.googleapis.com/auth/gmail.addons.current.message.metadata: View your email message metadata when the add-on is running. (Sensitive)

https://www.googleapis.com/auth/gmail.addons.current.message.readonly: View your email messages when the add-on is running. (Sensitive)

https://www.googleapis.com/auth/gmail.labels: Create, read, update, and delete labels only. (Non-sensitive)

https://www.googleapis.com/auth/gmail.send: Send messages only. No read or modify privileges on mailbox. (Sensitive)

https://www.googleapis.com/auth/gmail.readonly Read all resources and their metadata—no write operations. (Restricted)

https://www.googleapis.com/auth/gmail.compose Create, read, update, and delete drafts. Send messages and drafts. (Restricted)

https://www.googleapis.com/auth/gmail.insert Insert and import messages only. (Restricted)

https://www.googleapis.com/auth/gmail.modify All read/write operations except immediate, permanent deletion of threads and messages, bypassing Trash. (Restricted)

https://www.googleapis.com/auth/gmail.metadata Read resources metadata including labels, history records, and email message headers, but not the message body or attachments. (Restricted)

https://www.googleapis.com/auth/gmail.settings.basic Manage basic mail settings. (Restricted)

https://www.googleapis.com/auth/gmail.settings.sharing Manage sensitive mail settings, including forwarding rules and aliases.

Note:Operations guarded by this scope are restricted to administrative use only. They are only available to Google Workspace customers using a service account with domain-wide delegation. (Restricted)

https://mail.google.com/ Full access to the account's mailboxes, including permanent deletion of threads and messages This scope should only be requested if your application needs to immediately and permanently delete threads and messages, bypassing Trash; all other actions can be performed with less permissive scopes. (Restricted)

The Usage column in the table above indicates the sensitivity of each scope, according to the following definitions:

- Non-sensitive——These scopes provide the smallest sphere of authorization access and only require basic app verification. For information about this requirement, see Steps to prepare for verification.

- Sensitive—These scopes allow access to Google User Data and require a sensitive scope verification process. For information on this requirement, see Google API Services: User Data Policy. These scopes don't require a security assessment.

- Restricted—These scopes provide wide access to Google User Data and require you to go through a restricted scope verification process. For information about this requirement, see Google API Services: User Data Policy and Additional Requirements for Specific API Scopes. If you store restricted scope data on servers (or transmit), then you need to go through a security assessment.

---

## Implement server-side authorization

Requests to the Gmail API must be authorized using OAuth 2.0 credentials. You should use server-side flow when your application needs to access Google APIs on behalf of the user, for example when the user is offline. This approach requires passing a one-time authorization code from your client to your server; this code is used to acquire an access token and refresh tokens for your server.

### Create a client ID and client secret (this step is completed, for reference only)

To get started using Gmail API, you need to first use the setup tool, which guides you through creating a project in the Google API Console, enabling the API, and creating credentials.

1. From the Credentials page, click Create credentials > OAuth client ID to create your OAuth 2.0 credentials or Create credentials > Service account key to create a service account.
2. If you created an OAuth client ID, then select your application type.
3. Fill in the form and click Create.

Your application's client IDs and service account keys are now listed on the Credentials page. For details, click a client ID; parameters vary depending on the ID type, but might include email address, client secret, JavaScript origins, or redirect URIs.

Take note of the Client ID as you'll need to add it to your code later.

### Handling authorization requests

When a user loads your application for the first time, they are presented with a dialog to grant permission for your application to access their Gmail account with the requested permission scopes. After this initial authorization, the user is only presented with the permission dialog if your app's client ID changes or the requested scopes have changed.

#### Authenticate

This initial sign-in returns an authorization result object that contains an authorization code if successful.

#### Exchange the authorization code for an access token

The authorization code is a one-time code that your server can exchange for an access token. This access token is passed to the Gmail API to grant your application access to user data for a limited time.

If your application requires `offline` access, the first time your app exchanges the authorization code, it also receives a refresh token that it uses to receive a new access token after a previous token has expired. Your application stores this refresh token (generally in a database on your server) for later use.

Important: Always store user refresh tokens. If your application needs a new refresh token it must send a request with the approval_prompt query parameter set to force. This will cause the user to see a dialog to grant permission to your application again.

The following code samples demonstrate exchanging an authorization code for an access token with `offline` access and storing the refresh token.

```python
# Replace CLIENTSECRETS_LOCATION value with the location of your credentials.json file.

import logging
from oauth2client.client import flow_from_clientsecrets
from oauth2client.client import FlowExchangeError
from oauth2client.client import Credentials # Needed for type hinting/usage in comments
from googleapiclient.discovery import build
from googleapiclient import errors as google_api_errors
import httplib2

# Path to credentials.json which should contain a JSON document such as:
#   {
#     "web": {
#       "client_id": "[[YOUR_CLIENT_ID]]",
#       "client_secret": "[[YOUR_CLIENT_SECRET]]",
#       "redirect_uris": [],
#       "auth_uri": "https://accounts.google.com/o/oauth2/auth",
#       "token_uri": "https://accounts.google.com/o/oauth2/token"
#     }
#   }
CLIENTSECRETS_LOCATION = '<PATH/TO/CLIENT_SECRETS.JSON>'
REDIRECT_URI = '<YOUR_REGISTERED_REDIRECT_URI>'
SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    # Add other requested scopes.
]

class GetCredentialsException(Exception):
  """Error raised when an error occurred while retrieving credentials.

  Attributes:
    authorization_url: Authorization URL to redirect the user to in order to
                      request offline access.
  """
  def __init__(self, authorization_url):
    """Construct a GetCredentialsException."""
    super().__init__(f"Authorization URL: {authorization_url}")
    self.authorization_url = authorization_url

class CodeExchangeException(GetCredentialsException):
  """Error raised when a code exchange has failed."""
  pass

class NoRefreshTokenException(GetCredentialsException):
  """Error raised when no refresh token has been found."""
  pass

class NoUserIdException(Exception):
  """Error raised when no user ID could be retrieved."""
  pass

def get_stored_credentials(user_id):
  """Retrieved stored credentials for the provided user ID.

  Args:
    user_id: User's ID.

  Returns:
    Stored oauth2client.client.OAuth2Credentials if found, None otherwise.

  Raises:
    NotImplementedError: This function has not been implemented.
  """
  # TODO: Implement this function to work with your database.
  #       To instantiate an OAuth2Credentials instance from a Json
  #       representation, use the oauth2client.client.Credentials.new_from_json
  #       class method. (oauth2client.client.Credentials needs to be imported)
  #       Example:
  #       from oauth2client.client import Credentials
  #       json_creds = load_from_db(user_id)
  #       if json_creds:
  #           return Credentials.new_from_json(json_creds)
  #       return None
  raise NotImplementedError()

def store_credentials(user_id, credentials):
  """Store OAuth 2.0 credentials in the application's database.

  This function stores the provided OAuth 2.0 credentials using the user ID as
  key.

  Args:
    user_id: User's ID.
    credentials: OAuth 2.0 credentials to store.

  Raises:
    NotImplementedError: This function has not been implemented.
  """
  # TODO: Implement this function to work with your database.
  #       To retrieve a Json representation of the credentials instance, call the
  #       credentials.to_json() method.
  #       Example:
  #       save_to_db(user_id, credentials.to_json())
  raise NotImplementedError()

def exchange_code(authorization_code):
  """Exchange an authorization code for OAuth 2.0 credentials.

  Args:
    authorization_code: Authorization code to exchange for OAuth 2.0
                        credentials.

  Returns:
    oauth2client.client.OAuth2Credentials instance.

  Raises:
    CodeExchangeException: an error occurred.
  """
  flow = flow_from_clientsecrets(CLIENTSECRETS_LOCATION, ' '.join(SCOPES))
  flow.redirect_uri = REDIRECT_URI
  try:
    credentials = flow.step2_exchange(authorization_code)
    return credentials
  except FlowExchangeError as error:
    logging.error('An error occurred: %s', error)
    raise CodeExchangeException(None)

def get_user_info(credentials):
  """Send a request to the UserInfo API to retrieve the user's information.

  Args:
    credentials: oauth2client.client.OAuth2Credentials instance to authorize the
              request.

  Returns:
    User information as a dict.
  """
  user_info_service = build(
      serviceName='oauth2', version='v2',
      http=credentials.authorize(httplib2.Http()))
  user_info = None
  try:
    user_info = user_info_service.userinfo().get().execute()
  except google_api_errors.HttpError as e:
    logging.error('An error occurred: %s', e)
  if user_info and user_info.get('id'):
    return user_info
  else:
    raise NoUserIdException()

def get_authorization_url(email_address, state):
  """Retrieve the authorization URL.

  Args:
    email_address: User's e-mail address.
    state: State for the authorization URL.

  Returns:
    Authorization URL to redirect the user to.
  """
  flow = flow_from_clientsecrets(CLIENTSECRETS_LOCATION, ' '.join(SCOPES))
  flow.params['access_type'] = 'offline'
  flow.params['approval_prompt'] = 'force'
  flow.params['user_id'] = email_address
  flow.params['state'] = state
  # The step1_get_authorize_url method uses the flow.redirect_uri attribute.
  flow.redirect_uri = REDIRECT_URI
  return flow.step1_get_authorize_url()

def get_credentials(authorization_code, state):
  """Retrieve credentials using the provided authorization code.

  This function exchanges the authorization code for an access token and queries
  the UserInfo API to retrieve the user's e-mail address.

  If a refresh token has been retrieved along with an access token, it is stored
  in the application database using the user's e-mail address as key.

  If no refresh token has been retrieved, the function checks in the application
  database for one and returns it if found or raises a NoRefreshTokenException
  with the authorization URL to redirect the user to.

  Args:
    authorization_code: Authorization code to use to retrieve an access token.
    state: State to set to the authorization URL in case of error.

  Returns:
    oauth2client.client.OAuth2Credentials instance containing an access and
    refresh token.

  Raises:
    CodeExchangeError: Could not exchange the authorization code.
    NoRefreshTokenException: No refresh token could be retrieved from the
                          available sources.
  """
  email_address = ''
  try:
    credentials = exchange_code(authorization_code)
    user_info = get_user_info(credentials) # Can raise NoUserIdException or google_api_errors.HttpError
    email_address = user_info.get('email')
    user_id = user_info.get('id')
    if credentials.refresh_token is not None:
      store_credentials(user_id, credentials)
      return credentials
    else:
      credentials = get_stored_credentials(user_id)
      if credentials and credentials.refresh_token is not None:
        return credentials
  except CodeExchangeException as error:
    logging.error('An error occurred during code exchange.')
    # Drive apps should try to retrieve the user and credentials for the current
    # session.
    # If none is available, redirect the user to the authorization URL.
    error.authorization_url = get_authorization_url(email_address, state)
    raise error
  except NoUserIdException:
    logging.error('No user ID could be retrieved.')
  # No refresh token has been retrieved.
  authorization_url = get_authorization_url(email_address, state)
  raise NoRefreshTokenException(authorization_url)
```

#### Authorizing with stored credentials

When users visit your app after a successful first-time authorization flow, your application can use a stored refresh token to authorize requests without prompting the user again.

If you have already authenticated the user, your application can retrieve the refresh token from its database and store the token in a server-side session. If the refresh token is revoked or is otherwise invalid, you'll need to catch this and take appropriate action.

### Using OAuth 2.0 credentials

Once OAuth 2.0 credentials have been retrieved as shown in the previous section, they can be used to authorize a Gmail service object and send requests to the API.

This code sample shows how to instantiate a service object and then authorize it to make API requests.

```python
from apiclient.discovery import build
# ...

def build_service(credentials):
  """Build a Gmail service object.

  Args:
    credentials: OAuth 2.0 credentials.

  Returns:
    Gmail service object.
  """
  http = httplib2.Http()
  http = credentials.authorize(http)
  return build('gmail', 'v1', http=http)
```

### Send authorized requests and check for revoked credentials

The following code snippet uses an authorized Gmail service instance to retrieve a list of messages.

If an error occurs, the code checks for an HTTP `401` status code, which should be handled by redirecting the user to the authorization URL.

More Gmail API operations are documented in the API Reference.

```python
from googleapiclient import errors

# ...

def ListMessages(service, user, query=''):
  """Gets a list of messages.

  Args:
    service: Authorized Gmail API service instance.
    user: The email address of the account.
    query: String used to filter messages returned.
          Eg.- 'label:UNREAD' for unread Messages only.

  Returns:
    List of messages that match the criteria of the query. Note that the
    returned list contains Message IDs, you must use get with the
    appropriate id to get the details of a Message.
  """
  try:
    response = service.users().messages().list(userId=user, q=query).execute()
    messages = []
    if 'messages' in response:
      messages.extend(response['messages'])

    while 'nextPageToken' in response:
      page_token = response['nextPageToken']
      response = service.users().messages().list(userId=user, q=query,
                                        pageToken=page_token).execute()
      if 'messages' in response:
        messages.extend(response['messages'])

    return messages
  except errors.HttpError as error:
    print('An error occurred: %s' % error)
    if error.resp.status == 401:
      # Credentials have been revoked.
      # TODO: Redirect the user to the authorization URL.
      raise NotImplementedError()
```

---

## JavaScript quickstart (this is for reference - KIRO, if you read this won't be necessary to REPLICATE and copy to our existing application)

Create a JavaScript web application that makes requests to the Gmail API.

Quickstarts explain how to set up and run an app that calls a Google Workspace API. This quickstart uses a simplified authentication approach that is appropriate for a testing environment. For a production environment, we recommend learning about authentication and authorization before choosing the access credentials that are appropriate for your app.

This quickstart uses Google Workspace's recommended API client libraries to handle some details of the authentication and authorization flow.

### Setting up the sample code

1. In your working directory, create a file named `index.html`.
2. In the `index.html` file, paste the following sample code:

<!DOCTYPE html>
<html>
  <head>
    <title>Gmail API Quickstart</title>
    <meta charset="utf-8" />
  </head>
  <body>
    <p>Gmail API Quickstart</p>

    <!--Add buttons to initiate auth sequence and sign out-->
    <button id="authorize_button" onclick="handleAuthClick()">Authorize</button>
    <button id="signout_button" onclick="handleSignoutClick()">Sign Out</button>

    <pre id="content" style="white-space: pre-wrap;"></pre>

    <script type="text/javascript">
      /* exported gapiLoaded */
      /* exported gisLoaded */
      /* exported handleAuthClick */
      /* exported handleSignoutClick */

      // TODO(developer): Set to client ID and API key from the Developer Console
      const CLIENT_ID = '<YOUR_CLIENT_ID>';
      const API_KEY = '<YOUR_API_KEY>';

      // Discovery doc URL for APIs used by the quickstart
      const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest';

      // Authorization scopes required by the API; multiple scopes can be
      // included, separated by spaces.
      const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';

      let tokenClient;
      let gapiInited = false;
      let gisInited = false;

      document.getElementById('authorize_button').style.visibility = 'hidden';
      document.getElementById('signout_button').style.visibility = 'hidden';

      /**
       * Callback after api.js is loaded.
       */
      function gapiLoaded() {
        gapi.load('client', initializeGapiClient);
      }

      /**
       * Callback after the API client is loaded. Loads the
       * discovery doc to initialize the API.
       */
      async function initializeGapiClient() {
        await gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
        maybeEnableButtons();
      }

      /**
       * Callback after Google Identity Services are loaded.
       */
      function gisLoaded() {
        tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: '', // defined later
        });
        gisInited = true;
        maybeEnableButtons();
      }

      /**
       * Enables user interaction after all libraries are loaded.
       */
      function maybeEnableButtons() {
        if (gapiInited && gisInited) {
          document.getElementById('authorize_button').style.visibility = 'visible';
        }
      }

      /**
       *  Sign in the user upon button click.
       */
      function handleAuthClick() {
        tokenClient.callback = async (resp) => {
          if (resp.error !== undefined) {
            throw (resp);
          }
          document.getElementById('signout_button').style.visibility = 'visible';
          document.getElementById('authorize_button').innerText = 'Refresh';
          await listLabels();
        };

        if (gapi.client.getToken() === null) {
          // Prompt the user to select a Google Account and ask for consent to share their data
          // when establishing a new session.
          tokenClient.requestAccessToken({prompt: 'consent'});
        } else {
          // Skip display of account chooser and consent dialog for an existing session.
          tokenClient.requestAccessToken({prompt: ''});
        }
      }

      /**
       *  Sign out the user upon button click.
       */
      function handleSignoutClick() {
        const token = gapi.client.getToken();
        if (token !== null) {
          google.accounts.oauth2.revoke(token.access_token);
          gapi.client.setToken('');
          document.getElementById('content').innerText = '';
          document.getElementById('authorize_button').innerText = 'Authorize';
          document.getElementById('signout_button').style.visibility = 'hidden';
        }
      }

      /**
       * Print all Labels in the authorized user's inbox. If no labels
       * are found an appropriate message is printed.
       */
      async function listLabels() {
        let response;
        try {
          response = await gapi.client.gmail.users.labels.list({
            'userId': 'me',
          });
        } catch (err) {
          document.getElementById('content').innerText = err.message;
          return;
        }
        const labels = response.result.labels;
        if (!labels || labels.length == 0) {
          document.getElementById('content').innerText = 'No labels found.';
          return;
        }
        // Flatten to string to display
        const output = labels.reduce(
            (str, label) => `${str}${label.name}\n`,
            'Labels:\n');
        document.getElementById('content').innerText = output;
      }
    </script>
    <script async defer src="https://apis.google.com/js/api.js" onload="gapiLoaded()"></script>
    <script async defer src="https://accounts.google.com/gsi/client" onload="gisLoaded()"></script>

  </body>
</html>

Replace the following:

- `YOUR_CLIENT_ID`: the client ID that you created when you authorized credentials for a web application.
  = `YOUR_API_KEY`: the API key that you created as a Prerequisite.

### Run the sample

1. In your working directory, install the http-server package:

```bash
npm install http-server
```

2. In your working directory, start a web server:

```bash
npx http-server -p 8000
```

3. In your browser, navigate to `http://localhost:8000`.
4. You see a prompt to authorize access:
   - If you're not already signed in to your Google Account, sign in when prompted. If you're signed in to multiple accounts, select one account to use for authorization.
     b. Click Accept

Your JavaScript application runs and calls the Gmail API.

---

## Manage mailboxes

---

### Managing Threads

The Gmail API uses `Thread` [https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.threads] resources to group email replies with their original message into a single conversation or thread. This allows you to retrieve all messages in a conversation, in order, making it easier to have context for a message or to refine search results.

Like messages, [https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages] threads may also have labels applied to them. However, unlike messages, threads cannot be created, only deleted. Messages can, however, be inserted into a thread.

### Retrieving threads

Threads provide a simple way of retrieving messages in a conversation in order. By listing a set of threads you can choose to group messages by conversation and provide additional context. You can retrieve a list of threads using the `threads.list` method, or retrieve a specific thread with `threads.get`. You can also filter threads [https://developers.google.com/workspace/gmail/api/guides/filtering] using the same query parameters as for the Message [https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages] resource. If any message in a thread matches the query, that thread is returned in the result.

The code sample below demonstrates how to use both methods in a sample that displays the most chatty threads in your inbox. The `threads.list` method fetches all thread IDs, then `threads.get` grabs all messages in each thread. For those with 3 or more replies, we extract the `Subject` line and display the non-empty ones plus the number of messages in the thread. You'll also find this code sample featured in the corresponding DevByte video.

```python
import google.auth
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


def show_chatty_threads():
  """Display threads with long conversations(>= 3 messages)
  Return: None

  Load pre-authorized user credentials from the environment.
  TODO(developer) - See https://developers.google.com/identity
  for guides on implementing OAuth2 for the application.
  """
  creds, _ = google.auth.default()

  try:
    # create gmail api client
    service = build("gmail", "v1", credentials=creds)

    # pylint: disable=maybe-no-member
    # pylint: disable:R1710
    threads = (
        service.users().threads().list(userId="me").execute().get("threads", [])
    )
    for thread in threads:
      tdata = (
          service.users().threads().get(userId="me", id=thread["id"]).execute()
      )
      nmsgs = len(tdata["messages"])

      # skip if <3 msgs in thread
      if nmsgs > 2:
        msg = tdata["messages"][0]["payload"]
        subject = ""
        for header in msg["headers"]:
          if header["name"] == "Subject":
            subject = header["value"]
            break
        if subject:  # skip if no Subject line
          print(f"- {subject}, {nmsgs}")
    return threads

  except HttpError as error:
    print(f"An error occurred: {error}")


if __name__ == "__main__":
  show_chatty_threads()
```

#### Adding drafts and messages to threads

If you are sending or migrating messages that are a response to another email or part of a conversation, your application should add that message to the related thread. This makes it easier for Gmail users who are participating in the conversation to keep the message in context.

A draft can be added to a thread as part of creating [https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.drafts/create], updating [https://developers.google.com/workspace/gmail/api/v1/reference/users/drafts/update], or sending [https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.drafts/send] a draft message. You can also add a message to a thread as part of inserting [https://developers.google.com/workspace/gmail/api/v1/reference/users/messages/insert] or sending a message.

In order to be part of a thread, a message or draft must meet the following criteria:

1. The requested `threadId` must be specified on the `Message` or `Draft.Message` you supply with your request.
2. The `References` and `In-Reply-To` headers must be set in compliance with the RFC 2822 standard.
   The References and In-Reply-To headers must be set in compliance with the RFC 2822 standard.
3. The `Subject` headers must match.

Take a look at the creating a draft [https://developers.google.com/workspace/gmail/api/guides/drafts] or sending a message [https://developers.google.com/workspace/gmail/api/guides/sending] examples. In both cases, you would simply add a `threadId` key paired with a thread ID to a message's metadata, the `message` object.

---

### Manage labels

You can use labels to tag, organize, and categorize messages and threads in Gmail. A label has a many-to-many relationship with messages and threads: you can apply multiple labels to a single message or thread and apply a single label to multiple messages or threads.

For information about how to create [https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.labels/create], get [https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.labels/get], list [https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.labels/list], update [https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.labels/update], or delete labels [https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.labels/delete], see the Labels reference.

To manage labels, you must use the `https://www.googleapis.com/auth/gmail.labels` scope. For more information about scopes, see Gmail API-specific authorization and authentication information. [https://developers.google.com/workspace/gmail/api/auth/scopes]

#### Types of labels

Labels come in two varieties: reserved `SYSTEM`` labels and custom `USER`labels. System labels typically correspond to pre-defined elements in the Gmail web interface such as the inbox. Systems label names are reserved; no USER label can be created with the same name as any`SYSTEM``` label. The following table lists several of the most common Gmail system labels:

`INBOX` | can be manually applied: YES
`SPAM` | can be manually applied: YES
`TRASH` | can be manually applied: YES
`UNREAD` | can be manually applied: YES
`STARRED` | can be manually applied: YES
`IMPORTANT` | can be manually applied: YES
`SENT` | can be manually applied: NO - Applied automatically to messages that are sent with ``drafts.send` or `messages.send`, inserted with `messages.insert` and the user's email in the From header, or sent by the user through the web interface.
`DRAFT` | can be manually applied: NO - Automatically applied to all `draft` messages created with the Gmail API or Gmail interface.
`CATEGORY_PERSONAL` | can be manually applied: YES - Corresponds to messages that are displayed in the Personal tab of the Gmail interface.\
`CATEGORY_SOCIAL` | can be manually applied: YES - Corresponds to messages that are displayed in the Social tab of the Gmail interface.
`CATEGORY_PROMOTIONS` | can be manually applied: YES - Corresponds to messages that are displayed in the Promotions tab of the Gmail interface.
`CATEGORY_UPDATES` | can be manually applied: YES - Corresponds to messages that are displayed in the Updates tab of the Gmail interface.
`CATEGORY_FORUMS` | can be manually applied: YES - Corresponds to messages that are displayed in the Forums tab of the Gmail interface.

Note: The above list is not exhaustive and other reserved label names exist. Attempting to create a custom label with a name that conflicts with a reserved name results in an HTTP 400 - Invalid label name error.

### Manage labels on messages & threads

Labels only exist on messages. For instance, if you list labels on a thread, you get a list of labels that exist on any of the messages within the thread. A label might not exist on every message within a thread. You can apply multiple labels to messages, but you can't apply labels to draft messages.

#### Add or remove labels to threads

When you add or remove a label to a thread, you add or remove the specified label on all existing messages in the thread.

If messages are added to a thread after you add a label, the new messages don't inherit the existing label associated with the thread. To add the label to those messages, add the label to the thread again.

To add or remove the labels associated with a thread, use `threads.modify`.

#### Add or remove labels to messages

When you add a label to a message, the label is added to that message and becomes associated with the thread to which the message belongs. The label isn't added to other messages within the thread.

If you remove a label from a message and it was the only message in the thread with that label, the label is also removed from the thread.

To add or remove the labels applied to a message, use `messages.modify`.

---

### Searching for Messages

You can search or filter files using the `messages.list` and `threads.list` methods. These methods accept the `q` parameter which supports most of the same advanced search syntax [https://support.google.com/mail/answer/7190] as the Gmail web-interface. For a list of search and filter differences between the Gmail UI and Gmail API, see Search filter differences: Gmail UI versus Gmail API [https://developers.google.com/workspace/gmail/api/guides/filtering#differences].

This advanced syntax allows you to use search queries to filter messages by properties such as the sender, date, or label to name a few possibilities. For example, the following query retrieves all messages sent by the user in January of 2014:

```
GET https://www.googleapis.com/gmail/v1/users/me/messages?q=in:sent after:2014/01/01 before:2014/02/01
```

Warning: All dates used in the search query are interpreted as midnight on that date in the PST timezone. To specify accurate dates for other timezones pass the value in seconds instead:

```
?q=in:sent after:1388552400 before:1391230800
```

In addition to search queries, you can also filter messages and threads by label with the labelIds parameter. This allows you to search for messages and threads with the specified system or user labels applied. For more information, see the `messages.list` or `threads.list` method reference.

#### Search and filter differences: Gmail UI versus Gmail API

The Gmail UI performs alias expansion which allows it to infer an account alias from a Google Workspace account. For example, suppose you have an account of `myprimary@mycompany.net` and your admin sets up an alias for that account of `myalias@mycompany.net`. If `myalias@mycompany.net` sends an email, but you search for "`from: myprimary@mycompany.net)`" the email sent by `myalias@mycompany.net` shows up as a search result the Gmail UI, but not in the API response.

The Gmail UI allows users to perform thread-wide searches, but the API doesn't.

---

### List messages

This page explains how to call the Gmail API's `users.messages.list` method.

The method returns an array of Gmail `Message` resources that contain the message `id` and `threadId`. To retrieve full message details, use the `users.messages.get` method.

#### List messages

The `users.messages.list` method supports several query parameters to filter the messages:

- `maxResults`: Maximum number of messages to return (defaults to 100, max 500).
- `pageToken`: Token to retrieve a specific page of results.
- `q`: Query string to filter messages, such as `from:someuser@example.com is:unread"`.
- `labelIds`: Only return messages with labels that match all specified label IDs.
- `includeSpamTrash`: Include messages from `SPAM` and `TRASH` in the results.

#### Code sample

The following code sample shows how to list messages for the authenticated Gmail user. The code handles pagination to retrieve all messages matching the query.

```python
import os.path
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# If modifying these scopes, delete the file token.json.
SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]


def main():
    """Shows basic usage of the Gmail API.
    Lists the user's Gmail messages.
    """
    creds = None
    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open("token.json", "w") as token:
            token.write(creds.to_json())

    try:
        # Call the Gmail API
        service = build("gmail", "v1", credentials=creds)
        results = (
            service.users().messages().list(userId="me", labelIds=["INBOX"]).execute()
        )
        messages = results.get("messages", [])

        if not messages:
            print("No messages found.")
            return

        print("Messages:")
        for message in messages:
            print(f'Message ID: {message["id"]}')
            msg = (
                service.users().messages().get(userId="me", id=message["id"]).execute()
            )
            print(f'  Subject: {msg["snippet"]}')

    except HttpError as error:
        # TODO(developer) - Handle errors from gmail API.
        print(f"An error occurred: {error}")


if __name__ == "__main__":
    main()
```

The `users.messages.list` method returns a response body that contains the following:

- `messages[]`: An array of `Message` resources.
- `nextPageToken`: For requests with multiple pages of results, a token that can be used with a subsequent calls to list more messages.
- `resultSizeEstimate`: An estimated total number of results.
  To fetch the full message content and metadata, use the `message.id` field to call the `users.messages.get` method.

---

### Synchronizing Clients with Gmail

Keeping your client synchronized with Gmail is important for most application scenarios. There are two overall synchronization scenarios: full synchronization and partial synchronization. Full synchronization is required the first time your client connects to Gmail and in some other rare scenarios. If your client has recently synchronized, partial synchronization is a lighter-weight alternative to a full sync. You can also use push notifications to trigger partial synchronization in real-time and only when necessary, thereby avoiding needless polling.

#### Full synchronization

The first time your application connects to Gmail, or if partial synchronization is not available, you must perform a full sync. In a full sync operation, your application should retrieve and store as many of the most recent messages or threads as are necessary for your purpose. For example, if your application displays a list of recent messages, you may wish to retrieve and cache enough messages to allow for a responsive interface if the user scrolls beyond the first several messages displayed. The general procedure for performing a full sync operation is as follows:

    1. Call ```messages.list``` to retrieve the first page of message IDs.
    2. Create a batch request of ```messages.get``` requests for each of the messages returned by the list request. If your application displays message contents, you should use ```format=FULL``` or ```format=RAW``` the first time your application retrieves a message and cache the results to avoid additional retrieval operations. If you are retrieving a previously cached message, you should use ```format=MINIMAL``` to reduce the size of the response as only the ```labelIds``` may change.
    3. Merge the updates into your cached results. Your application should store the ```historyId``` of the most recent message (the first message in the ```list``` response) for future partial synchronization.

Note: You can also perform synchronization using the equivalent Threads resource methods. This may be advantageous if your application primarily works with threads or only requires message metadata.

#### Partial synchronization

If your application has synchronized recently, you can perform a partial sync using the `history.list` method to return all history records newer than the `startHistoryId` you specify in your request. History records provide message IDs and type of change for each message, such as message added, deleted, or labels modified since the time of the `startHistoryId`. You can obtain and store the `historyId` of the most recent message from a full or partial sync to provide as a `startHistoryId` for future partial synchronization operations.

#### Limitations

History records are typically available for at least one week and often longer. However, the time period for which records are available may be significantly less and records may sometimes be unavailable in rare cases. If the `startHistoryId` supplied by your client is outside the available range of history records, the API returns an `HTTP 404` error response. In this case, your client must perform a full sync as described in the previous section.

---

### Push Notifications

#### Overview

The Gmail API provides server push notifications that let you watch for changes to Gmail mailboxes. You can use this feature to improve the performance of your application. It allows you to eliminate the extra network and compute costs involved with polling resources to determine if they have changed. Whenever a mailbox changes, the Gmail API notifies your backend server application.

Note: For notifications to user-owned devices (i.e. installed apps, mobile devices, or browsers), the poll-based sync guide is still the recommended approach to retrieve updates.

#### Initial Cloud Pub/Sub Setup

The Gmail API uses the Cloud Pub/Sub API [https://cloud.google.com/pubsub/docs/overview] to deliver push notifications. This allows notification via a variety of methods including webhooks and polling on a single subscription endpoint.

##### Prerequisites

In order to complete the rest of this setup, make sure you fulfill the Cloud Pub/Sub Prerequisites [https://cloud.google.com/pubsub/prereqs] and then set up a Cloud Pub/Sub client [https://cloud.google.com/pubsub/docs/reference/libraries].

##### Create a topic

Using your Cloud Pub/Sub client, create the topic [https://cloud.google.com/pubsub/publisher#create] that the Gmail API should send notifications to. The topic name can be any name you choose under your project (i.e. matching `projects/myproject/topics/*`, where `myproject` is the Project ID listed for your project in the Google Developers Console).

###### Create a subscription

Follow the Cloud Pub/Sub Subscriber Guide [https://cloud.google.com/pubsub/docs/subscriber] to set up a subscription to the topic that you created. Configure the subscription type to be either a webhook push (i.e. HTTP POST callback) or pull (i.e. initiated by your app). This is how your application will receive notifications for updates.

##### Grant publish rights on your topic

Cloud Pub/Sub requires that you grant Gmail privileges to publish notifications to your topic.

To do this, you need to grant `publish` privileges to `gmail-api-push@system.gserviceaccount.com`. You can do this using the Cloud Pub/Sub Developer Console permissions interface [https://console.cloud.google.com/project/_/cloudpubsub/topicList] following the resource-level access control instructions [https://cloud.google.com/pubsub/access_control#set_topic_level_access].

#### Getting Gmail mailbox updates

Once the initial Cloud Pub/Sub setup is finished, configure Gmail accounts to send notifications for mailbox updates.

##### Watch request

To configure Gmail accounts to send notifications to your Cloud Pub/Sub topic, simply use your Gmail API client to call `watch` on the Gmail user mailbox similar to any other Gmail API call. To do so, provide the topic name created above and any other options in your watch request, such as `labels` to filter on. For example, to be notified any time a change is made to the Inbox:

```python
request = {
  'labelIds': ['INBOX'],
  'topicName': 'projects/myproject/topics/mytopic',
  'labelFilterBehavior': 'INCLUDE'
}
gmail.users().watch(userId='me', body=request).execute()
```

##### Watch response

If the `watch` request is successful you will receive a response like:

```
{
  historyId: 1234567890
  expiration: 1431990098200
}
```

with the current mailbox `historyId` for the user. All changes after that `historyId` will be notified to your client. If you need to process changes prior to this `historyId`, refer to the sync guide [https://developers.google.com/workspace/gmail/api/guides/sync].

Additionally, a successful `watch` call should cause a notification to immediately be sent to your Cloud Pub/Sub topic.

If you receive an error from the `watch` call, the details should explain the source of the problem, which is typically with the setup of the Cloud Pub/Sub topic and subscription. Refer to the Cloud Pub/Sub documentation to confirm that the setup is correct and for help with debugging topic and subscription issues.

##### Renewing mailbox watch

You must re-call `watch`` at least every 7 days or else you will stop receiving updates for the user. We recommend calling `watch`once per day. The watch response also has an expiration field with the timestamp for the`watch``` expiration.

#### Receiving notifications

Whenever a mailbox update occurs that matches your `watch`, your application will receive a notification message describing the change.

If you have configured a push subscription, a webhook notification to your server will conform to a `PubsubMessage`:

```python
POST https://yourserver.example.com/yourUrl
Content-type: application/json

{
  message:
  {
    // This is the actual notification data, as base64url-encoded JSON.
    data: "eyJlbWFpbEFkZHJlc3MiOiAidXNlckBleGFtcGxlLmNvbSIsICJoaXN0b3J5SWQiOiAiMTIzNDU2Nzg5MCJ9",

    // This is a Cloud Pub/Sub message id, unrelated to Gmail messages.
    "messageId": "2070443601311540",

    // This is the publish time of the message.
    "publishTime": "2021-02-26T19:13:55.749Z",
  }

  subscription: "projects/myproject/subscriptions/mysubscription"
}
```

The HTTP POST body is JSON and the actual Gmail notification payload is in the message.data field. That message.data field is a base64url-encoded string that decodes to a JSON object containing the email address and the new mailbox history ID for the user:

```python
{"emailAddress": "user@example.com", "historyId": "9876543210"}
```

You can then use `history.list` to get the change details for the user since their last known historyId, as per the sync guide.

For example, to use `history.list` to identify changes that occurred between your initial `watch` call and the receipt of the notification message shared in the previous example, pass `1234567890` as the `startHistoryId` to `history.list`. Afterwards, `9876543210` can be persisted as the last known historyId for future use cases.

If you have configured a pull subscription instead, refer to the code samples in the Cloud Pub/Sub Subscriber Pull Guide for more details on receiving messages.

#### Responding to notifications

All notifications need to be acknowledged. If you use webhook push delivery, then responding successfully (e.g. HTTP 200) will acknowledge the notification.

If using pull delivery (REST Pull, RPC Pull , or RPC StreamingPull) then you must follow up with an acknowledge call (REST or RPC). Refer to the code samples in the Cloud Pub/Sub Subscriber Pull Guide for more details on acknowledging messages either asynchronously or synchronously using the official RPC-based client libraries.

If the notifications are not acknowledged (e.g. your webhook callback returns an error or times out), Cloud Pub/Sub will retry the notification at a later time.

#### Stopping mailbox updates

To stop receiving updates on a mailbox, call `stop`and all new notifications should stop within a few minutes.

#### Limitations

Stopping mailbox updates
To stop receiving updates on a mailbox, call stop and all new notifications should stop within a few minutes.

Limitations
Max notification rate
Each Gmail user being watched has a maximum notification rate of 1 event/sec. Any user notifications above that rate will be dropped. Be careful when handling notifications to be sure not to trigger another notification, and thereby start a notification loop.

Reliability
Typically all notifications should be delivered reliably within a few seconds; however in some extreme situations notifications may be delayed or dropped. Make sure to handle this possibility gracefully, so that the application still syncs even if no push messages are received. For example, fall back to periodically calling history.list after a period with no notifications for a user.

Cloud Pub/Sub Limitations
The Cloud Pub/Sub API also has its own limitations, specifically detailed in its pricing and quotas documentation.
Max notification rate
Each Gmail user being watched has a maximum notification rate of 1 event/sec. Any user notifications above that rate will be dropped. Be careful when handling notifications to be sure not to trigger another notification, and thereby start a notification loop.

Reliability
Typically all notifications should be delivered reliably within a few seconds; however in some extreme situations notifications may be delayed or dropped. Make sure to handle this possibility gracefully, so that the application still syncs even if no push messages are received. For example, fall back to periodically calling history.list after a period with no notifications for a user.

Cloud Pub/Sub Limitations
The Cloud Pub/Sub API also has its own limitations, specifically detailed in its pricing and quotas documentation.
