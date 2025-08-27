# OAuth 

At its core, OAuth ("Open Authorization") is a mechanism for applications to access the Asana API on behalf of a user, all without the application having access to the user's username and password. Instead, the application gets a token, which can be used in subsequent API calls through the addition of an Authorization header:

```shell
-H "Authorization: Bearer ACCESS_TOKEN"
```

In the above example, ```ACCESS_TOKEN``` should be replaced by the actual token received during the token exchange.

Most of the time, OAuth is the preferred method of authentication for developers, users, and Asana as a platform. If you are building a custom app, you should consider building a secure OAuth flow to authenticate users of your app.

## Quick Reference

- Asana supports the authorization code grant flow
- Applications can be created from the developer console (i.e., "My apps")
- The endpoint for user authorization is GET https://app.asana.com/-/oauth_authorize
- The endpoint for token exchange is POST https://app.asana.com/-/oauth_token
- The endpoint for revoking a token is POST https://app.asana.com/-/oauth_revoke
- Once an access token (i.e., bearer token) has been obtained, your application can make API requests on behalf of the user

## Overview of the OAuth process

This section describes the overall OAuth process (i.e., with the authorization code grant flow, which is the most common).

**OAuth libraries**
We recommend using a library (available in your language of choice) to handle the details of OAuth. Along with expediting development time, using a library can help mitigate the risk of security vulnerabilities due to inexperience or oversight.

  As a prerequisite, ensure that you have registered an application with Asana. Take note of the application's client ID and the client secret (which should be protected as a password). Then, to begin:

    1. A user arrives at your application and clicks a button that says Authenticate with Asana (or Connect with Asana, etc.)

    2. The user is taken to the user authorization endpoint, which displays a page that asks the user if they would like to grant access to your third-party application

    3. If the user clicks Allow, they are redirected back to your application, bringing along a special code in the query string

    4. The application makes a request to the token exchange endpoint to exchange that code, along with the application's client secret, for two tokens:
        - An access token (i.e., a bearer token, which lasts an hour)
        - A refresh token (which can be used to fetch a new access token when the current one expires)
    
    5. Using this access token, the application can now make requests against the Asana API for the next hour

    6. Once the access token expires, the application can use the token exchange endpoint again (i.e., without user intervention) to exchange the refresh token for a new access token. This can be repeated for as long as the user has authorized the application

---

## User authorization endpoint

During the user authorization step, the user is prompted by the application to either grant or deny the application to access to their account.

The API endpoint for user authorization is: ```GET``` ```https://app.asana.com/-/oauth_authorize```

## Request

Here is an example of basic link that sends a user to ```https://app.asana.com/-/oauth_authorize```:

```html
<a
  href="https://app.asana.com/-/oauth_authorize
?client_id=753482910
&redirect_uri=https://my.app.com
&response_type=code
&state=thisIsARandomString
&code_challenge_method=S256
&code_challenge=671608a33392cee13585063953a86d396dffd15222d83ef958f43a2804ac7fb2
&scope=projects:read tasks:read tasks:write tasks:delete"
>
  Authenticate with Asana
</a>
```

This example uses ```scope```s chosen during the app registration example above. The ```scope``` parameter is space-separated but must be URL-encoded in practice (i.e., spaces become %20).
    - projects:read
    - tasks:read
    -tasks:write
    - tasks:delete

By clicking on Authenticate with Asana link in the above example, the application redirects the user to ```https://app.asana.com/-/oauth_authorize```, passing query parameters along as a standard query string:

Query parameter / Description:
```client_id``` (required): The client ID uniquely identifies the application making the request
```redirect_uri``` (required): The URI to redirect to on success or error. This must match the redirect URL specified in the application settings
```response_type``` (required): Must be either code or id_token, or the space-delimited combination: code id_token
```state``` (required): Encodes state of the app, which will be returned verbatim in the response and can be used to match the response up to a given request
```code_challenge_method``` (conditional): PKCE The hash method used to generate the challenge. This is typically S256
```code_challenge``` (conditional):	PKCE. The code challenge used for PKCE
```scope```: A space-delimited set of one or more scopes to get the user's permission to access. If no scopes are specified, the default OAuth scope will be used—provided the app was originally registered with Full permissions.

