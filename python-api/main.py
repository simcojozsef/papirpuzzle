from fastapi import FastAPI, UploadFile, File
from typing import List
import pdfplumber
import re
from openai import OpenAI
import os

client = OpenAI()
app = FastAPI()


def extract_text(file):
    text = ""
    with pdfplumber.open(file) as pdf:
        for page in pdf.pages:
            content = page.extract_text()
            if content:
                text += content + "\n"
    return text


# ✅ CLEAN TEXT FUNCTION
def clean_text(text: str) -> str:
    # remove line breaks inside sentences
    text = text.replace("\n", " ")

    # remove multiple spaces
    text = re.sub(r"\s+", " ", text)

    # fix broken words like "agi ng" → "aging"
    text = re.sub(r"(\w)-\s+(\w)", r"\1\2", text)

    return text.strip()


@app.post("/reconstruct/")
async def reconstruct(files: List[UploadFile] = File(...)):
    combined_text = ""

    # ✅ sort files
    files = sorted(files, key=lambda f: f.filename)

    for file in files:
        raw_text = extract_text(file.file)

        # ✅ APPLY CLEANING HERE
        text = clean_text(raw_text)

        combined_text += f"\n--- {file.filename} ---\n"
        combined_text += text + "\n"

    # 🔥 AI reconstruction step
    prompt = f"""
    You are given fragments of a document extracted from multiple PDF files.
    They may be out of order and partially broken.

    Reconstruct them into a clean, readable, logically ordered text.
    Fix broken sentences and ensure natural flow.

    Text:
    {combined_text}
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    final_text = response.choices[0].message.content

    return {
        "message": "Reconstruction complete",
        "combined_text": final_text
    }