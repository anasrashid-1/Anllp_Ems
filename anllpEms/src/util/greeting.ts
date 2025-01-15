function getGreeting(employeeName: string): { firstLine: string; secondLine: string } {
  const hours = new Date().getHours();
  let timeOfDay = '';

  if (hours >= 5 && hours < 12) {
    timeOfDay = 'Morning';
  } else if (hours >= 12 && hours < 17) {
    timeOfDay = 'Afternoon';
  } else {
    timeOfDay = 'Evening';
  }

  const trimmedName = employeeName.length > 5 ? employeeName.slice(0, 5) : employeeName;
  return {
    firstLine: `${timeOfDay}, ${trimmedName}`,
    secondLine: "Manage your working day.",
  };
}

export default getGreeting;
