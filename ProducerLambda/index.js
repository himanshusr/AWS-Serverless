const { SQS } = require("aws-sdk");
const Backoff = require('./backoff.js');
const sqs = new SQS();
const QUEUE_URL = `https://sqs.ap-south-1.amazonaws.com/184987628782/Temp`;


exports.handler = async (event) => {
  let statusCode = 200;
  let message;

  try {
    // send messages in the batch of 10 with exponential backoff
    await sqs.sendMessageBatch({ Entries: createBatchEntries(), QueueUrl: QUEUE_URL }).promise()
    message = `Messages sent in bulk! ${new Date()}`;
  } catch (error) {
    console.log(error);
    message = error;
    statusCode = 500;
  }

  return {
    statusCode,
    body: JSON.stringify({
      message,
    }),
  };
};

const createBatchEntries = () => {
  let entries = [];
  // Create messages with exponential backoff
  for (let i = 0; i < 10; i++) {
    console.log('Here is the backoff: ', Backoff(i));
    entries.push({
      Id: parseInt(Math.random() * 100000).toString(),
      MessageBody: Math.random().toString(),
      DelaySeconds: Backoff(i),
      MessageAttributes: {
        retryCount: {
          DataType: "String",
          StringValue: "1"
        }
      }
    })
  }
  return entries;
}
