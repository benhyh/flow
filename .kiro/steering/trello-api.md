# Authorizing With Trello's REST API
---

## Introduction

Trello's API uses token-based authentication to grant third-party applications access to the Trello API. Once a Trello user has granted an application access to their Trello account and data, the application is given a token that can be used to make requests to the Trello API on behalf of the user.

There are two ways to authorize a client and receive a User Token. The first is via our ```1/authorize``` route, the second is via basic OAuth1.0. We'll cover the former now. If you'd rather use OAuth, you can skip ahead to Using Basic OAuth. For our applicaiton, we're going down the Trello's 1/authorize Route

Expected flow:

    1. Redirect the user from FlowSync to the Trello authorization endpoint (https://trello.com/1/authorize) with your app’s key and requested permissions.

    2. The user is prompted to approve your app.

    3. Trello redirects back (or shows) a user token.

    4. Flow stores the token and uses it in API requests on behalf of the user.

## Authorizing A Client
To begin the authentication process, you need an API key. As an API key is tied to a Power-Up, you can visit the https://trello.com/power-ups/admin page, access your Power-Up, navigate to the API Key tab and select the option Generate a new API Key if you haven't generated the API key yet.

Once you have an API key, you will use it to ask a Trello user to grant access to your application. To do so, you should direct a user to the authorize URL and pass along the query parameters needed as documented below. The authorize prompt can be opened in a number of different ways and with a number of different options.

The length of access and scope of permissions are all configurable via query params (documented below).

For instance, if you're just getting started with Trello's API and you'd like to explore what is possible, you can generate a token for yourself using your API key and the following URL: https://trello.com/1/authorize?expiration=1day&scope=read&response_type=token&key={YourAPIKey}

After visiting this page and clicking the green Allow button, you'll be redirected to a page with your token. You can now use that token and your API key to make a request to the Trello API. You can give it a try with: https://api.trello.com/1/members/me/?key={yourAPIKey}&token={yourAPIToken}. This should return an object containing information about your Trello user.


If you’re authorizing a web client, you may want to check out client.js, a wrapper for the API in javascript. It includes built-in authorization methods that you may find useful. However, it uses the same route as is documented below.

## 1/authorize/ Route Options

Parameter: callback_method (string)
Valid Values: ```postMessage``` or ```fragment```
Description: Defines how the token is returned to the you when the user allows the authorization. Must be used in conjunction with return_url. ```postMessage``` should be used for popups. When ```postMessage``` is passed, Trello will call ```window.postMessage()``` to send the token to the popup's opener (i.e. your Power-Ups iframe) The return_url is used as the ```origin``` of the postMessage. See the postMessage documentation for more details. ```fragment``` should be used for redirects. When ```fragment``` is passed, Trello redirects the user to the specified return_url with the token in the URL's hash. That page should have javascript to be able to capture and save this token.


Parameter: return_url (string)
Valid Values: A valid URL that the token should be returned to.	
Description: Defines where the token is returned to you. Must be used in conjuction with callback_method (see above).
 
Parameter: scope (string)
Valid Values: Commad-seperated list of one or more of ```read```, ```write```, ```account```	
Description: read -> reading of boards, organizations, etc. on behalf of the user, write -> writing of boards, organizations, etc. on behalf of the user, account -> read member email, writing of member info, and marking notifications read

Parameter: expiration (string)
Valid Values: ```1hour```, ```1day```, ```30days```, ```never```
Description: When the token should expire.

Parameter: key (string)
Valud Values: Valid Trello API key.
Description Used to generate the user's token.

Parameter: response_type(string)
Valud Values: ```token```
Description: If both return_url and callback_method are not passed, setting the response_type to token will return the full user token in the browser window once the user allows the authorization. Trello will not redirect or use postMessage.

If you're developing a Power-Up (we are), consider using the ```t.authorize``` Power-Up Client Library function. For more information, see its documentation.

## Accessing User Emails
Member emails can only be accessed when the ```account``` scope is requested. Once granted, the token generated can only be used to access the email address of the user who granted access.

Batch email access is only available to enterprises via the SCIM API.

## Handling User Deny
Depending on the ```response_type``` you are using, Trello will do one of two things when a user clicks "Deny" from the authorization flow's prompt.

response_type: ```fragment``` -> Trello will now add an empty ```token=``` query parameter and ```error=``` parameter with error message to the fragment when redirecting back to the ```return_url``` specified.

response_type: ```postMessage``` -> Trello will ```postMessage``` an ```error``` key in the ```postMessage``` with the error message being the value. This will be sent to the ```return_url``` specified.

## Revoking Tokens
Trello users can view metadata regarding the applications they have authorized and granted a token by visiting their account settings page: https://trello.com/{username}/account. There, under the Applications heading, they will see a list of every application they've granted access to, the scope of the access, the date access was approved, and the date that the token expires.

Users are able to revoke a token by clicking on the Revoke button next to the listing. Revoking the token removes the token's access to the user's account and it can no longer be used to make requests to Trello's API on behalf of the user.

Tokens can also be deleted via the API. There is a /1/tokens resource that includes a DELETE action.

Applications and Power-Ups should handle token revocation gracefully. If a token has been revoked, the API will respond with a 401 HTTP status and the message: ```invalid token```. At that point in time, the Power-Up or integration should ask the user to re-authorize the application.

## Allowed Origins

Your API key's allowed origins define which origins Trello can redirect to after a user gives consent for your application.

If the URL in the ```return_url``` parameter does not match one of your API key's allowed origins, the redirect is blocked. This prevents malicious actors from using your API key and secretly redirecting users to their application instead.

For example, if you wanted users to be redirected to ```https://myapplication.com/authorize```, you can add ```https://myapplication.com``` to your allowed origins. You can also use the wildcard symbol * in these origins, e.g. ```https://*.myapplication.com```. When developing locally, you may also use ```http//localhost:3000``` as an allowed origin.

You can manage your API key's allowed origins via the https://trello.com/power-ups/admin page, then access your Power-Up and navigate to the API Key tab.

Note: If your API key has no allowed origins set, then no redirect URL will work.

---

# Get Lists on a Board

Get the Lists on a Board

Forge and OAuth2 apps cannot access this REST resource.

## Request

### Path parameters 

```id: TrelloID``` (this will be provided by the user)

```Node.js
// This code sample uses the 'node-fetch' library:
// https://www.npmjs.com/package/node-fetch
const fetch = require('node-fetch');

fetch('https://api.trello.com/1/boards/{id}/lists?key=APIKey&token=APIToken', {
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
})
  .then(response => {
    console.log(
      `Response: ${response.status} ${response.statusText}`
    );
    return response.text();
  })
  .then(text => console.log(text))
  .catch(err => console.error(err));
```

## 200 Response

```JSON
[
  {
    "id": "5abbe4b7ddc1b351ef961414",
    "name": "Things to buy today",
    "closed": true,
    "pos": 2154,
    "softLimit": "<string>",
    "idBoard": "<string>",
    "subscribed": true,
    "limits": {
      "attachments": {
        "perBoard": {}
      }
    }
  }
]
```

Return: ```array<TrelloList>```

---

# Create a new Card in a Trello List

Create a new card. Query parameters may also be replaced with a JSON request body instead.

Forge and OAuth2 apps cannot access this REST resource.

## Request

### Query Parameters
name: string
    The name for the card
desc: string
    The description for the card
pos: oneOf [string, number]
    The position of the new card. ```top```, ```bottom```, or a positive float
due: string
    A due date for the card
    Format: ```date```
start: string
    The start date of a card, or ```null```
    Nullable: ```true```
    Format: ```date```
dueComplete: boolean
    Whether the status of the card is complete
idList: TrelloID [REQUIRED]
    The ID of the list the card should be created in
    Pattern: ```^[0-9a-fA-F]{24}$```
idMembers: array<TrelloID>
    Comma-separated list of member IDs to add to the card
idLabels: array<TrelloID>
    Comma-separated list of label IDs to add to the card
urlSource: string
    A URL starting with ```http://``` or ```https://```. The URL will be attached to the card upon creation.
    Format: ```url```

```Node.js
// This code sample uses the 'node-fetch' library:
// https://www.npmjs.com/package/node-fetch
const fetch = require('node-fetch');

fetch('https://api.trello.com/1/cards?idList=5abbe4b7ddc1b351ef961414&key=APIKey&token=APIToken', {
  method: 'POST',
  headers: {
    'Accept': 'application/json'
  }
})
  .then(response => {
    console.log(
      `Response: ${response.status} ${response.statusText}`
    );
    return response.text();
  })
  .then(text => console.log(text))
  .catch(err => console.error(err));
```

[200] Response:
```json
{
  "id": "5abbe4b7ddc1b351ef961414",
  "address": "<string>",
  "badges": {
    "attachmentsByType": {
      "trello": {
        "board": 2154,
        "card": 2154
      }
    },
    "location": true,
    "votes": 2154,
    "viewingMemberVoted": false,
    "subscribed": false,
    "fogbugz": "<string>",
    "checkItems": 0,
    "checkItemsChecked": 0,
    "comments": 0,
    "attachments": 0,
    "description": true,
    "due": "<string>",
    "start": "<string>",
    "dueComplete": true
  },
  "checkItemStates": [
    "<string>"
  ],
  "closed": true,
  "coordinates": "<string>",
  "creationMethod": "<string>",
  "dateLastActivity": "2019-09-16T16:19:17.156Z",
  "desc": "👋Hey there,\n\nTrello's Platform team uses this board to keep developers up-to-date.",
  "descData": {
    "emoji": {}
  },
  "due": "<string>",
  "dueReminder": "<string>",
  "idBoard": "5abbe4b7ddc1b351ef961414",
  "idChecklists": [
    {
      "id": "5abbe4b7ddc1b351ef961414"
    }
  ],
  "idLabels": [
    {
      "id": "5abbe4b7ddc1b351ef961414",
      "idBoard": "5abbe4b7ddc1b351ef961414",
      "name": "Overdue",
      "color": "yellow"
    }
  ],
  "idList": "5abbe4b7ddc1b351ef961414",
  "idMembers": [
    "5abbe4b7ddc1b351ef961414"
  ],
  "idMembersVoted": [
    "5abbe4b7ddc1b351ef961414"
  ],
  "idShort": 2154,
  "labels": [
    "5abbe4b7ddc1b351ef961414"
  ],
  "limits": {
    "attachments": {
      "perBoard": {
        "status": "ok",
        "disableAt": 36000,
        "warnAt": 32400
      }
    }
  },
  "locationName": "<string>",
  "manualCoverAttachment": false,
  "name": "👋 What? Why? How?",
  "pos": 65535,
  "shortLink": "H0TZyzbK",
  "shortUrl": "https://trello.com/c/H0TZyzbK",
  "subscribed": false,
  "url": "https://trello.com/c/H0TZyzbK/4-%F0%9F%91%8B-what-why-how",
  "cover": {
    "color": "yellow",
    "idUploadedBackground": true,
    "size": "normal",
    "brightness": "light",
    "isTemplate": false
  }
}
```