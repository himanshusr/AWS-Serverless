const AWS = require("aws-sdk");
const sqs = new AWS.SQS();
const Backoff = require('./backoff.js');
const QUEUE_URL = `https://sqs.ap-south-1.amazonaws.com/184987628782/Temp`;
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const tableName = 'dev-failed-msg';


var messageCount = 0;

exports.handler = async (event) => {
	// Counting no of messages
	if (event.Records) {
		messageCount += event.Records.length
	}
	console.log('Message Count: ', messageCount);

	// High Retry List refers to failed messages with retries greater than 3;
	// Low Retry list list refers to successful messages with retries less than equal to 3;

    // --------------------------------THE FLOW-----------------------------------
	// Producer Generates 10 messages (batch size = 10) ---> Consumer listens to the event of 10 messages
	// ---> We filter lists according to the retry attempts ---> Greater than 3 = HighRetryList, Less than 3 = LowRetryList
	// ---> random error -> yes ---> Go to LowRetryList and consume the messages and increment the retry count 
	// ---> No error ---> Delete all the messages from HighRetryList and save them in dynamoDB
	
    
    const highRetryList = event.Records.filter(record => {
		return parseInt(record.messageAttributes.retryCount.stringValue) > 3
	});
	const lowRetryList = event.Records.filter(record => {
		return parseInt(record.messageAttributes.retryCount.stringValue) <= 3
	});

	console.log("highRetryList: ", JSON.stringify(highRetryList));
	console.log("lowRetryList: ", JSON.stringify(lowRetryList));

	//remove the messages with retryCount > 3

	for (let i = 0; i < highRetryList.length; i++) {
		const receiptHandle = highRetryList[i].receiptHandle;
		const params = {
				TableName: tableName,
				Item: {
					id: highRetryList[i].messageId,
					value: highRetryList[i].body,
					created_at: new Date().getTime()
				}
			};
		console.log('Message Params: ', params);
		// save in database
		await dynamoDb.put(params).promise();
        const deleteParam = {
                    QueueUrl: QUEUE_URL,
                    ReceiptHandle: receiptHandle,
            }
        // deleting message from sqs
        await sqs.deleteMessage(deleteParam).promise();
	}

	// Generate Error Randomly if error is yes then go down increase retryCount for all the LowRetry List and send LowRetry messages again to SQS with increased Counter
	// and Throw new Error

	const random = Math.random();

	// if No Error 
	if (random <= 0.5 || lowRetryList.length == 0) {
	    return;
	}

    // Error is present
    
	for (let i = 0; i < lowRetryList.length; i++) {
        const retries = lowRetryList[i].messageAttributes.retryCount.stringValue;
        const receipt = lowRetryList[i].receiptHandle;
        console.log('Here is the Backoff in seconds: ', Backoff(retries));
        // RetryCount++ for lowRetryList
        const sendparamsLowRetry = {
            DelaySeconds: Backoff(retries),
            QueueUrl: QUEUE_URL,
            MessageBody: lowRetryList[i].body,
            MessageAttributes: {
                retryCount: {
                DataType: "String",
                StringValue: (1 + parseInt(retries)).toString()
                }
            }
        }
        // send the message back to the queue with retryCount++ 
        const sendMsg = await sqs.sendMessage(sendparamsLowRetry).promise();
        const deleteparams2 = {
            QueueUrl: QUEUE_URL,
            ReceiptHandle: receipt,
        }

        // deleting message from sqs queue with the old retryCount
        const delMsg = await sqs.deleteMessage(deleteparams2).promise();
        console.log("Increased Counter of the message", JSON.stringify(sendMsg));
        console.log("Deleted the message with old counter", JSON.stringify(delMsg));
	}
	
    // emiting error randomly
	throw new Error(`Message not recieved`);
    // return;
};
