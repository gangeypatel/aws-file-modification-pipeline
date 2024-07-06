import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as iam from '@aws-cdk/aws-iam';
import * as s3 from '@aws-cdk/aws-s3'
import * as ec2 from '@aws-cdk/aws-ec2';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import path from 'path';


export class CdkStackStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
      

    const bucket_name = 'app-txt-3'
    // });
    const corsRule = {
      allowedMethods: [s3.HttpMethods.GET,s3.HttpMethods.POST,s3.HttpMethods.PUT,s3.HttpMethods.DELETE],
      allowedOrigins: ['*'],
      allowedHeaders: ['*'],
      exposedHeaders: [],
    };

    
    //s3 bucket
    const bucket = new s3.Bucket(this,'app-bucket',{
      bucketName: bucket_name,
      blockPublicAccess : s3.BlockPublicAccess.BLOCK_ALL,
      versioned: false,
      accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
      cors:[corsRule],
        });
   
    const policy = new iam.PolicyStatement({
      sid: "PublicListGet",
      effect: iam.Effect.DENY,
      actions: ['s3:DeleteBucket'],
      resources: [bucket.arnForObjects('*') , bucket.bucketArn],
      principals: [new iam.StarPrincipal()],
    });

    bucket.addToResourcePolicy(policy)


    //dynamoDB
    //dynamoDB
    const table = new dynamodb.Table(this, 'app-data', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      tableName: 'app-data',
      stream: dynamodb.StreamViewType.NEW_IMAGE,
    });

    //Lambda Function to handle API requests and save data to dynamoDB
    const ApiHandler = new NodejsFunction(this, 'lambda-api-handler', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/lambda-handler.ts'), 
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    table.grantWriteData(ApiHandler);

    //Lambda Function to handle DynamoDB stream and create EC2 instance
    const EC2Creation = new NodejsFunction(this, 'lambda-dynamo-handler', {
      runtime: lambda.Runtime.NODEJS_16_X, 
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/lambda-VM.ts'),
      retryAttempts: 1
    });

    EC2Creation.addToRolePolicy(iam.PolicyStatement.fromJson({
      // Effect: "Allow",
      Action: "ec2:RunInstances",
      Resource: [
        'arn:aws:ec2:us-east-2:<your-account-id>:instance/*',
        'arn:aws:ec2:us-east-2:<your-account-id>:key-pair/*',
        'arn:aws:ec2:us-east-2:<your-account-id>:image/*',
        'arn:aws:ec2:us-east-2:<your-account-id>:network-interface/*',
        'arn:aws:ec2:us-east-2:<your-account-id>:security-group/*',
        'arn:aws:ec2:us-east-2:<your-account-id>:subnet/*',
        'arn:aws:ec2:us-east-2:<your-account-id>:volume/*',
        'arn:aws:ec2:us-east-2:<your-account-id>:snapshot/*',
        'arn:aws:ec2:us-east-2::image/ami-0900fe555666598a2'
      ],
    }));

    EC2Creation.addToRolePolicy(iam.PolicyStatement.fromJson({
      // Effect: "Allow",
      Action: "dynamodb:GetItem",
      Resource: [
        'arn:aws:dynamodb:us-east-2:<your-account-id>:table/*'
      ],
    }));


    //granting lambda-dynamo-handler DynamoDB stream read permission.
    table.grantStreamRead(EC2Creation);

    EC2Creation.addEventSourceMapping('MyMapping', {
      eventSourceArn: table.tableStreamArn,
      startingPosition: lambda.StartingPosition.LATEST,
    });


    //API-Gateway creation for triggering lambda-dynamo-handler
    const api = new apigateway.RestApi(this, 'app-api', {
      restApiName: 'app-api',
      description: 'API service for interacting with DynamoDB.',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
      
    });

    //integrating lambda to be triggered by API-Gateway
    const lambdaIntegration = new apigateway.LambdaIntegration(ApiHandler, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' }
    });

    api.root.addMethod('POST', lambdaIntegration, {
      methodResponses: [
        { statusCode: '200' },
        { statusCode: '500' }
      ]
    }); 

    //Print API URL to console for the updation
    new cdk.CfnOutput(this, 'apiURL', {
      value: api.url,
    });
  }
}
