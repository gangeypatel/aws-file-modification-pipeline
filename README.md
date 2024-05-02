
# Implementation 

## Step 1 setttting up IAM User
Make IAM user in console, generate keys for the user and grant the user these permissions.

```bash
  AmazonAPIGatewayAdministratior
  AmazonAPIGatewayInvokeFullAccess
  AmazonDynamoDBFullAccess
  AmazonEC2ContainerRegistryFullAccess
  AmazonEC2FullAccess
  AmazonS3FullAccess
  AmazonSSMFullAccess
  AmazonCloudFormationFullAccess
  AWSLambda_FullAccess
  IAMFullAccess
```
Then going to the console, generate Access key ID and Secret access Key and download in CSV file, that will be later used for the configuration of environment.

## Step 2 Making S3 bucket
I am making S3 Bucket Manually. Go to the Aws S3 console, create new S3 bucket 'MyBucket'.
update the Bucket Policy to this
```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicListGet",
            "Effect": "Allow",
            "Principal": "*",
            "Action": [
                "s3:List*",
                "s3:Get*"
            ],
            "Resource": [
                "arn:aws:s3:::fovus-code-txt-1",
                "arn:aws:s3:::fovus-code-txt-1/*"
            ]
        }
    ]
}
```
update the CORS 
```
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "PUT",
            "POST",
            "DELETE",
            "GET"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": []
    }
]
```
Next add the s3-table-name to following locations.
| FileName | Line     | Description                |
| :-------- | :------- | :------------------------- |
| `FormPage.jsx` | `10` | to add file to s3 bucket|
| `script.js` | `7` | to add output file in s3 bucket |
| `lambda-VM.ts` | `38` | to fetch script.js from the bucket |


## step 3 Setting up Keys:
config your AWS account by running this commands:
```bash
aws config
AWS Access Key : accesskey
AWS Secret Access Key : secretkey
Default region Name : 'us-east-2'
Default output format : JSON

```

#### Or
Update the keys in the following files:

| FileName | Line     | Description                |
| :-------- | :------- | :------------------------- |
| `FormPage.jsx` | `14,15` | Your Keys|
| `script.js` | `11,12` | Your Keys |

## Folder Structure
here is the folder structure to understand the folders of the 
```bash
  f-code
    |_cdkStack
        |_lib
        |_bin
        |_lambda
            lambda-handler.ts
            lambda-VM.ts
        |_vmscripts
            script.js
    |_public
    |_src
        |_compos
            NavBar.jsx
            FormPage.jsx
        |_App.js
        |_index.css
        |_index.js
    |_node_modules
```
Our cdkStack is the folder for deploying the cdk-stack.
#### FrontEnd
    1.FormPage.jsx file for the form submission, sending API request to the API-Gateway to trigger lambda function.

#### CDK stack 
    
    1.cdk-stack_stack.ts is the main cdk file to initialize all the services.
    2.lambda-handler.ts is the lambda to add data to dynamodb triggered by API gateway
    3.lambda_VM.ts is the lambda to start EC2 instance triggred by DynamoDB event stream
    4.script.js is the script file which runs in the EC2 VM that generates the output.txt file.


## Step 4 Deploying the stack

Go to the f-code folder in cli by running this command
```
cd ../path/f-code
```
run " npm i " to install all dependencies.

go to the cdkStack folder.
```
cd ../path/f-code/cdkStack

```
run "npm i" to install all dependencies.

Before deploying the stack, generate the key-pair to launch the EC2 instance by running this command
```
aws ec2 create-key-pair --key-name MyKeyPair --query 'KeyMaterial' --output text > MyKeyPair.pem

``` 

Update the keyName in the following file:

| FileName | Line     | paremeter                |
| :-------- | :------- | :------------------------- |
| `lambda-VM.ts` | `28` | MyKeyPair|


before bootstrapping the stack, update the AWS account no. in the following files for the resources for lambda functions.
| FileName | Line     | paremeter                |
| :-------- | :------- | :------------------------- |
| `cdk_stack-stack.ts` | `47 to 55` | AWS Account No. in the link|
| `cdk_stack-stack.ts` | `63` | AWS Account No. in the link|


then for bootstrapping out stack to our AWS account, run the following command.

```
cdk bootstrap

```
if it thorws error, go to the /bin/cdk_stack.ts file and under the env directory, add account name and region. That should bootstrap the stack to the environment.

after bootstrapping the stack, run  
```
cdk Synth 
```
This command will check if the stack is ready to be deployed or not.
After getting successful Output, run

```
cdk deploy
```
This command should deploy the stack to cloud formation and initialize all the services to be used. 

now copy the apiURL link from the terminal and paste it in the FormPage.jsx File line no. 

That's the api-gateway thet lambda created that will trigger the lambda function.

## Step 5 Finally Using the app 
go to the f-code folder if you're in cdkStack by running...

```
cd ../
```
then to start the react app run..   
```
npm start
```
this should start the react app on [localhost:3000]('localhost:3000')

add the string , upload the file, and press submit, you will get an alert saying " file is uploaded successfully".

Check S3 bucket for th file, check dynamoDB for the data, check EC2 console for the creation of the VM.

wait for some time after the VM is started, check s3 bucket and DynamoDB for the outputs.






## Authors

- Gangey Patel

