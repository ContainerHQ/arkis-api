.PHONY: all re clean build shell test up detach

compose := docker-compose

all: detach

re: clean build all

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
	$(compose) up

detach:
	$(compose) up -d
