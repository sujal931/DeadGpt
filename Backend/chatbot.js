import 'dotenv/config';
import Groq from "groq-sdk";
import { tavily } from '@tavily/core';
import NodeCache from "node-cache";

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const cache = new NodeCache({ stdTTL: 60 * 60 * 24 }); //24 hrs

export async function generate(userMessage, convoId) {


    const baseMessages = [{
        role: "system",
        content: `You are Deadpool,a smart personal assistant.
                If you know the answer to a question, answer it directly in plain English.
                If the answer requires real-tirne, local, or up-to-date information, or if you don't know the answer,
                You have access to the following tool:
                webSearch(query: string): Use this to search the internet for current or unknown information.
                Decide when to use your own knowledge and when to use the tool.
                Do not rnention the tool unless neede

                Example:
                Q: What is the capital of France?
                A: The capital of France is Paris.

                Q: What's the weather in MI-nairight now?
                A: (use the search tool to find the latest weather
                Q: Who is the Prime Minister of India?
                A: The current Prirne Minister of India is Narendra Modi.
                Q: Tell me the latest IT news.
                A: (use the search tool to get the latest news)

                // 2.current Date and time : ${new Date().toUTCString()} `,

    },
        // {
        //     role: "user",
        //     content: "hi"
        //     //What is the result between Nepal and Bangladesh A in the ongoing topend t20 ?
        // },
    ]

    const message = cache.get(convoId) ?? baseMessages;


    message.push({
        role: "user",
        content: userMessage
    })

    const MAX_RETRIES = 10;
    let count = 0;

    while (true) {

        if (count > MAX_RETRIES) {
            return "I didn't find any information about that,Please try again.";
        }
        count++;

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            temperature: 0,
            messages: message,
            tools: [
                {
                    type: "function",
                    function: {
                        name: "webSearch",
                        description: "Search for real-time infrormation and real-time daya",
                        parameters: {
                            type: "object",
                            properties: {
                                query: {
                                    type: "string",
                                    description: "The search query to perform search on."
                                },
                            },
                            required: ["query"]
                        }
                    }
                }
            ],
            tool_choice: "auto"

        });

        message.push(completion.choices[0].message);


        const toolCall = completion.choices[0].message.tool_calls;

        if (!toolCall) {
            //here we end the chatbot response
            cache.set(convoId, message)
            return completion.choices[0].message.content

        }

        for (const tool of toolCall) {
            {
                // console.log(`tool :${tool}`);
                const functionName = tool.function.name;
                const param = tool.function.arguments;

                if (functionName == "webSearch") {
                    // Handle both string and object cases for parameters
                    const parsedParam = typeof param === 'string' ? JSON.parse(param) : param;
                    const toolResult = await webSearch(parsedParam);
                    // console.log(`tool : ${toolResult}`);

                    message.push({
                        tool_call_id: tool.id,
                        role: "tool",
                        name: functionName,
                        content: toolResult
                    })

                }
            }
        }
    }
}







async function webSearch({ query }) {
    //we will call tavily api here\
    console.log("Calling web Search...");
    const response = await tvly.search(query);

    const finalResult = await response.results.map((result) => result.content).join("\n\n");



    return finalResult;

}
