# Simple Regression Model Deployment on AWS SageMaker

**Goal**: Learn deployment process with a simple linear regression model that predicts house prices.

**Time to Complete**: 30 minutes

---

## What You'll Build

A simple regression model that predicts house prices based on square footage and number of bedrooms.

**Input**: `{"square_feet": 2000, "bedrooms": 3}`  
**Output**: `{"predicted_price": 350000}`

---

## Step 1: Create SageMaker Notebook Instance

### Via AWS Console:

1. Go to **AWS Console** → Search "SageMaker" → Click **Amazon SageMaker**

2. Click **Notebook instances** (left sidebar) → **Create notebook instance**

3. **Settings**:
   - **Notebook instance name**: `simple-deployment-demo`
   - **Instance type**: `ml.t3.medium`
   - **Platform**: Amazon Linux 2, Jupyter Lab 3

4. Click **Create notebook instance**

5. **Wait 3-5 minutes** until Status shows "InService"

6. Click **Open JupyterLab**

---

## Step 2: Create and Deploy the Model

In JupyterLab, create a **new notebook** (File → New → Notebook → Python 3)

### Cell 1: Setup and Create Sample Data

```python
# Install and import libraries
import boto3
import sagemaker
from sagemaker import get_execution_role
from sagemaker.sklearn.estimator import SKLearn
import pandas as pd
import numpy as np
import os
import json

# Setup
role = get_execution_role()
sagemaker_session = sagemaker.Session()
region = boto3.Session().region_name
bucket = sagemaker_session.default_bucket()

print(f"✓ Region: {region}")
print(f"✓ S3 Bucket: {bucket}")
print(f"✓ Role: {role}")

# Create simple training data for house price prediction
# Features: square_feet, bedrooms
# Target: price (in thousands)

np.random.seed(42)

# Generate 100 sample houses
square_feet = np.random.randint(800, 4000, 100)
bedrooms = np.random.randint(1, 6, 100)

# Simple formula: price = 150 * square_feet + 50000 * bedrooms + noise
price = (square_feet * 150 + bedrooms * 50000 + np.random.randn(100) * 20000)

# Create DataFrame
data = pd.DataFrame({
    'price': price,
    'square_feet': square_feet,
    'bedrooms': bedrooms
})

# Save training data
os.makedirs('data', exist_ok=True)
data.to_csv('data/train.csv', index=False, header=False)

print(f"\n✓ Created {len(data)} training samples")
print("\nSample data:")
print(data.head())
```

### Cell 2: Upload Data to S3

```python
# Upload to S3
prefix = 'house-price-model'

train_path = sagemaker_session.upload_data(
    path='data/train.csv',
    bucket=bucket,
    key_prefix=f'{prefix}/train'
)

print(f"✓ Training data uploaded to: {train_path}")
```

### Cell 3: Create Training Script

```python
# Create directory for code
os.makedirs('code', exist_ok=True)

# Write simple training script
training_script = """
import argparse
import os
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
import joblib
import json

def train(args):
    '''Train a simple linear regression model'''
    
    # Read data
    print("Reading training data...")
    train_data = pd.read_csv(os.path.join(args.train, 'train.csv'), header=None)
    
    # Split features and target
    # Column 0 is price (target), columns 1-2 are features
    y_train = train_data.iloc[:, 0].values
    X_train = train_data.iloc[:, 1:].values
    
    print(f"Training data shape: {X_train.shape}")
    print(f"Target shape: {y_train.shape}")
    
    # Train model
    print("Training linear regression model...")
    model = LinearRegression()
    model.fit(X_train, y_train)
    
    # Calculate R² score
    score = model.score(X_train, y_train)
    print(f"Model R² score: {score:.4f}")
    
    # Save model
    model_path = os.path.join(args.model_dir, 'model.joblib')
    joblib.dump(model, model_path)
    print(f"Model saved to: {model_path}")
    
    # Save model info
    model_info = {
        'r2_score': float(score),
        'coefficients': model.coef_.tolist(),
        'intercept': float(model.intercept_)
    }
    
    with open(os.path.join(args.model_dir, 'model_info.json'), 'w') as f:
        json.dump(model_info, f)
    
    print("Training complete!")

def model_fn(model_dir):
    '''Load model for inference'''
    model = joblib.load(os.path.join(model_dir, 'model.joblib'))
    return model

def predict_fn(input_data, model):
    '''Make predictions'''
    prediction = model.predict(input_data)
    return prediction

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    
    # SageMaker specific arguments
    parser.add_argument('--model-dir', type=str, default=os.environ.get('SM_MODEL_DIR'))
    parser.add_argument('--train', type=str, default=os.environ.get('SM_CHANNEL_TRAIN'))
    
    args = parser.parse_args()
    train(args)
"""

# Save the script
with open('code/train.py', 'w') as f:
    f.write(training_script)

print("✓ Training script created: code/train.py")
```

