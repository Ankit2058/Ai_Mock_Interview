from __future__ import annotations

from typing import List, Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain.chains import ConversationChain, LLMChain
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate

from demo_app import _load_llm

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

questions = [
    "Tell me about yourself.",
    "What is one strength you bring to a team?",
    "Describe a challenge you've overcome.",
]

transcript: List[Dict[str, str]] = []
llm = _load_llm()
memory = ConversationBufferMemory(return_messages=True)
conversation = ConversationChain(llm=llm, memory=memory)


class Response(BaseModel):
    question: str
    answer: str


@app.get("/questions")
def get_questions() -> Dict[str, List[str]]:
    return {"questions": questions}


@app.post("/responses")
def post_response(resp: Response) -> Dict[str, str]:
    transcript.append(resp.dict())
    conversation.predict(input=resp.answer)
    return {"status": "recorded"}


@app.get("/summary")
def get_summary() -> Dict[str, str]:
    prompt = PromptTemplate.from_template(
        "Summarise the following interview transcript:\n{transcript}"
    )
    summary_chain = LLMChain(llm=llm, prompt=prompt)
    formatted = "\n".join(
        f"Q: {t['question']}\nA: {t['answer']}" for t in transcript
    )
    summary = summary_chain.run(transcript=formatted).strip()
    return {"summary": summary}
