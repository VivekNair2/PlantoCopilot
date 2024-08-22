from dotenv import load_dotenv
from groq import Groq
from flask import Flask, request, jsonify
import os
from langchain_google_genai import ChatGoogleGenerativeAI
import textwrap
from IPython.display import Markdown, display
import markdown2
from flask_cors import CORS

load_dotenv()
app = Flask(__name__)
CORS(app)  

client = Groq(api_key=os.getenv('GROQ_API_KEY'))
google_api_key = os.getenv('GOOGLE_API_KEY')
llm = ChatGoogleGenerativeAI(model="gemini-pro", google_api_key=google_api_key)

def to_markdown(text):
    text = text.replace('•', '  *')
    return Markdown(textwrap.indent(text, '> ', predicate=lambda _: True))

@app.route("/generate-code", methods=['POST','GET'])
def generate():
    query = request.form.get('query')
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": f"Give a code on this {query} remember I don't need anything besides the code, no text, no description"
            }
        ],
        model="llama3-8b-8192"
    )
    code = chat_completion.choices[0].message.content
    return code

@app.route("/explain-code", methods=['POST','GET'])
def explain_code():
    code = request.get_json().get('code')
    explanation = explain_code_function(code)
    return jsonify(explanation) # Return HTML directly

def explain_code_function(code):
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": f"Explain the following code use : {code}"
            }
        ],
        model="llama3-8b-8192"
    )
    explanation = chat_completion.choices[0].message.content
    markdown_explanation = markdown2.markdown(explanation)
    return markdown_explanation


@app.route("/debug-code", methods=['POST','GET'])
def debug_code():
    code = request.get_json().get('code')
    debugged_code = debug_code_function(code)
    return jsonify({'code': debugged_code})

def debug_code_function(code):
    prompt = f"solve the error of the following code and remember don't add extra code, just debug the errors and return the entire updated with comments showing the changes made:\n\n{code}"
    result = llm.invoke(prompt)
    debugged_code = result.content
    return debugged_code

@app.route("/run-code", methods=['POST','GET'])
def run_code():
    data = request.get_json()
    code = data.get('code')
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": f"U have to act like a compiler, compile this code:\n\n{code}\n\nand only give the output this code will give. If any error, also give the error in the way a terminal gives remeber DON'T FIX THE CODE"
            }
        ],
        model="llama3-8b-8192"
    )
    output = chat_completion.choices[0].message.content
    return jsonify({'output': output})

@app.route("/test",methods=['POST','GET'])
def test():
    output="the route is working"
    return jsonify({'output':output})

    
if __name__ == '__main__':
    app.run(debug=True)