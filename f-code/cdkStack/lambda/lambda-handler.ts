const AWS = require("aws-sdk");
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME || '';

export const handler = async (event) => {
  try {
    console.log("LOG: EVENT RECEIVED");
    const body = JSON.parse(event.body || '{}');
    const { textInput, filePath, randomId } = body;

    await dynamoDb.put({
      TableName: TABLE_NAME,
      Item: { id: randomId, input_text: textInput, input_file_path: filePath },
    }).promise()

    return { 
      statusCode: 200, 
      body: JSON.stringify({ message: 'Data saved' }) 
      
    };
  } catch (error) {
    console.error(error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: 'Internal server error' }) 
      
    };
  }
};