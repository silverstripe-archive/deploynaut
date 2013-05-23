#!/bin/bash

exec /usr/bin/ssh -i "$IDENT_KEY" "$@"
