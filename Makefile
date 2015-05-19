.PHONY: all re clean build shell test up

compose := docker-compose

all: detach

re: build clean all

clean:
	$(compose) kill
	$(compose) rm --force

build:
	$(compose) build

shell: build
	$(compose) run --service-ports api /bin/bash

test: build
	$(compose) run api npm test

up: build
	$(compose) up api

detach: build
	$(compose) up -d api
