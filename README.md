# AWS-Serverless

## Prerequisites
 - Create 3 lambda fucntion in AWS
 - Create 1 Standard SQS queue
 - Create 1 DynamoDb Table
 - Create 1 API gateway

## Run
 - Connect the above services according to the diagram below.
 - Copy and paste the scripts from each lambda into the index.js in your AWS lambda Code editor


# Rest Api


| Apis | Endpoints | Methods
| ------ | ------ | ------ |
| Get all failed jobs from DynamoDb | https://hqi8w1y4d8.execute-api.ap-south-1.amazonaws.com/Dev/jobs |GET|


# The Flow

1. Producer Lambda Generates 10 messages (batch size = 10) 

2. Messages goes to the Standard SQS Queue.

3.  Consumer Lambda listens to the event of 10 messages from the SQS
    - We filter messages according to the retry Count.
        - RetryCount > 3 => HighRetryList; RetryCount <= 3 => LowRetryList
    
    -  Delete all the messages from HighRetryList and save them in dynamoDB
    
    - random error -> yes ---> Go to LowRetryList and consume the messages and increment the retry count 

3. Fetch the failed messages from the dynamoDB using the API gateway Endpoint





![alt text](https://github.com/himanshusr/AWS-Serverless/blob/master/Event_Driven_Arch.png?raw=true)

## License

MIT
