const AWS = require("aws-sdk");
const ec2Client = new AWS.EC2({region: 'us-east-2'}); 
const dynamoDB = new AWS.DynamoDB({ apiVersion: "2012-08-10" });
const FILE_NAME = 'script.js'
const tableName = "fovus-data";

exports.handler = async (event) => {
    console.log("Event: ", JSON.stringify(event, null, 2));
    const reqId = event.Records[0].dynamodb.Keys.id.S;
    console.log("Handler Invoked: " + reqId);
    try {
        if(event.Records[0].dynamodb.NewImage === undefined) {
            console.log("Duplicate event. Skipping!!");
            return;
        }
        
        // creating instance and running startup commands.
        const filePath = event.Records[0].dynamodb.NewImage.input_file_path.S;
        const fileName = filePath.split("/")[1];
        const outputFile = fileName + "-output.txt";
        console.log("OutputFile Name: " + outputFile);
        const params = {
            ImageId: 'ami-0900fe555666598a2', 
            InstanceType: 't2.micro',
            MinCount: 1,
            MaxCount: 1,
            KeyName: 'ggkeys',
            InstanceInitiatedShutdownBehavior: 'terminate',
            UserData: btoa(
`#!/bin/bash
sudo yum update -y
sudo curl -sL https://rpm.nodesource.com/setup_16.x | bash -
sudo yum install -y nodejs
cd /home/ec2-user/
sudo npm init -y
sudo npm i aws-sdk@^2.1594.0
wget https://fovus-code-txt.s3.us-east-2.amazonaws.com/script.js
sudo node /home/ec2-user/${FILE_NAME} ${reqId}
sleep 10 && sudo shutdown -h now`)
        };
            //Launching instance
            const launchInstance = await ec2Client.runInstances(params).promise();
            console.log("EC2 Instance launched", launchInstance);
    } catch (error) {
        console.error("Error launching EC2 Instance", error);
    }
};