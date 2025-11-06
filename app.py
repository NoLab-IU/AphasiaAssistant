import os
import io
import tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv
from werkzeug.utils import secure_filename

# --- 1. CONFIGURATION ---

load_dotenv(".flaskenv")

app = Flask(__name__)

CORS(app) 


OPENAI_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_KEY:
    print("FATAL ERROR: OPENAI_API_KEY not found in .flaskenv!")
    client = None 
else:
    client = OpenAI(api_key=OPENAI_KEY)
    print("OpenAI client initialized successfully.")


# --- 2. ENDPOINT FOR TRANSCRIPTION (Whisper API) ---

@app.route('/api/transcribe', methods=['POST'])
def transcribe_audio():
    if client is None:
        return jsonify({"error": "Server not configured: API Key missing."}), 500
        
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
        
    audio_file = request.files['file']
    
    filename = "audio.mp3" 

    try:
        # 1. Use a temporary file to save the incoming audio data
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
            # Save the incoming file stream to the temporary file path
            audio_file.save(tmp.name)
            temp_path = tmp.name
        
        # 2. Open the file using the explicit filename "audio.mp3" 
        with open(temp_path, "rb") as f:
            
            openai_file = ("audio.mp3", f.read(), "audio/mp3")

            response = client.audio.transcriptions.create(
                model="whisper-1",
                file=openai_file,
                language="en"
            )
            
        # 3. Clean up the temporary file
        os.remove(temp_path)
        
        # 4. Return the transcription text to the React frontend
        return jsonify({"text": response.text})

    except Exception as e:
        print(f"Transcription Error: {e}")
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.remove(temp_path)
        return jsonify({"error": f"Failed to transcribe audio on the server: {str(e)}"}), 500


# --- 3. ENDPOINT FOR SUGGESTIONS (Chat API) ---

@app.route('/api/suggest', methods=['POST'])
def generate_suggestions_flask():
    if client is None:
        return jsonify({"error": "Server not configured: API Key missing."}), 500

    data = request.json
    user_text = data.get('user_text')
    general_context = data.get('context')

    if not user_text or not general_context:
        return jsonify({"error": "Missing user_text or context"}), 400

    # 1. Construct the complete system prompt structure
    system_content_instructions = """
        You are an aphasia speech assistant. Generate 3 possible corrections:
        1. Retain the user's intended meaning.
        2. Use **first-person perspective ("I")** unless user input clearly indicates someone else.
        3. Provide **one complete sentence per suggestion**.
        4. Do not number suggestions—just separate them with newlines.
        5. Keep sentences simple, clear, and conversational.
    """
    
    # Combine the examples/rules (general_context) with the final instruction set
    system_content_full = general_context + system_content_instructions
    
    messages = [
        {
            "role": "system", 
            "content": system_content_full
        },
        {
            "role": "user", 
            "content": user_text
        }
    ]
    
    try:
        # 2. Call the OpenAI Chat API securely
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.2,
            max_tokens=100,
        )
        
        # 3. Return the result back to the React frontend
        content = response.choices[0].message.content
        return jsonify({"content": content})

    except Exception as e:
        print(f"OpenAI Chat Error: {e}")
        return jsonify({"error": "Failed to generate suggestions via server."}), 500