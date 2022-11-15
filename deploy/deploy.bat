set ip=192.168.87.37

docker save ultimatecharadesfrontend:latest > ./ultimatecharadesfrontend.tar
@REM docker save ultimatecharadesbackend:latest > ./ultimatecharadesbackend.tar

scp ultimatecharadesfrontend.tar g3tech@%ip%:\Users\g3tech\Server\UltimateCharades
@REM scp ultimatecharadesbackend.tar g3tech@%ip%:\Users\g3tech\Server\UltimateCharades

scp docker-compose.yml g3tech@%ip%:\Users\g3tech\Server\UltimateCharades
scp deploy/remoteDeploy.bat g3tech@%ip%:\Users\g3tech\Server\UltimateCharades

ssh g3tech@%ip% \Users\g3tech\Server\UltimateCharades\remoteDeploy.bat