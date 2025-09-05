"""Simple CLI demo for LangChain Interview Bot.

This script asks the user a few interview questions, stores
responses, and summarises the conversation using LangChain.
If an OpenAI API key is available, it will use ChatOpenAI for
summarisation. Otherwise a fake LLM is used so the demo can run
offline.
"""

from __future__ import annotations

import json
import os
from typing import List, Dict

from langchain.chains import LLMChain
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate


def _load_llm():
    """Return an LLM instance.

    If ``OPENAI_API_KEY`` is set, the OpenAI chat model is used.
    Otherwise a ``FakeListLLM`` provides deterministic responses so the
    demo can run without external dependencies.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        from langchain_openai import ChatOpenAI

        # temperature 0 for deterministic behaviour
        return ChatOpenAI(temperature=0)
    else:
        from langchain_community.llms.fake import FakeListLLM

        # One response for the summary chain.
        return FakeListLLM(responses=["(mock) Summary not available without an API key."])


def run_interview(questions: List[str]) -> Dict[str, List[Dict[str, str]]]:
    """Conduct a simple interview and return the transcript and summary."""
    llm = _load_llm()
    memory = ConversationBufferMemory(return_messages=True)
    conversation = ConversationChain(llm=llm, memory=memory)

    transcript: List[Dict[str, str]] = []
    for q in questions:
        print(f"\nInterviewer: {q}")
        answer = input("You: ")
        transcript.append({"question": q, "answer": answer})
        # store the turn in memory
        conversation.predict(input=answer)

    # Summarise the conversation
    prompt = PromptTemplate.from_template(
        "Summarise the following interview transcript:\n{transcript}"
    )
    summary_chain = LLMChain(llm=llm, prompt=prompt)
    formatted = "\n".join(
        f"Q: {t['question']}\nA: {t['answer']}" for t in transcript
    )
    summary = summary_chain.run(transcript=formatted).strip()

    return {"transcript": transcript, "summary": summary}


def main() -> None:
    questions = [
        "Tell me about yourself.",
        "What is one strength you bring to a team?",
        "Describe a challenge you've overcome.",
    ]
    result = run_interview(questions)
    # Save transcript
    with open("transcript.json", "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)
    print("\nInterview summary:\n" + result["summary"])


if __name__ == "__main__":
    main()
