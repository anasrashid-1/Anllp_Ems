import React, { useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import BackgroundService from 'react-native-background-actions';

const Home: React.FC = () => {
  const [isServiceRunning, setIsServiceRunning] = useState(false);

  // Sleep function for delays in background task
  const sleep = (time: number) => new Promise<void>((resolve) => setTimeout(resolve, time));

  // The background task that runs in a loop
  const veryIntensiveTask = async (taskDataArguments: any) => {
    const { delay } = taskDataArguments;
    let i = 0;

    // Set the initial notification
    await BackgroundService.updateNotification({
      taskTitle: 'Background Task Running',
      taskDesc: 'Starting loop...',
      color: '#ff00ff',
      taskIcon: {
        name: 'ic_launcher', // Make sure this icon exists in mipmap folder
        type: 'mipmap',
      },
    });

    while (BackgroundService.isRunning()) {
      console.log(`Running count: ${i}`);
      await BackgroundService.updateNotification({
        taskDesc: `Count: ${i}`, // Update the task description in the notification
      });
      i++;
      await sleep(delay); // Sleep for the specified delay (1 second)
    }
  };

  // Options for the background task
  const options = {
    taskName: 'Example Task',
    taskTitle: 'Running Background Task',
    taskDesc: 'A background task running in an infinite loop.',
    taskIcon: {
      name: 'ic_launcher', // Make sure this icon exists in mipmap folder
      type: 'mipmap',
    },
    color: '#ff00ff',
    linkingURI: 'yourSchemeHere://chat/jane', // Example for deep linking
    parameters: {
      delay: 1000, // Delay between iterations (1 second)
    },
    foreground: true, // Keep the task in the foreground
  };

  // Start the background service
  const startTracking = async () => {
    try {
      setIsServiceRunning(true);
      await BackgroundService.start(veryIntensiveTask, options);
      console.log('Background service started');
    } catch (error) {
      console.error('Error starting background service:', error);
      Alert.alert('Error', 'Could not start background service.');
      setIsServiceRunning(false);
    }
  };

  // Stop the background service
  const stopTracking = async () => {
    try {
      await BackgroundService.stop();
      setIsServiceRunning(false);
      console.log('Background service stopped');
    } catch (error) {
      console.error('Error stopping background service:', error);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>
        {isServiceRunning ? 'Background service running' : 'Background service stopped'}
      </Text>
      <Button
        title={isServiceRunning ? 'Stop service' : 'Start service'}
        onPress={isServiceRunning ? stopTracking : startTracking}
      />
    </View>
  );
};

export default Home;