### OAuth scopes

Asana uses OAuth 2.0 for secure user authorization. Scopes allow your app to request only the access it needs, following the principle of least privilege. That is, OAuth scopes define which parts of the Asana API your app can access. This helps users trust your app and ensures their data is protected.

#### Scope structure
Each scope follows the format: ```<resource>:<action>```

Where:
- ```<resource>``` refers to an object (e.g., ```tasks```, ```projects```, ```users```)
- ```<action>``` is one of: ```read```, ```write```, or ```delete```
    - Note: these do not imply inheritance (e.g., ```write``` does not grant ```read``` access)

For example:
- ```tasks:read``` – View basic task information like name and assignee
- ```projects:write``` – Create or modify projects
- ```users:read``` – Access user information like email and profile picture

#### Related object fields in responses

Asana’s data model is graph-based, so many endpoints include nested related objects (e.g., a task object may include the assignee, which is a user object). By default, only the following fields are available for these related objects without additional scopes:

- ```gid```
- ```name or title```
- ```resource_type```
- ```resource_subtype```

Fields which are not in this list will be omitted. If you request any additional fields (using the ```opt_fields``` query parameter), your app must request the corresponding scope. For example:

```
GET /tasks/123?opt_fields=assignee.email
```

This request requires the ```users:read``` scope. Without it, you’ll receive a ```403 Unauthorized``` error.

Request a subset of scopes

Apps with registered scopes must specify scopes at the authorization endpoint using the scope query parameter. Previously, this was optional.

    - You may request a subset of the scopes you registered for. This is useful if you do not need all scopes initially (for example, if the user is only using a subset of the features your app offers) and you would like to progressively ask for additional access as needed.
    - To request additional scopes, you can send the user back to the authorization endpoint. Subsequent requests will not be additive. You must specify the full set of scopes needed.
    - To check which scopes are authorized for a given access token or refresh token, you may use the token introspection endpoint.

For example, in the scenario above, we showed an app registered with these scopes: projects:read, tasks:read, tasks:write, and tasks:delete. However, this app may request only the project:readscope when requesting authorization:

```
<a
  href="https://app.asana.com/-/oauth_authorize
?client_id=753482910
&redirect_uri=https://my.app.com
&response_type=code
&state=thisIsARandomString
&code_challenge_method=S256
&code_challenge=671608a33392cee13585063953a86d396dffd15222d83ef958f43a2804ac7fb2
&scope=projects:read"
>
  Connect with Asana
</a>
```

---

## Response

If either the ```client_id``` or ```redirect_uri``` do not match, the user will simply see a plain-text error. Otherwise,
all errors will be sent back to the ```redirect_uri``` specified.

The user then sees a screen giving them the opportunity to accept or reject the request for authorization. In either case, the user will be redirected back to the ```redirect_uri```.

Below is an example URL through which a user is redirected to the ```redirect_uri```:

```https://my.app.com?code=325797325&state=thisIsARandomString```

Query parameter / Description:
```code```: If value of ```response_type``` is ```code``` in the authorizing request, this is the code your app can exchange for a token
```state```: The ```state``` parameter that was sent with the authorizing request

**Preventing CSRF attacks**
The ```state``` parameter is necessary to prevent CSRF attacks. As such, you must check that the ```state``` is the same in this response as it was in the request. If the ```state``` parameter is not used, or not tied to the user's session, then attackers can initiate an OAuth flow themselves before tricking a user's browser into completing it. That is, users can unknowingly bind their accounts to an attacker account.

In terms of requirements, the ```state``` parameter must contain an unguessable value tied to the user's session, which can be the hash of something tied to their session when the OAuth flow is first initiated (e.g., their session cookie). This value is then passed back and forth between the client application and the OAuth service as a form of CSRF token for the client application.

---

## Token exchange endpoint

The token exchange endpoint is used to exchange a code or refresh token for an access token.

The API endpoint for token exchange is: ```POST https://app.asana.com/-/oauth_token```

