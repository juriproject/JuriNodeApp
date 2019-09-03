#!/bin/sh

export $(egrep -v '^#' awsDnsNames.env | xargs)

index=4

HOST="NODE$index"

ssh -i "../JuriNodes.pem" "ubuntu@${!HOST}" git clone https://github.com/juriproject/JuriNodeApp.git
ssh -i "../JuriNodes.pem" "ubuntu@${!HOST}" sudo apt-get update
ssh -i "../JuriNodes.pem" "ubuntu@${!HOST}" sudo apt-get install -y build-essential
ssh -i "../JuriNodes.pem" "ubuntu@${!HOST}" 'curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -'
ssh -i "../JuriNodes.pem" "ubuntu@${!HOST}" sudo apt-get install -y nodejs
ssh -i "../JuriNodes.pem" "ubuntu@${!HOST}" sudo npm install -g web3 --unsafe-perm=true --allow-root
ssh -i "../JuriNodes.pem" "ubuntu@${!HOST}" 'cd JuriNodeApp && npm install'