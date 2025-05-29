// lib/database.ts

import { v4 as uuidv4, validate as isValidUUID } from "uuid"

// Example function (replace with your actual database interaction logic)
export async function saveClientData(client: any): Promise<string> {
  const clientId = uuidv4()
  const dbRow = clientToDbRow(client, clientId)

  // Simulate saving to a database
  console.log("Saving to database:", dbRow)

  return clientId
}

function clientToDbRow(client: any, clientId: string): any {
  return {
    id: clientId,
    name: client.name,
    email: client.email,
    // Update the database functions to handle the corrected foreign key structure
    // In the clientToDbRow function, ensure we only set prompt_template_id when it's a valid UUID

    // Replace the prompt configuration section in clientToDbRow function:
    // Only persist prompt configuration if the template ID is a valid UUID
    prompt_template_id:
      client.prompt_config?.template_id && isValidUUID(client.prompt_config.template_id)
        ? client.prompt_config.template_id
        : null,
    prompt_template_name:
      client.prompt_config?.template_id && isValidUUID(client.prompt_config.template_id)
        ? client.prompt_config.template_name
        : null,
    prompt_final_content:
      client.prompt_config?.template_id && isValidUUID(client.prompt_config.template_id)
        ? client.prompt_config.final_content
        : null,
    prompt_config:
      client.prompt_config?.template_id && isValidUUID(client.prompt_config.template_id)
        ? {
            assistant_config: client.prompt_config.assistant_config,
            placeholders_filled: client.prompt_config.placeholders_filled,
          }
        : null,
  }
}
