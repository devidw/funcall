<h1 align=center>
    functhem
</h1>

ease the integration of [hermes function calling prompt format](https://github.com/NousResearch/Hermes-Function-Calling#prompt-format-for-function-calling)
into typescript ecosystem with typed function calls

## what it can do

- generate system message prompt with your defined tools, zod to json schema
- parse tool call output -> typed

## installation

```console
pnpm add functhem
```

## usage

```ts
import { z } from "zod"
import { Tool, Functhem } from "functhem"

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

const sysMsg = functhem.getSysMsg()

const output = await yourInferenceFunction({
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
})

const outCalls = functhem.parseOut(output) // <-- HERE

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
```