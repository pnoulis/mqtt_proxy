#!/usr/bin/make

# Make and Shell behavior
SHELL = /usr/bin/bash
.DELETE_ON_ERROR:
.DEFAULT_GOAL := all

# Critical Paths
SRCDIR := .
LOGDIR := var/log
BUILDIR := $(SRCDIR)/build
DISTDIR := $(SRCDIR)/dist
# Monorepo dirs
AGENT_FACTORY := $(SRCDIR)/../..
SHARED := $(AGENT_FACTORY)/shared
# preset environment dirs
ENVDIRS = $(SHARED)/env $(SRCDIR)/config/env $(SRCDIR)

# Programs
INSTALL = /usr/bin/install
MKDIRP = /usr/bin/mkdir -p
CP = /usr/bin/cp
RM = /usr/bin/rm
CHMOD = /usr/bin/chmod
INTERPRETER = node
BUNDLER = npx vite
TESTER = npx vitest
LINTER = npx eslint
FORMATER = npx prettier
DOTENV = ~/bin/dotenv
PRETTY_OUTPUT = npx pino-pretty

.PHONY: all
all: build

# ------------------------------ RUN ------------------------------ #
.PHONY: run
run: mode ?= development
run: env
run: file ?= ./tmp/scratch.js
run:
	@if test -z "$(file)"; then echo \
	"make run missing params: -> params=./file make run"; \
	exit 1; \
	fi
	set -a; source ./.env && \
	$(INTERPRETER) $(file) \
	| $(PRETTY_OUTPUT)

.PHONY: scratch
scratch: mode ?= development
scratch: env
	set -a; source ./.env && \
	$(INTERPRETER) ./tmp/scratch.js \
	| $(PRETTY_OUTPUT)

.PHONY: run-build
run-build:
	@set -a; source ./.env && \
	$(INTERPRETER) ./dist/index.js \
	| $(PRETTY_OUTPUT)

# ------------------------------ DEV ------------------------------ #
.PHONY: dev

dev: mode ?= development
dev: env
	set -a; source ./.env && \
	$(BUNDLER) server --mode=$(mode)

# ------------------------------ BUILD ------------------------------ #
.PHONY: build

build: mode ?= production
build: env
	set -a; source ./.env && \
	$(BUNDLER) build --mode=$(mode)

# ------------------------------ TEST ------------------------------ #
.PHONY: test

test: mode ?= production
test: env
test: suite ?= *
test:
	set -a; source ./.env && \
	$(TESTER) run --reporter verbose --mode=$(mode) $(suite)

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
env: mode ?= production
env:
	$(DOTENV) --mode=$(mode) $(ENVDIRS) > $(SRCDIR)/.env
