.PHONY: all re fclean clean build shell migrations test up detach

env          := $(if $(NODE_ENV),$(NODE_ENV),'development')
compose-test := docker-compose
compose      := NODE_ENV=$(env) $(compose-test)

all: detach

re: clean fclean build migrations all

fclean:
	$(compose) run api sequelize --env=$(env) db:migrate:undo:all

clean:
	$(compose) kill
	$(compose) rm --force

build:
	$(compose) build

shell: build
	$(compose) run --service-ports api /bin/bash

migrations:
	$(compose) run api sequelize --env=$(env) db:migrate

test: build
	$(compose-test) run api sequelize --env=test db:migrate:undo:all
	$(compose-test) run api sequelize --env=test db:migrate
	$(compose-test) run api npm test

up: build migrations
	$(compose) up

detach:
	$(compose) up -d