### Request

When your app receives a code from the authorization endpoint, it can now be exchanged for a proper token. At this point, your app should make a ```POST``` request to ```https://app.asana.com/-/oauth_token```, passing the parameters as part of a standard form-encoded ```POST``` body (i.e., passing in the data into a request with header 'Content-Type: application/x-www-form-urlencoded')

Below is an example request body in a ``POST`` request to ```https://app.asana.com/-/oauth_token``` and an example cURL call:

```json
{
  "grant_type": "authorization_code",
  "client_id": "753482910",
  "client_secret": "6572195638271537892521",
  "redirect_uri": "https://my.app.com",
  "code": "325797325",
  "code_verifier": "fdsuiafhjbkewbfnmdxzvbuicxlhkvnemwavx"
}
```

Details of each parameter are described below:

Parameter / Description:
```grant_type (required)```	One of ```authorization_code``` or ```refresh_token``` (see below for more details)
```client_id (required)```	The client ID uniquely identifies the application making the request
```client_secret (required)```	The client secret belonging to the app, found in the Basic information tab of the developer console
```redirect_uri (required)```	Must match the ```redirect_uri``` specified in the original request
```code (required)```	This is the code you are exchanging for an authorization token
```refresh_token (conditional)```	If the value of ```grant_type``` is ```refresh_token,``` this is the refresh token you are using to be granted a new access token
```code_verifier```	This is the string previously used to generate the ```code_challenge```.

### Response
In the response to the request above, you will receive a JSON object similar to the example below:

```json
{
  "access_token": "f6ds7fdsa69ags7ag9sd5a",
  "expires_in": 3600,
  "token_type": "bearer",
  "data": {
    "id": 4673218951,
    "gid": "4673218951",
    "name": "Greg Sanchez",
    "email": "gsanchez@example.com"
  },
  "refresh_token": "hjkl325hjkl4325hj4kl32fjds"
}
```

Details of each property are described below:

Property/Description
```access_token```	The token to use in future requests against the API. This token is only valid for the scopes requested during user authorization. To gain additional permissions, the user must reauthorize the app with an updated set of scopes.
```expires_in```	The number of seconds that the token is valid, typically ```3600``` (one hour)
token_type	The type of token (in our case, ```bearer```)
```refresh_token```	If exchanging a code, this is a long-lived token that can be used to get new access tokens when older ones expire
```data```	An object encoding a few key fields about the logged-in user. Currently, this is the user's ```id```, ```gid```, ```name```, and ```email```

### Token expiration

When an access (bearer) token has expired, you'll see the following error when using such a token in an API request:

The bearer token has expired. If you have a refresh token, please use it to request a new bearer token, otherwise allow the user to re-authenticate.

You can get a new access token by having your application make a POST request back to the token exchange endpoint using a ```grant type``` of ```"refresh_token"```. In the same request you must also pass in your long-lived ```refresh_token``` from the original token exchange request.

---

### Token deauthorization endpoint

An authorization token can be deauthorized or invalidated (i.e., revoked) by making a request to Asana's API.

The endpoint for revoking a token is: ```POST https://app.asana.com/-/oauth_revoke```

### Request

```POST https://app.asana.com/-/token_info``` with standard form-encoded request body:

Request Body Parameter / Description
token (require): Token string for an OAuth access or refresh token, personal access token, or service account token

### Response
The response is similar to the token exchange endpoint:

```json
{
    "token_type": "bearer",
    "expires_in": 315359969,
    "exp": 2069346816,
    "scope": "tasks:read tasks:write projects:read projects:write openid email profile",
    "active": true
}
```

Details of each property:

Property/Description:
```token_type```	The type of tokenbearer (OAuth access token, personal access token, or service account) or refresh (OAuth refresh token)
```expires_in```	The number of seconds that the token is valid. OAuth access tokens expire in 1 hour (3600 seconds)
```exp```	The unix timestamp (integer timestamp, number of seconds since January 1, 1970 UTC) indicating when this token will expire.
```scope```	A JSON string containing a space-separated list of scopes associated with this token.
```active```	Boolean indicating whether or not the token is still valid. false if the token has expired or been revoked / deauthorized.
```client_id```	Associated OAuth app / client id. This is returned only for OAuth access tokens and OAuth refresh tokens

