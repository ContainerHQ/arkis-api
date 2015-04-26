# Docker Proxy
[![Circle CI](https://circleci.com/gh/foliea/docker-proxy.svg?style=svg)](https://circleci.com/gh/foliea/docker-proxy)

Docker remote API Proxy.

This project aims to be fully compatible with Docker API,
and then with Docker Swarm API.

This means also that Docker CLI is able to work nicely with this
proxy.

**This project is at an early development stage. Don't use it in
production.**

## Missing Endpoints

Some endpoints have not yet been implemented and will return a 404 error:

```
GET  "/containers/(id)/attach/ws"
GET  "/images/get"
```

Known issues:
```
* Containers attach and exec start are working only on tcp upgrade.
```

## Author

**Adrien Folie**

* http://twitter.com/folieadrien
* http://github.com/foliea

## Licensing

docker-proxy is licensed under the MIT License. See [LICENSE](LICENSE) for full
license text.
