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
BUILDER = npx vite
TESTER = npx vitest
LINTER = npx eslint
FORMATER = npx prettier
PRETTY_OUTPUT = npx pino-pretty
MAKE_ENV = ./scripts/dotenv.sh --pkgdir=. --envdir=./config/env

.PHONY: all
all: build

# ------------------------------ RUN ------------------------------ #
.PHONY: run scratch run-build
run:
	@if test -z "$$params"; then echo \
	"make run missing params: -> params=./file make run"; \
	exit 1; \
	fi
	$(MAKE_ENV) --mode=dev --host=dev
	@set -a; source ./.env && node "$${params}" | $(PRETTY_OUTPUT)

run-scratch:
	$(MAKE_ENV) --mode=dev --host=dev
	set -a; source ./.env && node ./tmp/scratch.js | $(PRETTY_OUTPUT)

run-build:
	set -a; source ./.env && node ./dist/index.js | $(PRETTY_OUTPUT)

# ------------------------------ DEV ------------------------------ #
.PHONY: dev dev-dev dev-staging dev-prod
dev: dev-dev

dev-dev:
	$(MAKE_ENV) --mode=dev --host=dev
	set -a; source ./.env && $(BUILDER) serve --mode=dev

dev-staging: dirs
	$(MAKE_ENV) --mode=staging --host=dev
	set -a; source ./.env && $(BUILDER) serve --mode=staging

dev-prod: dirs
	$(MAKE_ENV) --mode=prod --host=dev
	set -a; source ./.env && $(BUILDER) serve --mode=prod

# ------------------------------ BUILD ------------------------------ #
.PHONY: build build-dev build-staging build-prod
build: build-prod

build-dev:
	$(MAKE_ENV) --mode=dev --host=prod
	set -a; source ./.env && $(BUILDER) build --mode=dev

build-staging:
	$(MAKE_ENV) --mode=staging --host=prod
	set -a; source ./.env && $(BUILDER) build --mode=staging

build-prod:
	$(MAKE_ENV) --mode=prod --host=prod
	set -a; source ./.env && $(BUILDER) build --mode=prod

# ------------------------------ TEST ------------------------------ #
.PHONY: test test-testing test-dev test-staging test-prod
test: test-dev

test-testing:
	$(MAKE_ENV) --mode=testing --host=dev
	set -a; source ./.env && $(TESTER) run --reporter verbose --mode=testing $(params)

test-dev:
	$(MAKE_ENV) --mode=dev --host=dev
	set -a; source ./.env && $(TESTER) run --reporter verbose --mode=dev $(params)

test-staging:
	$(MAKE_ENV) --mode=staging --host=dev
	set -a; source ./.env && $(TESTER) run --reporter verbose --mode=staging $(params)

test-prod:
	$(MAKE_ENV) --mode=prod --host=dev
	set -a; source ./.env && $(TESTER) run --reporter verbose --mode=prod $(params)

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
dirs:
	$(MKDIRP) $(LOGDIR)

.PHONY: env
env:
	$(MAKE_ENV) --mode=$(params)
