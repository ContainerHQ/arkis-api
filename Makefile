.PHONY: all re clean build shell migrations-test test up detach

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

migrations-test:
	$(compose) run api sequelize --env=test db:migrate

test: build migrations-test
	$(compose) run api npm test

up: build
	$(compose) up

detach:
	$(compose) up -d
