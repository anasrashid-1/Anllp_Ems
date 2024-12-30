export const formatTime = (checkInTime: string | null | undefined): string => {
    if (!checkInTime) {
        return 'Invalid time';
    }

    const checkInDate = new Date(checkInTime);

    if (isNaN(checkInDate.getTime())) {
        return 'Invalid time';
    }

    return checkInDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC',
    });
};
