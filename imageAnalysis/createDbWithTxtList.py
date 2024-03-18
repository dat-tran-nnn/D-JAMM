
import os
import sqlite3
import re
import json
from openai import OpenAI

client = OpenAI(api_key="")

textList = "good_files.txt"
db_file = "locationsFromTxt.db"
imgSrcUrl = "http://allotrac-hackathon-datasets.s3-website-ap-southeast-2.amazonaws.com/images/"
metaSrcCsv = "/home/void/vision/hackathon2024/csv-dataset/msjob_pod.csv"

conn = sqlite3.connect(db_file)
cursor = conn.cursor()

cursor.execute("""
    CREATE TABLE IF NOT EXISTS image_results (
        id INTEGER PRIMARY KEY,
        filename TEXT,
        customer_id TEXT,
        datetime TEXT,
        lat TEXT,
        long TEXT,
        result TEXT
    )
""")
conn.commit()

datetime = ""
lat = ""
longitude = ""


for txtListFileName in open(textList):
    try:
        response = client.chat.completions.create(
            model="gpt-4-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": """Count how many structured waste containers there are in the image, the number of overflowing ones
                                                    and the number of damaged ones. Output the result in JSON format. Don't output anything else. The 
                                                    JSON format should be as follows: {\"total_containers\": ,\"overflowing_containers\":, 
                                                    \"damaged_containers\":}"""},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": imgSrcUrl,
                            },
                        },
                    ],
                }
            ],
        )

        input_string = response.choices[0].message.content
        start_index = input_string.find('{')
        end_index = input_string.rfind('}')

        json_content = input_string[start_index:end_index + 1]

        data_dict = json.loads(json_content)
        first_entry_value = next(iter(data_dict.values()))

        if first_entry_value > 0:
            print(json_content)
            for line in open(metaSrcCsv):
                line = line.split(',')
                csv_filename = line[5]
                customer_id = line[1]
                lat = line[7]
                longitude = line[8]
                datetime = line[6]
                if goodfile == csv_filename:
                    print("Success: ", filename, " | ", customer_id, " | ", lat, " | ", longitude, " | ", datetime)
                    break 

            cursor.execute("""
                INSERT INTO image_results (filename, customer_id, datetime, lat, long, result)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (goodfile, customer_id, datetime, lat, longitude, json_content))
            conn.commit()

    except Exception as e:
            print("\nERROR ", e)

cursor.close()
conn.close()