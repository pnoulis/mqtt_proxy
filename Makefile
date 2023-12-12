#!/usr/bin/make

# Make and Shell behavior
SHELL = /usr/bin/bash
.ONESHELL:
.EXPORT_ALL_VARIABLES:
.DELETE_ON_ERROR:
.DEFAULT_GOAL := all

# Critical Paths
SRCDIR := .
BUILDIR := $(SRCDIR)/build
DISTDIR := $(SRCDIR)/dist

# Programs
NODE = node
BUNDLER = $(SRCDIR)/node_modules/.bin/esbuild

all: build

build: | $(DISTDIR)
	rm -rf $(DISTDIR)/*
	$(BUNDLER) src/index.js --bundle \
	--platform=neutral \
	--target=esnext \
	--minify \
	--outfile=$(DISTDIR)/mqtt-proxy.js

$(DISTDIR):
	mkdir -p $@

.PHONY: build
.PHONY: all
