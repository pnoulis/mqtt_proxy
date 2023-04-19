#!/usr/bin/make

# Make and Shell behavior
SHELL = /usr/bin/bash
.DELETE_ON_ERROR:
.DEFAULT_GOAL := all

# Critical Paths
LOGDIR=var/log

# Programs
INSTALL = /usr/bin/install
MKDIRP = /usr/bin/mkdir -p
CP = /usr/bin/cp
RM = /usr/bin/rm
CHMOD = /usr/bin/chmod
NODE = npx node
BUILD_SYS = npx vite
LINTER = npx eslint
FORMATER = npx prettier
VITEST = npx vitest
MAKE_ENV = ./scripts/dotenv.sh --pkgdir=. --envdir=./config/env

.PHONY: all
all: run

.PHONY: node-run
node-run:
	@if test -z "$$params"; then echo \
	"make node-exec missing params: -> params=./file make node-exec"; \
	exit 1; \
	fi
	$(MAKE_ENV) --mode=dev --host=dev
	@set -a; source ./.env && $(NODE) "$${params}"

.PHONY: scratch
scratch:
	$(MAKE_ENV) --mode=dev --host=dev
	set -a; source ./.env && $(NODE) ./tmp/scratch.js

# ------------------------------ RUN ------------------------------ #
.PHONY: run run-dev run-staging run-prod
run: run-dev

run-dev:
	$(MAKE_ENV) --mode=dev --host=dev
	set -a; source ./.env && $(NODE) ./src/main.js

run-staging:
	$(MAKE_ENV) --mode=staging --host=dev
	set -a; source ./.env && $(NODE) ./src/main.js

run-prod:
	$(MAKE_ENV) --mode=prod --host=dev
	set -a; source ./.env && $(NODE) ./src/main.js

# ------------------------------ BUILD ------------------------------ #
.PHONY: build build-dev build-staging build-prod
build: build-dev

build-dev:
	$(MAKE_ENV) --mode=dev --host=prod
	set -a; source ./.env && $(BUILD_SYS) build --mode=dev

build-staging:
	$(MAKE_ENV) --mode=staging --host=prod
	set -a; source ./.env && $(BUILD_SYS) build --mode=staging

build-prod:
	$(MAKE_ENV) --mode=prod --host=prod
	set -a; source ./.env && $(BUILD_SYS) build --mode=prod

# ------------------------------ TEST ------------------------------ #
.PHONY: test test-dev test-staging test-prod
test: test-dev

test-dev:
	$(MAKE_ENV) --mode=dev --host=dev
	set -a; source ./.env && $(VITEST) run --reporter verbose --mode=dev

test-staging:
	$(MAKE_ENV) --mode=staging --host=dev
	set -a; source ./.env && $(VITEST) run --reporter verbose --mode=staging

test-prod:
	$(MAKE_ENV) --mode=prod --host=dev
	set -a; source ./.env && $(VITEST) run --reporter verbose --mode=prod

# ------------------------------ LINT ------------------------------ #
.PHONY: lint
lint:
	$(LINTER) --ext js,jsx --fix "$${params:-.}"

.PHONY: lint-check
lint-check:
	$(LINTER) --ext js,jsx "$${params:-.}"

# ------------------------------ FORMAT ------------------------------ #
.PHONY: fmt
fmt:
	$(FORMATER) --write "$${params:-.}"

.PHONY: fmt-check
fmt-check:
	$(FORMATER) --check "$${params:-.}"

# ------------------------------ CLEAN ------------------------------ #
.PHONY: clean distclean
clean:
	rm -rdf dist build

distclean: clean
	rm -rdf node_modules package-lock.json

# ------------------------------ VARIOUS ------------------------------ #
.PHONY: env
env:
	$(MAKE_ENV) $(params)

dirs:
	$(MKDIRP) $(LOGDIR)