### Security considerations

#### PKCE OAuth extension

PKCE (proof key for code exchange) proves the app that started the authorization flow is the same app that finishes the flow. You can read more about it here: Protecting Apps with PKCE.

In short, the process is as follows:
    1. Whenever a user wants to OAuth with Asana, your app server should generate a random string called the code_verifier. This string should be saved to the user, since every code_verifier should be unique per user. This should stay in the app server and only be sent to the token exchange endpoint.
    2. Your app server will hash the code_verifier with SHA256 to get a string called the code_challenge. Your server will give the browser only the code_challenge & code_challenge_method. The code_challenge_method should be the string "S256" to tell Asana we hashed with SHA256. More specifically, code_challenge = BASE64URL-ENCODE(SHA256(ASCII(code_verifier))).
    3. The browser includes code_challenge & code_challenge_method when redirecting to the user authorization endpoint:

---
Asana uses OAuth 2.0 for secure user authorization. Scopes allow your app to request only the access it needs, following the principle of least privilege. That is, OAuth scopes define which parts of the Asana API your app can access. This helps users trust your app and ensures their data is protected.


### List of OAuth scopes

There are manThe following tables show the currently available set of OAuth scopes (subject to revision) and the corresponding API endpoints they enable. Each scope follows the documented <resource>:<action> format. For additional details on each API endpoint, visit the API reference.

### Attachments

Scope / Endpoints   

```attachments:delete```	DELETE /attachments/{attachment_gid}
```attachments:read```	  GET /attachments/{attachment_gid} 
                          GET /attachments
```attachments:write```	  POST /attachments

### Custom Fields
```custom_fields:read```  GET /custom_fields/{custom_field_gid}, GET /workspaces/{workspace_gid}/custom_fields
```custom_fields:write``` POST /custom_fields, PUT /custom_fields/{custom_field_gid}, POST /custom_fields/{custom_field_gid}/enum_options, POST /custom_fields/{custom_field_gid}/enum_options/insert, PUT /enum_options/{enum_option_gid}

### Goals
```goals:read```          GET /goals/{goal_gid}, GET /goals, GET /goals/{goal_gid}/parentGoals

### Portfolios
```portfolios:read```     GET /portfolios, GET /portfolios/{portfolio_gid}, GET /portfolios/{portfolio_gid}/items
```portfolios:write```    POST /portfolios, PUT /portfolios/{portfolio_gid}, POST /portfolios/{portfolio_gid}/addItem, POST /portfolios/{portfolio_gid}/removeItem, POST /portfolios/{portfolio_gid}/addCustomFieldSetting, POST /portfolios/{portfolio_gid}/removeCustomFieldSetting

### Project Templates
```project_templates:read``` 	GET /project_templates/{project_template_gid}, GET /project_templates, GET /teams/{team_gid}/project_templates

### Projects
```projects:delete```      DELETE /projects/{project_gid}
```projects:read```        GET /projects, GET /projects/{project_gid}, GET /tasks/{task_gid}/projects, GET /teams/{team_gid}/projects, GET /workspaces/{workspace_gid}/projects, GET /projects/{project_gid}/task_counts
```projects:write```       GET /projects/{project_gid}/task_counts, POST /projects, PUT /projects/{project_gid}, POST /projects/{project_gid}/duplicate, POST /teams/{team_gid}/projects, POST /workspaces/{workspace_gid}/projects, POST /projects/{project_gid}/addCustomFieldSetting, POST /projects/{project_gid}/removeCustomFieldSetting

### Stories
```stories:read```         	GET /stories/{story_gid}, GET /tasks/{task_gid}/stories
```stories:write```         PUT /stories/{story_gid}, POST /tasks/{task_gid}/stories

