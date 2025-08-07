import type { MentionPattern } from "./mention-replacer";

// Slack mention pattern
export const SLACK_MENTION_PATTERN: MentionPattern = {
	regex: /<@([A-Z0-9]+)>/g,
	extractUserId: (match: string) => match.match(/<@([A-Z0-9]+)>/)?.[1] || "",
	formatReplacement: (userName: string) => `@${userName}`,
};

// Microsoft Teams mention pattern
export const TEAMS_MENTION_PATTERN: MentionPattern = {
	regex: /<at id="([^"]+)">([^<]+)<\/at>/g,
	extractUserId: (match: string) => match.match(/<at id="([^"]+)">/)?.[1] || "",
	formatReplacement: (userName: string) => `@${userName}`,
};

// WhatsApp mention pattern (if they have mentions)
export const WHATSAPP_MENTION_PATTERN: MentionPattern = {
	regex: /@(\d+)/g, // Example: @1234567890
	extractUserId: (match: string) => match.match(/@(\d+)/)?.[1] || "",
	formatReplacement: (userName: string) => `@${userName}`,
};

// Discord mention pattern
export const DISCORD_MENTION_PATTERN: MentionPattern = {
	regex: /<@!?(\d+)>/g, // Supports both <@123456789> and <@!123456789>
	extractUserId: (match: string) => match.match(/<@!?(\d+)>/)?.[1] || "",
	formatReplacement: (userName: string) => `@${userName}`,
};

// Platform to pattern mapping
export const PLATFORM_MENTION_PATTERNS: Record<string, MentionPattern> = {
	slack: SLACK_MENTION_PATTERN,
	"microsoft-teams": TEAMS_MENTION_PATTERN,
	whatsapp: WHATSAPP_MENTION_PATTERN,
	discord: DISCORD_MENTION_PATTERN,
};

// Helper function to get mention pattern for a platform
export function getMentionPattern(platformName: string): MentionPattern | null {
	const normalizedPlatform = platformName.toLowerCase();
	return PLATFORM_MENTION_PATTERNS[normalizedPlatform] || null;
}
