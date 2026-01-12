import { Octokit } from "octokit";

export const createRepository = async (accessToken: string, repoName: string) => {
    const octokit = new Octokit({ auth: accessToken });
    try {
        // Check if repo exists
        try {
            await octokit.rest.repos.get({
                owner: (await octokit.rest.users.getAuthenticated()).data.login,
                repo: repoName,
            });
            return { success: true, message: "Repository already exists" };
        } catch (e) {
            // Repo doesn't exist, create it
        }

        await octokit.rest.repos.createForAuthenticatedUser({
            name: repoName,
            private: true, // Default to private
            auto_init: true,
        });
        return { success: true, message: "Repository created" };
    } catch (error) {
        console.error("Error creating repository:", error);
        return { success: false, error };
    }
};

export const createOrUpdateFile = async (
    accessToken: string,
    repoName: string,
    path: string,
    content: string,
    message: string
) => {
    const octokit = new Octokit({ auth: accessToken });
    try {
        const owner = (await octokit.rest.users.getAuthenticated()).data.login;

        // Ensure repo exists
        try {
            await octokit.rest.repos.get({ owner, repo: repoName });
        } catch (e) {
            // Repo doesn't exist, create it
            await octokit.rest.repos.createForAuthenticatedUser({
                name: repoName,
                private: true,
                auto_init: true,
            });
            // Wait a bit for initialization
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        let sha: string | undefined;

        try {
            const { data } = await octokit.rest.repos.getContent({
                owner,
                repo: repoName,
                path,
            });
            if (!Array.isArray(data) && data.sha) {
                sha = data.sha;
            }
        } catch (e) {
            // File doesn't exist, create new
        }

        await octokit.rest.repos.createOrUpdateFileContents({
            owner,
            repo: repoName,
            path,
            message,
            content: Buffer.from(content).toString("base64"),
            sha,
        });
        return { success: true, message: "File updated" };
    } catch (error) {
        console.error("Error updating file:", error);
        return { success: false, error };
    }
};

export const getNextSequenceNumber = async (
    accessToken: string,
    repoName: string,
    folderPath: string,
    fileBaseName: string,
    extension: string
) => {
    const octokit = new Octokit({ auth: accessToken });
    try {
        const owner = (await octokit.rest.users.getAuthenticated()).data.login;
        let maxNum = 0;

        try {
            const { data } = await octokit.rest.repos.getContent({
                owner,
                repo: repoName,
                path: folderPath,
            });

            if (Array.isArray(data)) {
                // Escape special regex characters in fileBaseName
                const escapedBaseName = fileBaseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`^${escapedBaseName} - (\\d+)\\.${extension}$`);

                data.forEach((file: any) => {
                    if (file.type === "file") {
                        const match = file.name.match(regex);
                        if (match) {
                            const num = parseInt(match[1]);
                            if (!isNaN(num) && num > maxNum) {
                                maxNum = num;
                            }
                        }
                    }
                });
            }
        } catch (e) {
            // Folder doesn't exist
        }

        return maxNum + 1;
    } catch (error) {
        console.error("Error getting sequence number:", error);
        return 1;
    }
};

export const getNextFolderSequence = async (
    accessToken: string,
    repoName: string,
    parentPath: string,
    folderPrefix: string
) => {
    const octokit = new Octokit({ auth: accessToken });
    try {
        const owner = (await octokit.rest.users.getAuthenticated()).data.login;

        let maxNum = 0;

        try {
            const { data } = await octokit.rest.repos.getContent({
                owner,
                repo: repoName,
                path: parentPath,
            });

            if (Array.isArray(data)) {
                const regex = new RegExp(`^${folderPrefix} - (\\d+)$`);

                data.forEach((item: any) => {
                    if (item.type === "dir") {
                        const match = item.name.match(regex);
                        if (match) {
                            const num = parseInt(match[1]);
                            if (!isNaN(num) && num > maxNum) {
                                maxNum = num;
                            }
                        }
                    }
                });
            }
        } catch (e) {
            // Parent folder doesn't exist, start at 0
        }

        return maxNum + 1;
        return maxNum + 1;
    } catch (error) {
        console.error("Error getting folder sequence:", error);
        return 1;
    }
};

// Robust Helper to get GitHub Access Token
// 1. Checks User.githubAccessToken (Legacy/Direct)
// 2. Checks Account table (NextAuth linked account)
// This fixes issues where user email differs from GitHub email
import { db } from "@/lib/db";

export const getGitHubAccessToken = async (userId: string): Promise<string | null> => {
    try {
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { githubAccessToken: true },
            // Relations logic handled separately for optimization
        });

        if (user?.githubAccessToken) {
            return user.githubAccessToken;
        }

        // Fallback: Check Account table
        const account = await db.account.findFirst({
            where: {
                userId,
                provider: "github"
            },
            select: { access_token: true }
        });

        if (account?.access_token) {
            return account.access_token;
        }

        return null;
    } catch (error) {
        console.error("Error retrieving GitHub access token:", error);
        return null;
    }
};