### Cell 4: Train the Model

```python
# Create SKLearn estimator
print("Creating SageMaker training job...")

sklearn_estimator = SKLearn(
    entry_point='train.py',
    source_dir='code',
    role=role,
    instance_type='ml.m5.large',
    framework_version='1.2-1',
    py_version='py3',
)

# Start training
print("\nStarting training...")
print("This will take 3-5 minutes...\n")

sklearn_estimator.fit({'train': train_path}, wait=True)

print("\n✓ Training completed successfully!")
```

### Cell 5: Deploy the Model

```python
# Deploy to endpoint
endpoint_name = 'house-price-predictor'

print(f"Deploying model to endpoint: {endpoint_name}")
print("This will take 5-8 minutes...\n")

predictor = sklearn_estimator.deploy(
    initial_instance_count=1,
    instance_type='ml.m5.large',
    endpoint_name=endpoint_name
)

print(f"\n✅ Model deployed successfully!")
print(f"Endpoint name: {endpoint_name}")
```

### Cell 6: Test the Endpoint

```python
# Test the deployed model
import numpy as np

# Test case 1: Small house
test_input = [[1200, 2]]  # 1200 sq ft, 2 bedrooms
prediction = predictor.predict(test_input)
print(f"House: 1200 sq ft, 2 bedrooms")
print(f"Predicted price: ${prediction[0]:,.2f}\n")

# Test case 2: Medium house
test_input = [[2000, 3]]  # 2000 sq ft, 3 bedrooms
prediction = predictor.predict(test_input)
print(f"House: 2000 sq ft, 3 bedrooms")
print(f"Predicted price: ${prediction[0]:,.2f}\n")

# Test case 3: Large house
test_input = [[3500, 5]]  # 3500 sq ft, 5 bedrooms
prediction = predictor.predict(test_input)
print(f"House: 3500 sq ft, 5 bedrooms")
print(f"Predicted price: ${prediction[0]:,.2f}")
```

### Cell 7: Save Endpoint Information

```python
# Save deployment details
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

print("✓ Deployment information saved!")
print("\nEndpoint Details:")
print(json.dumps(deployment_info, indent=2))
```

---

## Step 3: Create IAM Role for Lambda

### Via AWS Console:

1. Go to **IAM Console** → **Roles** → **Create role**

2. **Select trusted entity**:
   - **Trusted entity type**: AWS service
   - **Use case**: Lambda
   - Click **Next**

3. **Add permissions**: Search and select:
   - `AWSLambdaBasicExecutionRole`

4. Click **Next**

5. **Role name**: `LambdaInvokeHousePriceModel`

6. Click **Create role**

7. **Add inline policy**:
   - Click on the role you just created
   - Click **Add permissions** → **Create inline policy**
   - Click **JSON** tab
   - Paste:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "sagemaker:InvokeEndpoint",
            "Resource": "arn:aws:sagemaker:*:*:endpoint/house-price-predictor"
        }
    ]
}
```

   - Click **Review policy**
   - **Name**: `InvokeSageMakerEndpoint`
   - Click **Create policy**

---

## Step 4: Create Lambda Function

### Via AWS Console:

1. Go to **Lambda Console** → **Create function**

2. **Basic information**:
   - **Function name**: `PredictHousePrice`
   - **Runtime**: Python 3.11
   - **Architecture**: x86_64

3. **Permissions**:
   - **Execution role**: Use an existing role
   - Select: `LambdaInvokeHousePriceModel`

4. Click **Create function**

5. **Add function code**:

Scroll down to **Code source** and replace with:

```python
import json
import boto3
import os

