import { z } from "zod"
import { Tool, Functhem } from "./lib.js"
import fs from "node:fs"

const happySchema = z.object({
  name: z.literal("isHappy"),
  arguments: z.object({
    isHappy: z.boolean(),
  }),
})

const happyTool = new Tool<typeof happySchema>({
  name: "isHappy",
  description: "Is the user happy?",
  schema: happySchema,
})

const movieSchema = z.object({
  name: z.literal("watchMovie"),
  arguments: z.object({
    genre: z.string(),
  }),
})

const movieTool = new Tool<typeof movieSchema>({
  name: "watchMovie",
  description:
    "Does the user express that they want to see a movie, if so, which genre?",
  schema: movieSchema,
})

const functhem = new Functhem([happyTool, movieTool])

const out = await fetch("http://localhost:1234/v1/chat/completions", {
  method: "POST",
  headers: {
    "content-type": "application/json",
  },
  body: JSON.stringify({
    user_bio: "",
    model: "NousResearch/Hermes-2-Pro-Llama-3-8B",
    messages: [
      {
        role: "system",
        content: functhem.getSysMsg(), // <-- HERE
      },
      {
        role: "user",
        content: `Input: so stressed, just want to see a funny movie\nProcess the user input with your tools.`,
      },
    ],
  }),
})

if (out.status !== 200) {
  throw Error(out.statusText)
}

const outJson = await out.json()

const content = outJson.choices[0].message.content
console.log(`_${content}_`)

const outCalls = functhem.parseOut(content) // <-- HERE

outCalls.forEach((one) => {
  switch (one.name) {
    case "isHappy": {
      console.log(one.arguments.isHappy)
      break
    }
    case "watchMovie": {
      console.log(one.arguments.genre)
      break
    }
  }
})

fs.writeFileSync("./sample.json", JSON.stringify(outCalls, null, 4))
