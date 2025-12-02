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