# Initialize SageMaker runtime
sagemaker_runtime = boto3.client('sagemaker-runtime')

def lambda_handler(event, context):
    """
    Lambda function to predict house prices
    
    Expected input:
    {
        "square_feet": 2000,
        "bedrooms": 3
    }
    
    Returns:
    {
        "predicted_price": 350000.50
    }
    """
    
    try:
        # Get endpoint name
        endpoint_name = os.environ.get('SAGEMAKER_ENDPOINT_NAME')
        
        if not endpoint_name:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'SAGEMAKER_ENDPOINT_NAME not configured'
                })
            }
        
        # Parse input
        print(f"Received event: {json.dumps(event)}")
        
        if 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event
        
        # Extract features
        square_feet = body.get('square_feet')
        bedrooms = body.get('bedrooms')
        
        # Validate input
        if square_feet is None or bedrooms is None:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Missing required fields',
                    'required': ['square_feet', 'bedrooms'],
                    'example': {
                        'square_feet': 2000,
                        'bedrooms': 3
                    }
                })
            }
        
        # Prepare input for SageMaker
        # Model expects: [[square_feet, bedrooms]]
        input_data = [[float(square_feet), float(bedrooms)]]
        payload = json.dumps(input_data)
        
        print(f"Invoking endpoint: {endpoint_name}")
        print(f"Input data: {input_data}")
        
        # Invoke SageMaker endpoint
        response = sagemaker_runtime.invoke_endpoint(
            EndpointName=endpoint_name,
            ContentType='application/json',
            Accept='application/json',
            Body=payload
        )
        
        # Parse response
        result = json.loads(response['Body'].read().decode())
        predicted_price = result[0]
        
        print(f"Prediction: ${predicted_price:,.2f}")
        
        # Return response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps({
                'success': True,
                'input': {
                    'square_feet': square_feet,
                    'bedrooms': bedrooms
                },
                'predicted_price': round(predicted_price, 2),
                'predicted_price_formatted': f"${predicted_price:,.2f}"
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        print(traceback.format_exc())
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e),
                'type': type(e).__name__
            })
        }
