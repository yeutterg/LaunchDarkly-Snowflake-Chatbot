const { init } = require('@launchdarkly/node-server-sdk');
const { initAi } = require('@launchdarkly/server-sdk-ai');

let ldClient;
function getSDKClient() {
    if (!ldClient) {
        ldClient = init(process.env.LAUNCHDARKLY_SDK_KEY);
    }
    return ldClient;
}

let aiClient;
function getAIClient() {
    if (!aiClient) {
        aiClient = initAi(getSDKClient());
    }
    return aiClient;
}

// Initialize and return the LaunchDarkly clients
async function getLaunchDarklyClients() {
    const ldClient = getSDKClient();
    const aiClient = getAIClient();

    try {
        await ldClient.waitForInitialization({ timeout: 10 });
    } catch (err) {
        console.error('Failed to initialize LaunchDarkly:', err);
    }

    return { ldClient, aiClient };
}

async function closeLaunchDarklyClients() {
    if (ldClient) {
        await ldClient.flush();
        ldClient.close();
    }
}

module.exports = {
    getLaunchDarklyClients,
    closeLaunchDarklyClients
}; 