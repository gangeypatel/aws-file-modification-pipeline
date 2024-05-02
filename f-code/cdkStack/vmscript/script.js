const inputArgs = process.argv;
const reqId = inputArgs[2];
const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-2" });
const fs = require('fs');
const tableName = "fovus-data"
const s3BucketName = "fovus-txt-3"


AWS.config.update({
    accessKeyId: '<Your-access-key>',
    secretAccessKey: '<your-secret-access-key>'
});
console.log("Request received: " + reqId);

const dynamoDB = new AWS.DynamoDB({ apiVersion: "2012-08-10" });
const dbClient = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

const getParams = {
    TableName: tableName,
    Key: {
      id: {"S": reqId },
    },
};

dynamoDB.getItem(getParams, function (err, data) {
    if (err) {
        console.log("Error", err);
    } else {
        console.log("Data Fetched Successfully from DynamoDB");
        const ddbResponse = data.Item;
        const s3filePath = ddbResponse.input_file_path.S.split("/")[1]
        const localFilePath = './' + s3filePath;
        var content;
        const s3GetParams = {
            Bucket: s3BucketName, 
            Key: s3filePath
        };
        s3.getObject(s3GetParams, function(err, data) {
            if (err) console.log(err, err.stack);
            else {
                content = new Buffer(data.Body).toString("utf8");
                content = content + ' : ' + ddbResponse.input_text.S;

                fs.appendFile(localFilePath, content, function (err) {
                    if (err) throw err;
                    console.log('Content Appended!');
                });
                
                const outputFileName = s3filePath + '-output.txt';
                const updateParams = {
                    TableName: tableName,
                    Key: {
                        "id": reqId
                    },
                    UpdateExpression: "set output_file_path = :path",
                    ExpressionAttributeValues: {
                        ":path": s3BucketName + "/" + outputFileName,
                    },
                };
                dbClient.update(updateParams, function(err, data) {
                    if (err) 
                        console.log(err);
                    else {
                        console.log("Sucessfully updated the document");
                    }
                });

                const putParams = {
                    Body: content,
                    Bucket: s3BucketName, 
                    Key: outputFileName,
                };
                s3.putObject(putParams, function(err, data) {
                    if (err) 
                        console.log(err, err.stack);
                    else {
                        console.log("Successfully Uploaded to S3 Bucket");
                    }
                })
                
            }
        });
    }
});