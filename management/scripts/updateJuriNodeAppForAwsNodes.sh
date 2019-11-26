#!/bin/sh

export $(egrep -v '^#' ../../config/awsDnsNames.env | xargs)

CONTROLLER_PUBLIC_KEY=$1
CONTROLLER_PRIVATE_KEY=$2

echo 'Updating repos...'
ssh -o StrictHostKeyChecking=no -i "../../JuriNodes.pem" "ubuntu@${CONTROLLER_NODE}" "cd JuriNodeApp && git pull"
#ssh -o StrictHostKeyChecking=no -i "../../JuriNodes.pem" "ubuntu@${CONTROLLER_NODE}" "cd JuriNodeApp && npm i"

for ((index=1; index-1<20; ++index)); do
    HOST="NODE$index"
    ssh -o StrictHostKeyChecking=no -i "../../JuriNodes.pem" "ubuntu@${!HOST}" "cd JuriNodeApp && git pull"
    # ssh -o StrictHostKeyChecking=no -i "../../JuriNodes.pem" "ubuntu@${!HOST}" "cd JuriNodeApp && npm i"
done
echo 'Updating repos finished!'