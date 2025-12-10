import { z } from "zod";
import { EXTERNAL_AGENT_ID_HEADER }  from "@shared";

export const commonHeaders = {
  [EXTERNAL_AGENT_ID_HEADER]: z
    .string()
    .optional()
    .describe("Optional external agent ID for tracking interactions across systems"),
};
