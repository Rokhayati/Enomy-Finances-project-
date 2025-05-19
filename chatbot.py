import os
from bs4 import BeautifulSoup
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_community.llms import Ollama
from langchain.chains import RetrievalQA
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.docstore.document import Document

# 📁 Your website project path
project_folder = "/Users/dabarokhayamwekoukouthioye/Downloads/tushar_currency_app_full"



# 🔍 Load all HTML files from the folder and subfolders
def load_html_recursively(folder_path):
    docs = []
    for root, dirs, files in os.walk(folder_path):
        for filename in files:
            if filename.endswith(".html"):
                file_path = os.path.join(root, filename)
                with open(file_path, "r", encoding="utf-8") as f:
                    soup = BeautifulSoup(f, "html.parser")
                    text = soup.get_text(separator=" ")
                    docs.append(Document(page_content=text, metadata={"source": file_path}))
    return docs

# 🧠 Convert HTML text to vector embeddings
def setup_vector_store(documents):
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = splitter.split_documents(documents)
    embeddings = OllamaEmbeddings(model="llama3")
    vectorstore = Chroma.from_documents(chunks, embedding=embeddings)
    return vectorstore

# 🤖 Create chatbot chain
def create_chatbot(vectorstore):
    retriever = vectorstore.as_retriever()
    llm = Ollama(model="llama3")
    qa_chain = RetrievalQA.from_chain_type(llm=llm, retriever=retriever)
    return qa_chain

# 🚀 Run chatbot loop
def run_chat():
    print("Loading website data... please wait ⏳")
    documents = load_html_recursively(project_folder)
    store = setup_vector_store(documents)
    chatbot = create_chatbot(store)

    print("✅ Chatbot ready! Ask anything about your website. Type 'exit' to quit.")
    while True:
        question = input("🧠 You: ")
        if question.lower() in ["exit", "quit"]:
            break
        answer = chatbot.run(question)
        print("🤖 Bot:", answer)
        
# 🔁 Create chatbot once to avoid reloading every time
documents = load_html_recursively(project_folder)
store = setup_vector_store(documents)
chatbot = create_chatbot(store)

def run_chatbot_response(question):
    return chatbot.run(question)


if __name__ == "__main__":
    run_chat()
 