### Tags
```tags:read```             GET /tags, GET /tags/{tag_gid}, GET /tasks/{task_gid}/tags, GET /workspaces/{workspace_gid}/tags
```tags:write```            POST /tags, PUT /tags/{tag_gid}, POST /workspaces/{workspace_gid}/tags

### Task templates
```task_templates:read```   GET /task_templates, GET /task_templates/{task_template_gid}

### Tasks
```tasks:delete```          DELETE /tasks/{task_gid}
```tasks:read```            GET /tasks, GET /tasks/{task_gid}
                            GET /projects/{project_gid}/tasks
                            GET /sections/{section_gid}/tasks
                            GET /tags/{tag_gid}/tasks
                            GET /user_task_lists/{user_task_list_gid}/tasks
                            GET /tasks/{task_gid}/subtasks
                            GET /tasks/{task_gid}/dependencies
                            GET /tasks/{task_gid}/dependents
                            GET /workspaces/{workspace_gid}/tasks/custom_id/{custom_id}
                            GET /workspaces/{workspace_gid}/tasks/search
                            GET /user_task_lists/{user_task_list_gid}
                            GET /users/{user_gid}/user_task_list
```tasks:write```           POST /sections/{section_gid}/addTask
                            POST /tasks
                            PUT /tasks/{task_gid}
                            POST /tasks/{task_gid}/duplicate
                            POST /tasks/{task_gid}/subtasks
                            POST /tasks/{task_gid}/setParent
                            POST /tasks/{task_gid}/addDependencies
                            POST /tasks/{task_gid}/removeDependencies
                            POST /tasks/{task_gid}/addDependents
                            POST /tasks/{task_gid}/removeDependents
                            POST /tasks/{task_gid}/addProject
                            POST /tasks/{task_gid}/removeProject
                            POST /tasks/{task_gid}/addTag
                            POST /tasks/{task_gid}/removeTag
                            POST /tasks/{task_gid}/addFollowers
                            POST /tasks/{task_gid}/removeFollowers

### Team memberships
```team_memberships:read``` GET /team_memberships/{team_membership_gid}
                            GET /team_memberships
                            GET /teams/{team_gid}/team_memberships
                            GET /users/{user_gid}/team_memberships

### Teams
```teams:read```            GET /teams/{team_gid}
                            GET /workspaces/{workspace_gid}/teams
                            GET /users/{user_gid}/teams

### Typeahead
```workspace.typeahead:read``` 	GET /workspaces/{workspace_gid}/typeahead

### Users
```users:read```            GET /users
                            GET /users/{user_gid}
                            GET /users/{user_gid}/favorites
                            GET /teams/{team_gid}/users
                            GET /workspaces/{workspace_gid}/users

### Webhooks
```webhooks:delete```	      DELETE /webhooks/{webhook_gid}
```webhooks:read```         GET /webhooks
                            GET /webhooks/{webhook_gid} 
```webhooks:write```        POST /webhooks
                            PUT /webhooks/{webhook_gid}

### Workspaces
```workspaces:read```       GET /workspaces
                            GET /workspaces/{workspace_gid}

---

## Create a task (POST and API endpoint: https://app.asana.com/api/1.0/tasks)

Required scope: ```tasks:write```

Creating a new task is as easy as POSTing to the ```/tasks``` endpoint with a
data block containing the fields you’d like to set on the task. Any
unspecified fields will take on default values.

Every task is required to be created in a specific workspace, and this
workspace cannot be changed once set. The workspace need not be set
explicitly if you specify ```projects``` or a ```parent``` task instead.

https://developers.asana.com/reference/getprojects 

### Body params
Params this API endpoints to create a task in Asana

```name```: string
```resource_subtype```: string
```approval_status```: string
```assignee_status```: string
```completed```: boolean
```done_at```: date-time | null
```due_on```: date | null
```external```: object
  OAuth Required. Conditional. This field is returned only if external values are set or included by using [Opt In] (/docs/inputoutput-options).
  The external field allows you to store app-specific metadata on tasks, including a gid that can be used to retrieve tasks and a data blob that can store app-specific character strings. Note that you will need to authenticate with Oauth to access or modify this data. Once an external gid is set, you can use the notation external:custom_gid to reference your object anywhere in the API where you may use the original object gid. See the page on Custom External Data for more details.
  ```gid```: string
  ```data```: string
