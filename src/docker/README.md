Development running in Docker
cd docker

Build the docker image
./docker-build.sh

Add the hostname in the /etc/hosts file
127.0.1.1 dev.musicng

Start the application
docker stack deploy --compose-file docker-compose.yml musicng-dev

Stop the application
docker stack rm musicng-dev

View the application
http://dev.musicng:4201

See https://mherman.org/blog/dockerizing-an-angular-app/