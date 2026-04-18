from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import pdfplumber
import re
from openai import OpenAI

client = OpenAI()
app = FastAPI()

# ✅ CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # később cserélhető konkrét domainre
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    text = text.replace("\n", " ")
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"(\w)-\s+(\w)", r"\1\2", text)
    return text.strip()


@app.post("/reconstruct/")
async def reconstruct(files: List[UploadFile] = File(...)):
    texts = []

    # ✅ sort files
    files = sorted(files, key=lambda f: f.filename)

    for file in files:
        raw_text = extract_text(file.file)
        text = clean_text(raw_text)

        texts.append(f"\n--- {file.filename} ---\n{text}")

    # ✅ better memory handling
    combined_text = "\n".join(texts)

    # 🔥 AI reconstruction step
    prompt = f"""
You are given fragments of a document extracted from multiple PDF files.
They may be out of order and partially broken.

Reconstruct them into a clean, readable, logically ordered text.

STRICT RULES:
- DO NOT rewrite
- DO NOT summarize
- DO NOT add new words
- ONLY reorder and merge

Text:
{combined_text}
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0,  # ✅ fontos!
        messages=[
            {
                "role": "system",
                "content": "You reconstruct documents without changing wording."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    final_text = response.choices[0].message.content

    return {
        "message": "Reconstruction complete",
        "combined_text": final_text
    }