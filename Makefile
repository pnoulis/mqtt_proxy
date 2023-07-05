#!/usr/bin/make

# Make and Shell behavior
SHELL = /usr/bin/bash
.DELETE_ON_ERROR:
.DEFAULT_GOAL := all

# Include package information
include ./PACKAGE

# Critical Paths
SRCDIR := .
LOGDIR := var/log
BUILDIR := $(SRCDIR)/build
DISTDIR := $(SRCDIR)/dist
# Monorepo dirs
AGENT_FACTORY := $(SRCDIR)/../..
SHARED := $(AGENT_FACTORY)/shared
# preset environment dirs
ENVDIRS = $(SHARED)/env $(SRCDIR)/config/env $(SRCDIR)/PACKAGE $(SRCDIR)

# Programs
INSTALL = /usr/bin/install
MKDIRP = /usr/bin/mkdir -p
SORT = /usr/bin/sort
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
mode ?= 'development'
file ?= '$(SRCDIR)/tmp/scratch.js'
run: env
	set -a; source ./.env && \
	$(INTERPRETER) $(file) \
	| $(PRETTY_OUTPUT)

.PHONY: scratch
mode ?= 'development'
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
mode ?= 'development'
dev: env
	set -a; source ./.env && \
	$(BUNDLER) server --mode=$(mode)

# ------------------------------ BUILD ------------------------------ #
.PHONY: build
mode ?= 'production'
build: env
	set -a; source ./.env && \
	$(BUNDLER) build --mode=$(mode)

# ------------------------------ TEST ------------------------------ #
.PHONY: test
mode ?= 'testing'
suite ?= '*'
test: env
	set -a; source ./.env && \
	$(TESTER) run --reporter verbose --mode=$(mode) $(suite)

# ------------------------------ LINT ------------------------------ #
.PHONY: lint
file ?= '.'
lint:
	$(LINTER) --ext js,jsx --fix $(file)

.PHONY: lint-check
file ?= '.'
lint-check:
	$(LINTER) --ext js,jsx $(file)

# ------------------------------ FORMAT ------------------------------ #
.PHONY: fmt
file ?= '.'
fmt:
	$(FORMATER) --write $(file)

.PHONY: fmt-check
file ?= '.'
fmt-check:
	$(FORMATER) --check $(file)

# ------------------------------ CLEAN ------------------------------ #
.PHONY: clean distclean
clean:
	rm -rdf dist build

distclean: clean
	rm -rdf node_modules package-lock.json

# ------------------------------ ENV ------------------------------#
.PHONY: env
mode ?= 'production'
env:
	$(DOTENV) --mode=$(mode) $(ENVDIRS) | $(SORT) > $(SRCDIR)/.env

# ------------------------------ VARIOUS ------------------------------ #
