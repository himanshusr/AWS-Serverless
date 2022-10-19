const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const dynamodbTableName = 'dev-failed-msg';
const jobsPath = '/jobs';

exports.handler = async function(event) {
  console.log('Request event: ', event);
  let response;
  switch(true) {

    case event.httpMethod === 'GET' && event.path === jobsPath:
      response = await getJobs();
      break;
    default:
      response = buildResponse(404, '404 Not Found');
  }
  return response;
}

async function getJobs() {
  const params = {
    TableName: dynamodbTableName
  }
  const allJobs = await scanDynamoRecords(params, []);
  const body = {
    jobs: allJobs
  }
  return buildResponse(200, body);
}

async function scanDynamoRecords(scanParams, itemArray) {
  try {
    const dynamoData = await dynamodb.scan(scanParams).promise();
    itemArray = itemArray.concat(dynamoData.Items);
    if (dynamoData.LastEvaluatedKey) {
      scanParams.ExclusiveStartkey = dynamoData.LastEvaluatedKey;
      return await scanDynamoRecords(scanParams, itemArray);
    }
    return itemArray;
  } catch(error) {
    console.error('Here is the error: ', error);
  }
}


function buildResponse(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }
}