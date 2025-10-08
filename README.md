# Aphasia Assistant

This repository is for **Aphasia Assistant**, a large language model (LLM) based interface designed to support individuals with aphasia (IWA) in expressing their intended meaning and communicating more effectively.

## I. General Setup
> **NOTE**
> + This project uses the Whisper model, which requires an active OpenAI API key subscription. For more information, please refer to the [OpenAI API documentation](https://platform.openai.com/docs/).

### 1. Project Setup
Download the folder or clone the repository. The project directory should include the following folders and files:
> + `public/` 
> + `src/`
> + `.env`
> + `package.json`
> + `package-lock.json`
> + `README.md` (This File)  

#### 1.1 Install Node.js
This project requires [Node.js](https://nodejs.org/) to run. To check if `Node.js` is already installed on your system, open a terminal and run the following commands:

```bash
node -v
npm -v
```
If either command returns an error or is not recognized, you will need to install [Node.js](https://nodejs.org/) and restart your terminal. 

#### 1.2 Install Project Dependencies
In the project root directory, run the following command to install all required dependencies: 
```bash
npm install
```
If you encounter any errors during installation, try forcing the installation with:
```bash
npm install --force
```
>**NOTE**
>+ You may see warning messages during installation—these can typically be ignored.

### 2. API Key Configuration

Follow the instructions on the [OpenAI Platform](https://platform.openai.com/api-keys) to create your own API key. Once you have your API key:

#### 2.1 Set API Key in `.env`
Open the `.env` file in the root folder of the project and update the following line with your key:
```javascript
REACT_APP_OPENAI_API_KEY = 'Your_API_Key'
```
#### 2.2 Set API Key in `App.js`
In the `./src/App.js` file, update the `apiKey` variable (line 57) with the same key:
```javascript
const openai = new OpenAI({
   apiKey: 'Your_API_Key',
   dangerouslyAllowBrowser: true,
});
```
> **NOTE**  
> + Your API key should be in the format: `sk-proj-...`  
> + Make sure the API key is consistent in both places (`.env` and `App.js`) to ensure proper authentication.

### 3. Run the App Locally
#### 3.1 Set Homepage for Local Run
In the `package.json` file, set the `homepage` field to an empty string (line 5): 
```json
"homepage": ""
```
#### 3.2 Start the Development Server
In the terminal, use the following command to run the app locally: 
```bash
npm start
```
This will launch the app in your default browser at http://localhost:3000/.
