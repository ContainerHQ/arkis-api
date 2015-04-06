# Docker Proxy

Docker remote API Proxy.

This project aims to be fully compatible with Docker API,
and then with Docker Swarm API.

This means also that Docker CLI is able to work nicely with this
proxy.

** This project is at an early development stage. Don't use it in
production. **

## Missing Endpoints

Some endpoints have not yet been implemented and will return a 404 error.

```
GET  "/containers/(id)/attach/ws"
POST "/exec/(id)/start"
POST "/build"
POST "/image/load"
POST "/images/(id)/push" (auth failed)
```

Weird behaviors:
```
* Interactive attach seems to leave a ghost container.
* Authentication is not persistent.
```