```

6. Click **Deploy** to save

7. **Configure environment variable**:
   - Scroll down to **Environment variables**
   - Click **Edit**
   - Click **Add environment variable**
   - **Key**: `SAGEMAKER_ENDPOINT_NAME`
   - **Value**: `house-price-predictor`
   - Click **Save**

8. **Set timeout**:
   - Go to **Configuration** tab
   - Click **General configuration** → **Edit**
   - **Timeout**: 30 seconds
   - Click **Save**

9. **Test Lambda** (Optional):
   - Go to **Test** tab
   - Click **Create new event**
   - **Event name**: `TestHouse`
   - Replace JSON with:

```json
{
  "body": "{\"square_feet\": 2000, \"bedrooms\": 3}"
}
```

   - Click **Save**
   - Click **Test**
   - You should see a success response with predicted price

---

## Step 5: Create API Gateway

### Via AWS Console:

1. Go to **API Gateway Console** → **Create API**

2. Choose **REST API** (not Private) → Click **Build**

3. **Create API**:
   - **Choose the protocol**: REST
   - **Create new API**: New API
   - **API name**: `HousePriceAPI`
   - **Description**: Simple house price prediction API
   - **Endpoint Type**: Regional
   - Click **Create API**

4. **Create Resource**:
   - Click **Actions** → **Create Resource**
   - **Resource Name**: `predict`
   - **Resource Path**: `/predict`
   - ✅ Check **Enable API Gateway CORS**
   - Click **Create Resource**

5. **Create POST Method**:
   - Select `/predict` resource
   - Click **Actions** → **Create Method**
   - Select **POST** from dropdown
   - Click ✓ checkmark

6. **Setup Integration**:
   - **Integration type**: Lambda Function
   - ✅ Check **Use Lambda Proxy integration**
   - **Lambda Region**: Select your region
   - **Lambda Function**: Start typing `PredictHousePrice` and select it
   - Click **Save**
   - Click **OK** to give API Gateway permission

7. **Enable CORS**:
   - Select `/predict` resource
   - Click **Actions** → **Enable CORS**
   - Keep all defaults
   - Click **Enable CORS and replace existing CORS headers**
   - Click **Yes, replace existing values**

8. **Deploy API**:
   - Click **Actions** → **Deploy API**
   - **Deployment stage**: [New Stage]
   - **Stage name**: `prod`
   - **Stage description**: Production
   - Click **Deploy**

9. **Get API URL**:
   - You'll see **Invoke URL** at the top
   - Example: `https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod`
   - Your full endpoint: `https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod/predict`
   - **Copy and save this URL**

---

## Step 6: Test Your Public API

### Test 1: Using cURL (Terminal/Command Prompt)

```bash
curl -X POST \
  https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com/prod/predict \
  -H 'Content-Type: application/json' \
  -d '{
    "square_feet": 2000,
    "bedrooms": 3
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "input": {
    "square_feet": 2000,
    "bedrooms": 3
  },
  "predicted_price": 350245.67,
  "predicted_price_formatted": "$350,245.67"
}
```

### Test 2: Using Python

Create file `test_api.py`:

```python
import requests
import json

# Replace with your API URL
API_URL = "https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com/prod/predict"

# Test different houses
test_houses = [
    {"square_feet": 1200, "bedrooms": 2},
    {"square_feet": 2000, "bedrooms": 3},
    {"square_feet": 3500, "bedrooms": 5},
    {"square_feet": 800, "bedrooms": 1}
]

print("🏠 House Price Prediction API Test\n")
print("=" * 60)

for house in test_houses:
    response = requests.post(API_URL, json=house)
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n📊 Input: {house['square_feet']} sq ft, {house['bedrooms']} bedrooms")
        print(f"💰 Predicted Price: {result['predicted_price_formatted']}")
    else:
        print(f"\n❌ Error: {response.status_code}")
        print(response.json())

print("\n" + "=" * 60)
```

Run it:
```bash
python test_api.py
```

### Test 3: Using JavaScript/HTML

Create file `test_api.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>House Price Predictor</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 500px;
            width: 100%;
        }
        
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 10px;
            font-size: 32px;
        }
        
        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
        }
        
        .input-group {
            margin-bottom: 25px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 600;
            font-size: 14px;
        }
        
        input {
            width: 100%;
            padding: 15px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        
        input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        button {
            width: 100%;
            padding: 18px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        }
        
        button:active {
            transform: translateY(0);
        }
        
        .result {
            margin-top: 30px;
            padding: 25px;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-radius: 15px;
            display: none;
            text-align: center;
        }
        
        .result.show {
            display: block;
            animation: slideUp 0.5s ease-out;
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .price {
            font-size: 48px;
            font-weight: bold;
            color: #667eea;
            margin: 15px 0;
        }
        
        .details {
            color: #666;
            font-size: 14px;
        }
        
        .error {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
            color: white;
        }
        
        .loading {
            text-align: center;
            color: #667eea;
            font-size: 18px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏠 House Price Predictor</h1>
        <p class="subtitle">Get instant price predictions using AI</p>
        
        <form onsubmit="predictPrice(event)">
            <div class="input-group">
                <label for="squareFeet">Square Feet</label>
                <input 
                    type="number" 
                    id="squareFeet" 
                    placeholder="e.g., 2000"
                    min="500"
                    max="10000"
                    required
                >
            </div>
            
            <div class="input-group">
                <label for="bedrooms">Number of Bedrooms</label>
                <input 
                    type="number" 
                    id="bedrooms" 
                    placeholder="e.g., 3"
                    min="1"
                    max="10"
                    required
                >
            </div>
            
            <button type="submit">Predict Price</button>
        </form>
        
        <div id="result" class="result"></div>
    </div>

    <script>
        // REPLACE THIS WITH YOUR API URL
        const API_URL = 'https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com/prod/predict';
        
        async function predictPrice(event) {
            event.preventDefault();
            
            const squareFeet = document.getElementById('squareFeet').value;
            const bedrooms = document.getElementById('bedrooms').value;
            const resultDiv = document.getElementById('result');
            
            // Show loading
            resultDiv.className = 'result show loading';
            resultDiv.innerHTML = '🔄 Calculating price...';
            
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        square_feet: parseInt(squareFeet),
                        bedrooms: parseInt(bedrooms)
                    })
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    resultDiv.className = 'result show';
                    resultDiv.innerHTML = `
                        <div style="font-size: 16px; color: #666; margin-bottom: 10px;">
                            Estimated Price
                        </div>
                        <div class="price">${data.predicted_price_formatted}</div>
                        <div class="details">
                            ${squareFeet} sq ft · ${bedrooms} bedrooms
                        </div>
                    `;
                } else {
                    throw new Error(data.error || 'Prediction failed');
                }
                
            } catch (error) {
                resultDiv.className = 'result show error';
                resultDiv.innerHTML = `
                    <div style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">
                        ❌ Error
                    </div>
                    <div>${error.message}</div>
                `;
            }
        }
    </script>
