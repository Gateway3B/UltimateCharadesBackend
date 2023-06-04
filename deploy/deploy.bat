set ip=192.168.1.90

docker save ultimatecharadesfrontend:latest > ./ultimatecharadesfrontend.tar
docker save ultimatecharadesbackend:latest > ./ultimatecharadesbackend.tar

scp ultimatecharadesfrontend.tar matthewweisfeld@%ip%:~/Documents/G3Tech/Server/UltimateCharades
scp ultimatecharadesbackend.tar matthewweisfeld@%ip%:~/Documents/G3Tech/Server/UltimateCharades

scp docker-compose.yml matthewweisfeld@%ip%:~/Documents/G3Tech/Server/UltimateCharades
scp deploy/remoteDeploy.sh matthewweisfeld@%ip%:~/Documents/G3Tech/Server/UltimateCharades

ssh matthewweisfeld@%ip% chmod +x /home/matthewweisfeld/Documents/G3Tech/Server/UltimateCharades/remoteDeploy.sh
ssh matthewweisfeld@%ip% /home/matthewweisfeld/Documents/G3Tech/Server/UltimateCharades/remoteDeploy.sh