```html_notes```: string
```liked```: boolean
```notes```: string
```start_at```: date-time | null
```start_on```: date | null
```asignee```: string | null
```asssignee_section```: string | null
```custom_fields```: object
  An object where each key is the GID of a custom field and its corresponding value is either an enum GID, string, number, object, or array (depending on the custom field type). See the custom fields guide for details on creating and updating custom field values.
```followers```: array of strings
```parent```: string | null
  Gid of a task.
```projects```: array of strings
  Create-Only Array of project gids. In order to change projects on an existing task use ```addProject``` and ```removeProject```.
```tags```: array of strings
  Create-Only Array of tag gids. In order to change tags on an existing task use ```addTag``` and ```removeTag```.
```workspace```: string
  Gid of a workspace.
```custom_type```: string | null
  GID or globally-unique identifier of a custom_type.
```custom_type_status_option```: string | null
  GID or globally-unique identifier of a custom_type_status_option

### Example of a CODE 200 response
```json
{
  "data": {
    "gid": "12345",
    "resource_type": "task",
    "name": "Bug Task",
    "resource_subtype": "default_task",
    "created_by": {
      "gid": "1111",
      "resource_type": "user"
    },
    "approval_status": "pending",
    "assignee_status": "upcoming",
    "completed": false,
    "completed_at": "2012-02-22T02:06:58.147Z",
    "completed_by": {
      "gid": "12345",
      "resource_type": "user",
      "name": "Greg Sanchez"
    },
    "created_at": "2012-02-22T02:06:58.147Z",
    "dependencies": [
      {
        "gid": "12345",
        "resource_type": "task"
      }
    ],
    "dependents": [
      {
        "gid": "12345",
        "resource_type": "task"
      }
    ],
    "due_at": "2019-09-15T02:06:58.147Z",
    "due_on": "2019-09-15",
    "external": {
      "gid": "my_gid",
      "data": "A blob of information"
    },
    "html_notes": "<body>Mittens <em>really</em> likes the stuff from Humboldt.</body>",
    "hearted": true,
    "hearts": [
      {
        "gid": "12345",
        "user": {
          "gid": "12345",
          "resource_type": "user",
          "name": "Greg Sanchez"
        }
      }
    ],
    "is_rendered_as_separator": false,
    "liked": true,
    "likes": [
      {
        "gid": "12345",
        "user": {
          "gid": "12345",
          "resource_type": "user",
          "name": "Greg Sanchez"
        }
      }
    ],
    "memberships": [
      {
        "project": {
          "gid": "12345",
          "resource_type": "project",
          "name": "Stuff to buy"
        },
        "section": {
          "gid": "12345",
          "resource_type": "section",
          "name": "Next Actions"
        }
      }
    ],
    "modified_at": "2012-02-22T02:06:58.147Z",
    "notes": "Mittens really likes the stuff from Humboldt.",
    "num_hearts": 5,
    "num_likes": 5,
    "num_subtasks": 3,
    "start_at": "2019-09-14T02:06:58.147Z",
    "start_on": "2019-09-14",
    "actual_time_minutes": 200,
    "assignee": {
      "gid": "12345",
      "resource_type": "user",
      "name": "Greg Sanchez"
    },
    "assignee_section": {
      "gid": "12345",
      "resource_type": "section",
      "name": "Next Actions"
    },
    "custom_fields": [
      {
        "gid": "12345",
        "resource_type": "custom_field",
        "name": "Status",
        "type": "text",
        "enum_options": [
          {
            "gid": "12345",
            "resource_type": "enum_option",
            "name": "Low",
            "enabled": true,
            "color": "blue"
          }
        ],
        "enabled": true,
        "representation_type": "number",
        "id_prefix": "ID",
        "is_formula_field": false,
        "date_value": {
          "date": "2024-08-23",
          "date_time": "2024-08-23T22:00:00.000Z"
        },
        "enum_value": {
          "gid": "12345",
          "resource_type": "enum_option",
          "name": "Low",
          "enabled": true,
          "color": "blue"
        },
        "multi_enum_values": [
          {
            "gid": "12345",
            "resource_type": "enum_option",
            "name": "Low",
            "enabled": true,
            "color": "blue"
          }
        ],
        "number_value": 5.2,
        "text_value": "Some Value",
        "display_value": "blue",
        "description": "Development team priority",
        "precision": 2,
        "format": "custom",
        "currency_code": "EUR",
        "custom_label": "gold pieces",
        "custom_label_position": "suffix",
        "is_global_to_workspace": true,
        "has_notifications_enabled": true,
        "asana_created_field": "priority",
        "is_value_read_only": false,
        "created_by": {
          "gid": "12345",
          "resource_type": "user",
          "name": "Greg Sanchez"
        },
        "people_value": [
          {
            "gid": "12345",
            "resource_type": "user",
            "name": "Greg Sanchez"
          }
        ],
        "privacy_setting": "public_with_guests",
        "default_access_level": "user",
        "resource_subtype": "text"
      }
    ],
    "custom_type": {
      "gid": "12345",
      "resource_type": "custom_type",
      "name": "Bug ticket"
    },
    "custom_type_status_option": {
      "gid": "12345",
      "resource_type": "custom_type_status_option",
      "name": "Solution pending"
    },
    "followers": [
      {
        "gid": "12345",
        "resource_type": "user",
        "name": "Greg Sanchez"
      }
    ],
    "parent": {
      "gid": "12345",
      "resource_type": "task",
      "name": "Bug Task",
      "resource_subtype": "default_task",
      "created_by": {
        "gid": "1111",
        "resource_type": "user"
      }
    },
    "projects": [
      {
        "gid": "12345",
        "resource_type": "project",
        "name": "Stuff to buy"
      }
    ],
    "tags": [
      {
        "gid": "59746",
        "name": "Grade A"
      }
    ],
    "workspace": {
      "gid": "12345",
      "resource_type": "workspace",
      "name": "My Company Workspace"
    },
    "permalink_url": "https://app.asana.com/1/12345/task/123456789"
  }
}
```
### Javascript Code Example
```javascript
const options = {
  method: 'POST',
  headers: {accept: 'application/json', 'content-type': 'application/json'}
};

fetch('https://app.asana.com/api/1.0/tasks', options)
  .then(res => res.json())
  .then(res => console.log(res))
  .catch(err => console.error(err));
```