</body>
</html>
```

Open the HTML file in your browser and test!

### Test 4: Using Postman

1. Open Postman
2. Create new request:
   - **Method**: POST
   - **URL**: `https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com/prod/predict`
3. **Headers**:
   - Key: `Content-Type`
   - Value: `application/json`
4. **Body** → **raw** → **JSON**:
```json
{
  "square_feet": 2000,
  "bedrooms": 3
}
```
5. Click **Send**

---

## Complete Script (Run Everything at Once)

Copy this into a single notebook cell to do everything:

```python
# COMPLETE DEPLOYMENT SCRIPT
# Run this in your SageMaker notebook

import boto3
import sagemaker
from sagemaker import get_execution_role
from sagemaker.sklearn.estimator import SKLearn
import pandas as pd
import numpy as np
import os
import json

print("=" * 80)
print("SIMPLE HOUSE PRICE PREDICTION MODEL - COMPLETE DEPLOYMENT")
print("=" * 80)

# Setup
print("\n[1/7] Setting up environment...")
role = get_execution_role()
sagemaker_session = sagemaker.Session()
region = boto3.Session().region_name
bucket = sagemaker_session.default_bucket()
print(f"✓ Region: {region}")
print(f"✓ Bucket: {bucket}")

# Create data
print("\n[2/7] Creating training data...")
np.random.seed(42)
square_feet = np.random.randint(800, 4000, 100)
bedrooms = np.random.randint(1, 6, 100)
price = (square_feet * 150 + bedrooms * 50000 + np.random.randn(100) * 20000)
data = pd.DataFrame({'price': price, 'square_feet': square_feet, 'bedrooms': bedrooms})
os.makedirs('data', exist_ok=True)
data.to_csv('data/train.csv', index=False, header=False)
print(f"✓ Created {len(data)} samples")

# Upload to S3
print("\n[3/7] Uploading to S3...")
prefix = 'house-price-model'
train_path = sagemaker_session.upload_data(
    path='data/train.csv',
    bucket=bucket,
    key_prefix=f'{prefix}/train'
)
print(f"✓ Uploaded to {train_path}")

