import React, { useState, useEffect } from "react";
import OpenAI from "openai";
import { useSpeechSynthesis } from "react-speech-kit";

function App() {
  const [isFFmpegLoaded, setIsFFmpegLoaded] = useState(false);
  const [ffmpeg, setFFmpeg] = useState(null);
  const [recording, setRecording] = useState(false);
  // const [audioURL, setAudioURL] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionValid1, setSuggestionValid1] = useState(true);
  const [suggestionValid2, setSuggestionValid2] = useState(false);
  const [suggestionValid3, setSuggestionValid3] = useState(false);
  const [text, setText] = useState("");
  const { speak, cancel } = useSpeechSynthesis();
  const [status, setStatus] = useState("Click to start recording");
  
  // Initialize FFmpeg and OpenAI
  useEffect(() => {
    const loadDependencies = async () => {
      try {
        // Dynamic imports to avoid SSR issues
        const { FFmpeg } = await import("@ffmpeg/ffmpeg");
        
        const ffmpegInstance = new FFmpeg();
        
        ffmpegInstance.on("log", ({ message }) => {
          console.log(message);
        });
        
        await ffmpegInstance.load();
        setFFmpeg(ffmpegInstance);
        setIsFFmpegLoaded(true);
        setStatus("Click to start recording");
      } catch (error) {
        console.error("Error loading FFmpeg:", error);
        setStatus("Error loading dependencies");
      }
    };
    
    loadDependencies();
  }, []);

  // Speak whenever `text` updates
  useEffect(() => {
    if (text) {
      cancel();
      speak({ text });
      setText("")
    }
  }, [text, speak]);

  // Initialize OpenAI client
  // Ypur API Key should look be something like "sk-proj-xxxxxxxxxxxxxxx"
  //const openai = new OpenAI({
  //  apiKey: "",
  //  dangerouslyAllowBrowser: true,
  //});

  // Flask Endpoint 
  const FLASK_BASE_URL = "http://LOCALHOST:5000";

  // Recording state management
  const [recordingTimeout, setRecordingTimeout] = useState(null);
  const [mediaRecorderRef, setMediaRecorderRef] = useState(null);
  // const [streamRef, setStreamRef] = useState(null);
  // const [audioChunks, setAudioChunks] = useState([]);

  const handleYesOrReset = () => {
    // setRecording(false);
    cancel();
    setSuggestions([]);
    setTranscription("");
    setStatus("Click to start recording");
  };

  const handleNo = () => {
    cancel();
    if (suggestionValid1) {
      setSuggestionValid1(false);
      setText(suggestions[1]);
      setSuggestionValid2(true);
    } else if (suggestionValid2) {
      setSuggestionValid2(false);
      setSuggestionValid3(true);
      setText(suggestions[2]);
    } else if (suggestionValid3) {
      // setRecording(false);
      setSuggestions([]);
      setText("");
      setTranscription("");
      setSuggestionValid1(false);
      setSuggestionValid2(false);
      setSuggestionValid3(false);
    }
  };

  
  // Start Recording
  const startRecording = async () => {
    cancel();
    setStatus("Recording...");
    setRecording(true);
    // setAudioURL(null);
    setTranscription("");
    setSuggestions([]);
    setSuggestionValid1(true);
    setSuggestionValid2(false);
    setSuggestionValid3(false);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // setStreamRef(stream);
      
      const chunks = [];
      
      const mediaRecorder = new MediaRecorder(stream);
      setMediaRecorderRef(mediaRecorder);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        // const webmURL = URL.createObjectURL(audioBlob);
        // setAudioURL(webmURL);
        setStatus("Processing audio...");

        await convertAudioToMP3(audioBlob);
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      // Request data at 1 second intervals during recording
      mediaRecorder.start(1000);
      // setAudioChunks([]);
      
      // Set up automatic stop after 15 seconds
      const timeout = setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
          setRecording(false);
          setStatus("Processing audio...");
        }
      }, 15000);
      
      setRecordingTimeout(timeout);
    } catch (error) {
      console.error("Recording Error:", error);
      setStatus("Error accessing microphone");
      setRecording(false);
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (recordingTimeout) {
      clearTimeout(recordingTimeout);
      setRecordingTimeout(null);
    }
    
    if (mediaRecorderRef && mediaRecorderRef.state === "recording") {
      try {
        mediaRecorderRef.stop();
        setStatus("Processing audio...");
      } catch (error) {
        console.error("Error stopping media recorder:", error);
        setStatus("Error stopping recording");
      }
    }
    
    setRecording(false);
  };

  // Convert WebM to MP3 using FFmpeg
  const convertAudioToMP3 = async (audioBlob) => {
    if (!isFFmpegLoaded || !ffmpeg) {
      setStatus("FFmpeg not loaded");
      return;
    }

    try {
      setStatus("Converting audio...");
      
      // Import fetchFile
      const { fetchFile } = await import("@ffmpeg/util");
      
      // Write the input file to FFmpeg's virtual file system
      await ffmpeg.writeFile("input.webm", await fetchFile(audioBlob));
      
      // Run FFmpeg command to convert WebM to MP3
      await ffmpeg.exec(["-i", "input.webm", "-c:a", "libmp3lame", "output.mp3"]);
      
      // Read the output file
      const mp3Data = await ffmpeg.readFile("output.mp3");
      
      // Create a blob from the MP3 data
      const mp3Blob = new Blob([mp3Data], { type: "audio/mp3" });
      // const mp3URL = URL.createObjectURL(mp3Blob);
      // setAudioURL(mp3URL);
      
      setStatus("Transcribing...");
      await transcribeAudio(mp3Blob);
    } catch (error) {
      console.error("Conversion Error:", error);
      setStatus("Error converting audio");
    }
  };

  // Transcribe MP3 file with Whisper API (via Flask Proxy)
  const transcribeAudio = async (audioBlob) => {
    try {
      setStatus("Transcribing via Flask Proxy...");

      // 1. Create a File object from the Blob
      const file = new File([audioBlob], "audio.mp3", { type: "audio/mp3" });

      // 2. Create FormData object for file upload
      const formData = new FormData();
      formData.append("file", file);

      // 3. Send the file to your Flask transcription endpoint
      const response = await fetch(`${FLASK_BASE_URL}/api/transcribe`, {
        method: "POST",
        body: formData, // Flask handles the file/model fields from here
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Flask Error: ${response.status} - ${errorData.error}`);
      }

      const data = await response.json();
      const transcribedText = data.text; // Flask should return { text: "..." }

      setTranscription(transcribedText);
      setStatus("Generating suggestions...");

      await generateSuggestions(transcribedText);
    } catch (error) {
      console.error("Transcription Error:", error);
      setStatus(`Error in transcription: ${error.message}`);
    }
  };

  // Generate suggestions for the transcribed text
  const generateSuggestions = async (text) => {
    try {
      setStatus("Generating suggestions...");
      const general_context = `You are an expert in correcting speech errors for individuals with aphasia. 
          Your goal is to help users communicate clearly by correcting:
          - Missing function words (e.g., "Want go park" → "I want to go to the park.")
          - Word order mistakes (e.g., "Happy I today" → "I am happy today.")
          - Verb tense errors (e.g., "She go store" → "She went to the store.")
          - Word-finding difficulties (e.g., "Yesterday I... umm... thing... movie!" → "Yesterday I watched a movie.")
          - Phonemic and semantic paraphasias (e.g., "I need the skadoodle for my coffee" → "I need the spoon for my coffee.")
          - Repetitions and perseverations (e.g., "I go go store" → "I am going to the store.")

          **Important**: 
          1. Whenever possible, assume the user is speaking about themselves in the first person ("I", "me"), **unless** the input explicitly mentions another subject like “he,” “she,” or a name. 
          2. Keep responses simple, clear, and grammatically correct while preserving meaning.
          3. Use natural, conversational language.

          Examples:

          Input: "He eat yesterday"
          Output: "He ate yesterday."

          Input: "She book read"
          Output: "She is reading a book."

          Input: "I not speak good me help you"
          Output: "I need help speaking better."

          Input: "Want go park"
          Output: "I want to go to the park."

          Input: "No no no I want not"
          Output: "No, I don’t want that."

          Input: "I need... uh... water... thing"
          Output: "I need a bottle of water."

          Input: "She went to the flamboozle."
          Output: "She went to the market."

          Input: "I happy today!"
          Output: "I am happy today!"
          `
        
      // 1. Send the prompt and context to the Flask suggestion endpoint
      const response = await fetch(`${FLASK_BASE_URL}/api/suggest`, {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify({
              user_text: text, // The transcribed text
              context: general_context, // The system instructions
          }),
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Flask Error: ${response.status} - ${errorData.error}`);
      }
      
      const data = await response.json();
      const content = data.content; // Flask should return { content: "..." }
      
      // Parse the suggestions from the response
      const suggestionsList = content
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      setSuggestions(suggestionsList);
      // setSpeechText(suggestionsList[0]);
      setText(suggestionsList[0]);
      setStatus("Suggestions ready");
    } catch (error) {
      console.error("Suggestion Error:", error);
      setStatus("Error generating suggestions");
    }
  };

  return (
    <div className="container">
      <h1>Aphasia Assistant</h1>
      
      <div style={{display: 'flex', justifyContent: 'center'}}>
        <button 
          onClick={recording ? stopRecording : startRecording} 
          disabled={!isFFmpegLoaded} 
          className={`recording-btn ${recording ? 'recording' : ''}`}
        >
          {/* {recording ? "Stop Recording" : "Start Recording "} */}
          <img src={process.env.PUBLIC_URL + "/microphone.png"} alt="microphone icon" class="ear-icon" />
        </button>
      </div>
      
      {/* display status */}
      {/* <p className="status">{status}</p> */}
      
      {/* {audioURL && (
        <div className="audio-player">
          <audio controls>
            <source src={audioURL} type="audio/mp3" />
            Your browser does not support the audio element.
          </audio>
        </div>
      )} */}
      
      <div className="panel transcript-panel">
        {/* <p className="panel-heading-transcribed">Transcribed Text:</p> */}
        <p className="transcription-text">{transcription || "Waiting for input..."}</p>
      </div>
      
      <div className="panel suggestions-panel">
        {/* <p className="panel-heading">Suggested Alternatives:</p> */}
        {suggestions.length > 0 ? (
          <div className="suggestions-list">
            {suggestionValid1 && (
              <>
                <div>
                  <p className="suggestion-text">{suggestions[0] ? suggestions[0] : "Suggestion 1"}</p>
                </div>
                <div className="button-group">
                  <button className="hear-btn" onClick={() => setText(suggestions[0])}>
                    <img src={process.env.PUBLIC_URL + "/ear2.svg"} alt="ear icon" class="ear-icon" />
                  </button>
                  <button className="yes-btn" onClick={handleYesOrReset}>
                    <img src={process.env.PUBLIC_URL + "/happy2.svg"} alt="happy icon" class="happy-icon" />
                  </button>{" "}
                  <button className="no-btn" onClick={handleNo}>
                    <img src={process.env.PUBLIC_URL + "/sad2.svg"} alt="sad icon" class="sad-icon" /> 
                  </button>{" "}
                  {/* <button onClick={handleYesOrReset}>Reset</button> */}
                </div>
              </>
                
              )}

              {suggestionValid2 && (
              <>  
                <div>
                  <p className="suggestion-text">{suggestions[1] ? suggestions[1] : "Suggestion 2"}</p>
                </div>
                <div className="button-group">
                  <button className="hear-btn" onClick={() => setText(suggestions[1])}>
                    <img src={process.env.PUBLIC_URL + "/ear2.svg"} alt="ear icon" class="ear-icon" />
                  </button>
                  <button className="yes-btn" onClick={handleYesOrReset}>
                    <img src={process.env.PUBLIC_URL + "/happy2.svg"} alt="happy icon" class="happy-icon" />
                  </button>{" "}
                  <button className="no-btn" onClick={handleNo}>
                    <img src={process.env.PUBLIC_URL + "/sad2.svg"} alt="sad icon" class="sad-icon" /> 
                  </button>{" "}
                  {/* <button onClick={handleYesOrReset}>Reset</button> */}
                </div>
              </>
              )}

              {suggestionValid3 && (
                <>
                  <div>
                  <p className="suggestion-text">{suggestions[2] ? suggestions[2] : "Suggestion 3"}</p>
                </div>
                <div className="button-group">
                  <button className="hear-btn" onClick={() => setText(suggestions[2])}>
                    <img src={process.env.PUBLIC_URL + "/ear2.svg"} alt="ear icon" class="ear-icon" />
                  </button>
                  <button className="yes-btn" onClick={handleYesOrReset}>
                    <img src={process.env.PUBLIC_URL + "/happy2.svg"} alt="happy icon" class="happy-icon" />
                  </button>{" "}
                  <button className="no-btn" onClick={handleNo}>
                    <img src={process.env.PUBLIC_URL + "/sad2.svg"} alt="sad icon" class="sad-icon" /> 
                  </button>{" "}
                  {/* <button onClick={handleYesOrReset}>Reset</button> */}
                </div>
                </>
              )}
              {/* <button onClick={handleYesOrReset}>Reset</button> */}
              
          </div>
        ) : (
          <p className="suggestion-text">No suggestions available</p>
        )}
      </div>
      
      {/* <div className="footer">
        <p>© 2025 Aphasia Assistant</p>
      </div> */}
    </div>
  );
}

export default App;

// "homepage": "https://run.pavlovia.org/nozarilab/aphasia-support",