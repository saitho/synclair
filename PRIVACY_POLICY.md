# Privacy policy

The application runs on your local machine.
For OAuth2 authentications it will spin up a temporary local webserver.

Using OAuth2 with Zoom requires a valid HTTPS certificate. For that reason, a external service "lcl.ovh":https://lcl.ovh is used for the default Zoom OAuth2 app.
This service will simply redirect the web request from Zoom to the local webserver. The full source code of lcl.ovh is available here for inspection: https://github.com/saitho/lcl

Aside from authenticating with the respective server, the data you enter into the tool is not transferred to any other server than your local machine.
