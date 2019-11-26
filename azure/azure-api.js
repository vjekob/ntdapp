const GET_NOTIFICATIONS = "<put_your_azure_function_url_here>";

export const getNotifications = async lastGeneration => {
    const result = await fetch(GET_NOTIFICATIONS);
    const json = await result.json();
    if (json.generation === lastGeneration)
        return { lastGeneration };

    const output = { lastGeneration: json.generation, notifications: [] };
    for (let generation = lastGeneration + 1; generation <= json.generation; generation++)
    {
        for (let notification of json[generation])
            output.notifications.push(notification)
    }

    return output;
}