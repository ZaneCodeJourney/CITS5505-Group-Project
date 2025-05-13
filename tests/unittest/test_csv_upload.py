import requests
import sys
import os
from io import StringIO

# Sample CSV data - matches the example in the HTML form
sample_csv = """Time (min),Depth (m),Temperature (°C),Air (bar)
0,0,26,200
3,5,25,190
6,10,24,180
9,15,23,170
12,20,22,160
15,25,21,150
18,22,21,140
21,20,21,130
24,18,21,120
27,20,21,115
30,22,21,110
33,25,21,105
36,20,22,100
39,15,23,98
42,10,24,96
45,5,25,95
48,0,26,95"""

def test_csv_upload(dive_id):
    """Test the CSV upload endpoint with in-memory content"""
    url = f"http://127.0.0.1:5000/api/dives/{dive_id}/upload-csv"
    
    # Create a file-like object containing the CSV data
    csv_file = StringIO(sample_csv)
    
    # Create a files dictionary with 'profile_csv' as the key
    # This mimics a form upload with a file input named 'profile_csv'
    files = {'profile_csv': ('sample_dive_profile.csv', csv_file, 'text/csv')}
    
    print(f"Uploading CSV data to {url}")
    print(f"CSV data size: {len(sample_csv)} bytes")
    
    # Make the POST request with the file
    response = requests.post(url, files=files)
    
    print(f"Response status code: {response.status_code}")
    
    # Try to parse the response as JSON
    try:
        json_response = response.json()
        print(f"Response JSON: {json_response}")
    except:
        # If not JSON, print as text
        print(f"Response text: {response.text}")
    
    # Check if the upload was successful
    if response.status_code == 201:
        print("✅ CSV upload successful!")
        return True
    else:
        print("❌ CSV upload failed!")
        return False

def create_sample_csv_file(filename="sample_dive_profile.csv"):
    """Create a sample CSV file that can be used for testing"""
    with open(filename, 'w') as f:
        f.write(sample_csv)
    
    print(f"Sample CSV file created: {os.path.abspath(filename)}")
    print("You can use this file to test the upload functionality.")

if __name__ == "__main__":
    # Process command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == "create":
            # Create a sample CSV file
            filename = sys.argv[2] if len(sys.argv) > 2 else "sample_dive_profile.csv"
            create_sample_csv_file(filename)
        else:
            # Try to upload CSV data to the specified dive ID
            dive_id = int(sys.argv[1])
            test_csv_upload(dive_id)
    else:
        # Default to testing with dive ID 23
        print("No dive ID provided, using default (23)")
        print("Usage: python test_csv_upload.py [dive_id]")
        print("   or: python test_csv_upload.py create [filename]")
        test_csv_upload(23) 