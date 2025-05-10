import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

// Function to calculate working days and weekends in a given month and year
const calculateWorkingDays = (year: number, month: number) => {
  // Adjust month to 0-indexed (January is 0, December is 11)
  month = month - 1;

  // Get the number of days in the month
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const numberOfDaysInMonth = lastDayOfMonth.getDate();

  let workingDays = 0;
  let weekends = 0;

  // Loop through each day of the month
  for (let day = 1; day <= numberOfDaysInMonth; day++) {
    const currentDate = new Date(year, month, day);
    const dayOfWeek = currentDate.getDay(); // 0: Sunday, 1: Monday, ..., 6: Saturday

    // Check if the day is a weekend (Saturday or Sunday)
    // if (dayOfWeek === 0 || dayOfWeek === 6) {
    //     weekends++; // Saturday or Sunday
    // } else {
    //     workingDays++; // Monday to Friday
    // }

    if (dayOfWeek === 0) {
      weekends++; // Sunday
    } else {
      workingDays++; // Monday to Friday
    }
  }

  return {workingDays, weekends};
};

const WorkingDaysCard: React.FC = () => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // Get current month (1-indexed)

  const {workingDays} = calculateWorkingDays(year, month);

  return (
    <View style={styles.cardContainer}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Total working days for this month </Text>
        <View style={styles.colorDot}>
          <Text style={styles.colorDotText}>{workingDays}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5,
    marginBottom: 10,
  },
  textContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 4,
    alignItems: 'center',
  },
  colorDot: {
    backgroundColor: 'blue',
    width: 25,
    height: 25,
    borderRadius: 8,
    marginRight: 8,

    justifyContent: 'center',
    alignItems: 'center',
    padding: 0.5,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'gray',
  },
  colorDotText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default WorkingDaysCard;