# Create training script
print("\n[4/7] Creating training script...")
os.makedirs('code', exist_ok=True)
training_script = """
import argparse
import os
import pandas as pd
from sklearn.linear_model import LinearRegression
import joblib

def train(args):
    train_data = pd.read_csv(os.path.join(args.train, 'train.csv'), header=None)
    y_train = train_data.iloc[:, 0].values
    X_train = train_data.iloc[:, 1:].values
    model = LinearRegression()
    model.fit(X_train, y_train)
    score = model.score(X_train, y_train)
    print(f"Model R² score: {score:.4f}")
    joblib.dump(model, os.path.join(args.model_dir, 'model.joblib'))

def model_fn(model_dir):
    return joblib.load(os.path.join(model_dir, 'model.joblib'))

def predict_fn(input_data, model):
    return model.predict(input_data)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--model-dir', type=str, default=os.environ.get('SM_MODEL_DIR'))
    parser.add_argument('--train', type=str, default=os.environ.get('SM_CHANNEL_TRAIN'))
    args = parser.parse_args()
    train(args)
"""
with open('code/train.py', 'w') as f:
    f.write(training_script)
print("✓ Training script created")

# Train
print("\n[5/7] Training model...")
print("This will take 3-5 minutes...\n")
sklearn_estimator = SKLearn(
    entry_point='train.py',
    source_dir='code',
    role=role,
    instance_type='ml.m5.large',
    framework_version='1.2-1',
    py_version='py3',
)
sklearn_estimator.fit({'train': train_path}, wait=True)
print("\n✓ Training complete")

# Deploy
print("\n[6/7] Deploying model...")
print("This will take 5-8 minutes...\n")
endpoint_name = 'house-price-predictor'
predictor = sklearn_estimator.deploy(
    initial_instance_count=1,
    instance_type='ml.m5.large',
    endpoint_name=endpoint_name
)
print(f"\n✓ Deployed to endpoint: {endpoint_name}")

# Test
print("\n[7/7] Testing endpoint...")
test_cases = [
    ([1200, 2], "Small house (1200 sq ft, 2 bed)"),
    ([2000, 3], "Medium house (2000 sq ft, 3 bed)"),
    ([3500, 5], "Large house (3500 sq ft, 5 bed)")
]

for test_input, description in test_cases:
    prediction = predictor.predict([test_input])
    print(f"{description}: ${prediction[0]:,.2f}")

# Save info
deployment_info = {
    'endpoint_name': endpoint_name,
    'region': region,
    'status': 'deployed'
}
with open('deployment_info.json', 'w') as f:
    json.dump(deployment_info, f, indent=2)

print("\n" + "=" * 80)
print("✅ DEPLOYMENT COMPLETE!")
print("=" * 80)
print(f"\nEndpoint Name: {endpoint_name}")
print(f"Region: {region}")
print("\nNext Steps:")
print("1. Go to AWS Lambda Console")
print("2. Create function 'PredictHousePrice' with provided code")
print("3. Set environment variable: SAGEMAKER_ENDPOINT_NAME = house-price-predictor")
print("4. Create API Gateway")
print("5. Test your API!")
print("=" * 80)
```

---

## Cleanup (Stop Charges)

### When done testing:

```python
# In your SageMaker notebook
predictor.delete_endpoint()
print("✓ Endpoint deleted")
```

**Or via Console**:
1. SageMaker → Endpoints → Select endpoint → Delete
2. Lambda → Functions → Select function → Delete  
3. API Gateway → APIs → Select API → Delete
4. SageMaker → Notebook instances → Stop

---

## Summary

✅ **What you learned:**
1. Created a SageMaker notebook instance
2. Built a simple regression model
3. Deployed model to SageMaker endpoint
4. Created Lambda function to invoke endpoint
5. Set up API Gateway for public access
6. Tested API from multiple platforms

✅ **Your Model**:
- **Input**: Square feet and bedrooms
- **Output**: Predicted house price
- **Publicly accessible** via HTTPS API

✅ **Time**: ~30 minutes total

🎉 **Congratulations!** You've successfully deployed your first ML model to production!






azure app sevice for dynamic web

so create a instance
then region should be east asia and resourcee grp should be newly created at that time only

just review and create

go to resouce-> deployment center-> chose local files-> and upload the zip file and boom done!







**Your API URL**: `https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com/prod/predict`
