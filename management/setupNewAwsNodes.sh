#!/bin/sh

export $(egrep -v '^#' awsDnsNames.env | xargs)

# index=6
# HOST="NODE$index"

for ((index=7; index-1<20; ++index)); do
    HOST="NODE$index"

    ssh -o StrictHostKeyChecking=no -i "../JuriNodes.pem" "ubuntu@${!HOST}" git clone https://github.com/juriproject/JuriNodeApp.git
    ssh -o StrictHostKeyChecking=no -i "../JuriNodes.pem" "ubuntu@${!HOST}" sudo apt-get update
    ssh -o StrictHostKeyChecking=no -i "../JuriNodes.pem" "ubuntu@${!HOST}" sudo apt-get install -y build-essential
    ssh -o StrictHostKeyChecking=no -i "../JuriNodes.pem" "ubuntu@${!HOST}" 'curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -'
    ssh -o StrictHostKeyChecking=no -i "../JuriNodes.pem" "ubuntu@${!HOST}" sudo apt-get install -y nodejs
    ssh -o StrictHostKeyChecking=no -i "../JuriNodes.pem" "ubuntu@${!HOST}" sudo npm install -g web3 --unsafe-perm=true --allow-root
    ssh -o StrictHostKeyChecking=no -i "../JuriNodes.pem" "ubuntu@${!HOST}" 'cd JuriNodeApp && npm install'
done