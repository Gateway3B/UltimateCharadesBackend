#!/bin/sh
# Make sure this file has LF line endings and not CRLF line endings so it can run on linux.

cd ~/Documents/G3Tech/Server/UltimateCharades

docker load < ultimatecharadesbackend.tar
docker load < ultimatecharadesfrontend.tar

docker compose down

docker compose up