import { z } from "zod";

// ---------- Types ----------
export type ExhibitKind = "pie" | "bar" | "line" | "table" | "image";

export interface Exhibit {
  id: number;
  title: string;
  type: ExhibitKind;
  data: unknown;         // Renderers will cast as needed
}

export interface ParsedReply {
  prose: string;         // text shown in chat bubble
  exhibits: Exhibit[];   // 0..n cards for side-panel
}

// ---------- Zod validator ----------
// Revert to simpler schema definition
const ExhibitSchema = z.object({
  title: z.string(),
  type: z.enum(["pie", "bar", "line", "table", "image"]),
  data: z.any(), 
});

// ---------- main fn ----------
export function parseReply(raw: string): ParsedReply {
  // Handle null or empty input gracefully
  if (!raw) {
      return { prose: '', exhibits: [] };
  }
    
  const parts = raw.split(/<EXHIBIT>|<\/EXHIBIT>/);
  const prosePart = parts[0] || ''; // Ensure prosePart is always a string
  const exhibits: Exhibit[] = [];

  // Check if there are any potential exhibit blocks
  if (parts.length > 1) {
      // every odd index (1,3,5,…) should hold JSON
      for (let i = 1; i < parts.length; i += 2) {
          const potentialJson = parts[i];
          if (potentialJson) { // Ensure the block is not empty
              try {
                  // Attempt to parse, ensuring it's valid JSON before Zod parse
                  const jsonData = JSON.parse(potentialJson);
                  const validationResult = ExhibitSchema.safeParse(jsonData);
                  if (validationResult.success) {
                    // Explicitly check if data exists before pushing
                    if (validationResult.data.data !== undefined && validationResult.data.data !== null) {
                         // Assign a unique ID *after* validation
                        // Explicitly assign properties instead of spreading to satisfy TypeScript
                        const exhibitWithId: Exhibit = {
                            id: Date.now() + Math.random(), // Add unique ID
                            title: validationResult.data.title,
                            type: validationResult.data.type,
                            data: validationResult.data.data // Assign the validated data
                        };
                        exhibits.push(exhibitWithId);
                    } else {
                        console.warn("Invalid exhibit structure: data field is missing or null", potentialJson);
                    }
                  } else {
                    console.warn("Invalid exhibit structure:", validationResult.error, potentialJson);
                  }
              } catch (e) {
                  console.warn("Bad exhibit JSON", potentialJson, e);
              }
          }
      }
  }

  return { prose: prosePart.trim(), exhibits };
}
 