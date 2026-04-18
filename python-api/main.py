from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import pdfplumber
import re
from openai import OpenAI

client = OpenAI()
app = FastAPI()

# ✅ CORS FIX (FONTOS!)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://papirpuzzle.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ PREFLIGHT FIX (CORS miatt kötelező)
@app.options("/reconstruct/")
async def options_reconstruct():
    return {"ok": True}


def extract_text(file):
    text = ""
    with pdfplumber.open(file) as pdf:
        for page in pdf.pages:
            content = page.extract_text()
            if content:
                text += content + "\n"
    return text


def clean_text(text: str) -> str:
    text = text.replace("\n", " ")
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"(\w)-\s+(\w)", r"\1\2", text)
    return text.strip()


@app.post("/reconstruct/")
async def reconstruct(files: List[UploadFile] = File(...)):
    texts = []

    files = sorted(files, key=lambda f: f.filename)

    for file in files:
        raw_text = extract_text(file.file)
        text = clean_text(raw_text)
        texts.append(f"\n--- {file.filename} ---\n{text}")

    combined_text = "\n".join(texts)

    prompt = f"""
    You are given fragments of a document extracted from multiple PDF files.
    They may be out of order and partially broken.

    Your task:
    - Reconstruct the original document as accurately as possible
    - Fix broken words and sentences
    - Merge fragments into coherent paragraphs
    - Preserve the original meaning

    IMPORTANT:
    - You MAY fix broken words
    - You MAY reorder content
    - Do NOT invent new content
    - Keep the text natural and readable

    Text:
    {combined_text}
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.3,
        messages=[
            {
                "role": "system",
                "content": "You reconstruct damaged documents and fix broken text while preserving meaning."
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