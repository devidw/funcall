import { z } from "zod"
import dedent from "dedent"
import { zodToJsonSchema } from "zod-to-json-schema"
import { load } from "cheerio"

type OurZodSchema = { name: string; arguments: object }

export class Tool<S extends z.Schema<OurZodSchema>> {
  schema: S
  name: S["_input"]["name"]
  description: string

  constructor({
    schema,
    name,
    description,
  }: {
    schema: S
    name: S["_input"]["name"]
    description: string
  }) {
    this.schema = schema
    this.name = name
    this.description = description
  }

  toJSON() {
    return {
      type: "function",
      function: {
        name: this.name,
        description: this.description,
        parameters: (() => {
          const out = zodToJsonSchema(this.schema)

          // delete out["$schema"]
          // delete out["additionalProperties"]

          // @ts-ignore
          const tmp = out["properties"]["arguments"]

          delete tmp["additionalProperties"]

          return tmp
        })(),
      },
    }
  }

  toString() {
    return JSON.stringify(this.toJSON())
  }
}

export class Functhem<T extends Tool<z.Schema<OurZodSchema>>> {
  tools: T[]

  constructor(tools: T[]) {
    this.tools = tools
  }

  getSysMsg() {
    return dedent(`
    You are a function calling AI model. You are provided with function signatures within <tools></tools> XML tags. You may call one or more functions to assist with the user query. Don't make assumptions about what values to plug into functions. Here are the available tools: <tools> ${this.tools.map((a) => a.toString()).join("\n")} </tools> Use the following pydantic model json schema for each tool call you will make: {"title": "FunctionCall", "type": "object", "properties": {"arguments": {"title": "Arguments", "type": "object"}, "name": {"title": "Name", "type": "string"}}, "required": ["arguments", "name"]} For each function call return a json object with function name and arguments within <tool_call></tool_call> XML tags as follows:
    <tool_call>
    {"arguments": <args-dict>, "name": <function-name>}
    </tool_call>
    `).trim()
  }

  /**
   *
   */
  parseOut(input: string) {
    const results: T["schema"]["_output"][] = []

    const $ = load(input)

    $("tool_call").each((i, el) => {
      let txt = $(el).text()
      txt = txt.trim()
      txt = txt.endsWith("\\") ? txt.slice(0, -1) : txt
      try {
        const parsed = JSON.parse(txt)
        for (const tool of this.tools) {
          if (parsed.name !== tool.name) {
            continue
          }

          const out = tool.schema.parse(parsed)
          results.push(out)
        }
      } catch (e) {
        console.warn(e)
      }
    })

    return results
  }
}

if (import.meta.url === `file://${process.argv[1]}.ts`) {
  //
}
