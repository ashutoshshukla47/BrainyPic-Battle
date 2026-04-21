Simple Regression Model Deployment on AWS SageMaker
Goal

Learn deployment process with a simple linear regression model that predicts house prices.

Time to Complete: 30 minutes

What You'll Build

A regression model predicting house prices based on:

square footage
number of bedrooms

Input:

{"square_feet": 2000, "bedrooms": 3}

Output:

{"predicted_price": 350000}

Step 1: Create SageMaker Notebook Instance
Via AWS Console:
Go to AWS Console → Search "SageMaker" → Click Amazon SageMaker
Click Notebook instances → Create notebook instance
Settings:
Notebook instance name: simple-deployment-demo
Instance type: ml.t3.medium
Platform: Amazon Linux 2, JupyterLab 3


(NOT NOW WE WILL DO IT LATER)IAM role: Create new role → Select “Any S3 bucket” → Create role


Click Create notebook instance
Wait 3–5 minutes until status = InService
Click Open JupyterLab
Step 2: Create and Deploy the Model
Install & Import Libraries
import boto3
import sagemaker
from sagemaker import get_execution_role
from sagemaker.sklearn.estimator import SKLearn
import pandas as pd
import numpy as np
import os
import json

role = get_execution_role()
sagemaker_session = sagemaker.Session()
region = boto3.Session().region_name
bucket = sagemaker_session.default_bucket()

print(f"Region: {region}")
print(f"S3 Bucket: {bucket}")
print(f"Role: {role}")
Create Training Data
np.random.seed(42)

square_feet = np.random.randint(800, 4000, 100)
bedrooms = np.random.randint(1, 6, 100)

price = (square_feet * 150 + bedrooms * 50000 +
         np.random.randn(100) * 20000)

data = pd.DataFrame({
    'price': price,
    'square_feet': square_feet,
    'bedrooms': bedrooms
})

os.makedirs('data', exist_ok=True)
data.to_csv('data/train.csv', index=False, header=False)

print(f"Created {len(data)} samples")
print(data.head())
Upload Data to S3
prefix = 'house-price-model'

train_path = sagemaker_session.upload_data(
    path='data/train.csv',
    bucket=bucket,
    key_prefix=f'{prefix}/train'
)

print(f"Uploaded to: {train_path}")
Create Training Script
os.makedirs('code', exist_ok=True)

training_script = """
import argparse
import os
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
import joblib
import json

def train(args):
    train_data = pd.read_csv(os.path.join(args.train, 'train.csv'), header=None)

    y_train = train_data.iloc[:, 0].values
    X_train = train_data.iloc[:, 1:].values

    model = LinearRegression()
    model.fit(X_train, y_train)

    score = model.score(X_train, y_train)

    model_path = os.path.join(args.model_dir, 'model.joblib')
    joblib.dump(model, model_path)

    model_info = {
        'r2_score': float(score),
        'coefficients': model.coef_.tolist(),
        'intercept': float(model.intercept_)
    }

    with open(os.path.join(args.model_dir, 'model_info.json'), 'w') as f:
        json.dump(model_info, f)

def model_fn(model_dir):
    return joblib.load(os.path.join(model_dir, 'model.joblib'))

def predict_fn(input_data, model):
    return model.predict(input_data)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--model-dir', type=str, default=os.environ.get('SM_MODEL_DIR'))
    parser.add_argument('--train', type=str, default=os.environ.get('SM_CHANNEL_TRAIN'))

    args = parser.parse_args()
    train(args)
"""

with open('code/train.py', 'w') as f:
    f.write(training_script)

print("Training script created")

Train Model
sklearn_estimator = SKLearn(
    entry_point='train.py',
    source_dir='code',
    role=role,
    instance_type='ml.m5.large',
    framework_version='1.2-1',
    py_version='py3'
)

sklearn_estimator.fit({'train': train_path}, wait=True)
Deploy Model
endpoint_name = 'house-price-predictor'

predictor = sklearn_estimator.deploy(
    initial_instance_count=1,
    instance_type='ml.m5.large',
    endpoint_name=endpoint_name
)

print("Deployed:", endpoint_name)
Test Endpoint
import numpy as np

test_input = [[1200, 2]]
print(predictor.predict(test_input))

test_input = [[2000, 3]]
print(predictor.predict(test_input))

test_input = [[3500, 5]]
print(predictor.predict(test_input))
Save Deployment Info
deployment_info = {
    'endpoint_name': endpoint_name,
    'region': region,
    'model_type': 'linear_regression',
    'features': ['square_feet', 'bedrooms'],
    'target': 'price',
    'status': 'deployed'
}

with open('deployment_info.json', 'w') as f:
    json.dump(deployment_info, f, indent=2)

print("Saved deployment info")
Step 3: Create IAM Role for Lambda
Role name: LambdaInvokeHousePriceModel
Add permission:
{
  "Effect": "Allow",
  "Action": "sagemaker:InvokeEndpoint",
  "Resource": "arn:aws:sagemaker:*:*:endpoint/house-price-predictor"
}
Step 4: Create Lambda Function
Basic Info
Name: PredictHousePrice
Runtime: Python 3.11
Role: existing role
Lambda Code
import json
import boto3
import os

sagemaker_runtime = boto3.client('sagemaker-runtime')

def lambda_handler(event, context):
    endpoint_name = os.environ.get('SAGEMAKER_ENDPOINT_NAME')

    body = json.loads(event['body']) if isinstance(event['body'], str) else event

    square_feet = body.get('square_feet')
    bedrooms = body.get('bedrooms')

    input_data = [[float(square_feet), float(bedrooms)]]

    response = sagemaker_runtime.invoke_endpoint(
        EndpointName=endpoint_name,
        ContentType='application/json',
        Body=json.dumps(input_data)
    )

    result = json.loads(response['Body'].read().decode())
    predicted_price = result[0]

    return {
        'statusCode': 200,
        'body': json.dumps({
            'predicted_price': round(predicted_price, 2)
        })
    }
Step 5: Create API Gateway
API Name: HousePriceAPI
Resource: /predict
Method: POST
Integration: Lambda
Step 6: Test API
cURL
curl -X POST https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com/prod/predict \
-H "Content-Type: application/json" \
-d '{"square_feet":2000,"bedrooms":3}'

Python Test
import requests

API_URL = "YOUR_API_URL"

data = {"square_feet": 2000, "bedrooms": 3}
response = requests.post(API_URL, json=data)

print(response.json())


Frontend (HTML)
<input id="squareFeet" type="number">
<input id="bedrooms" type="number">
<button onclick="predict()">Predict</button>

<script>
async function predict() {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      square_feet: 2000,
      bedrooms: 3
    })
  });
  const data = await res.json();
  console.log(data);
}
</script>

Cleanup
predictor.delete_endpoint()
