cd C:/Users/g3tech/Server/UltimateCharades

@REM docker load < UltimateCharadesBackend.tar
docker load < UltimateCharadesFrontend.tar

docker compose down

docker compose up