#!/bin/sh

export $(egrep -v '^#' awsDnsNames.env | xargs)

CONTROLLER_PUBLIC_KEY=$1
CONTROLLER_PRIVATE_KEY=$2

echo 'Updating repos...'
ssh -o StrictHostKeyChecking=no -i "../JuriNodes.pem" "ubuntu@${CONTROLLER_NODE}" "cd JuriNodeApp && git pull"
for ((index=1; index-1<${#NODE_LOG_FILES[@]}; ++index)); do
    HOST="NODE$index"
    ssh -o StrictHostKeyChecking=no -i "../JuriNodes.pem" "ubuntu@${!HOST}" "cd JuriNodeApp && git pull"
done
echo 'Updating repos finished!'

ssh -o StrictHostKeyChecking=no -i "../JuriNodes.pem" "ubuntu@${CONTROLLER_NODE}" "CONTROLLER_PUBLIC_KEY=$CONTROLLER_PUBLIC_KEY CONTROLLER_PRIVATE_KEY=$CONTROLLER_PRIVATE_KEY node JuriNodeApp/controllerNode/runInitialSetup.js"