---

# Get multiple projects (GET and API endpoint: https://app.asana.com/api/1.0/projects)

Required scope: ```projects:read```

Returns the compact project records for some filtered set of projects. Use one or more of the parameters provided to filter the projects returned.

🚧
Deprecation notice: cross-workspace access changing

This endpoint is currently undergoing a deprecation related to cross-workspace access. Starting June 2025, this behavior is opt-out by default. We recommend reviewing the planned changes and adjusting your integration if needed. You can learn more in the forum announcement.

### Query Params
```limit```: integer (1-100)
```offset```: string 
```worksapce```: string
```team```: string
```archived```: boolean
```opt_fields```: array of strings

### Example of a CODE 200 response
```json
{
  "data": [
    {
      "gid": "12345",
      "resource_type": "project",
      "name": "Stuff to buy"
    }
  ],
  "next_page": {
    "offset": "eyJ0eXAiOJiKV1iQLCJhbGciOiJIUzI1NiJ9",
    "path": "/tasks/12345/attachments?limit=2&offset=eyJ0eXAiOJiKV1iQLCJhbGciOiJIUzI1NiJ9",
    "uri": "https://app.asana.com/api/1.0/tasks/12345/attachments?limit=2&offset=eyJ0eXAiOJiKV1iQLCJhbGciOiJIUzI1NiJ9"
  }
}
```

### JavaScript Code Example

```javascript
const options = {method: 'GET', headers: {accept: 'application/json'}};

fetch('https://app.asana.com/api/1.0/projects', options)
  .then(res => res.json())
  .then(res => console.log(res))
  .catch(err => console.error(err));
```