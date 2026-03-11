#!/bin/bash
export GNUPGHOME="/d/Smmplan/.gnupg"
exec /usr/bin/gpg "$@"
