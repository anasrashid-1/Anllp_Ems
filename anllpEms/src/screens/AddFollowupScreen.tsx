import React, {useState, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import COLORS from '../constants/colors';
import {AuthContext} from '../store/auth-context';

const AddFollowupScreen: React.FC = ({route, navigation}) => {
  const {salesLead} = route.params;
  const authCtx = useContext(AuthContext);

  const [formData, setFormData] = useState({
    customerName: salesLead.firmname || '',
    dateOfFollowup: new Date(),
    followupType: '',
    discussionSummary: '',
    interestLevel: '',
    nextSteps: '',
    nextFollowupDate: new Date(),
    orderPotential: '',
    problemsRaised: '',
    salespersonName: authCtx.user?.name || '',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNextDatePicker, setShowNextDatePicker] = useState(false);

  const handleSubmit = async () => {
    try {
      const response = await fetch(`${authCtx.apiUrl}/followups/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authCtx.token}`,
        },
        body: JSON.stringify({
          ...formData,
          salesLeadId: salesLead.id,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to save follow-up');
      }

      Alert.alert('Success', 'Follow-up recorded successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Follow-up for {salesLead.firmname}</Text>

      {/* Customer Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Customer Name</Text>
        <TextInput
          style={styles.input}
          value={formData.customerName}
          editable={false}
        />
      </View>

      {/* Date of Follow-up */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Date of Follow-up</Text>
        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <TextInput
            style={styles.input}
            value={formData.dateOfFollowup.toLocaleDateString()}
            editable={false}
          />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={formData.dateOfFollowup}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) {
                setFormData({...formData, dateOfFollowup: date});
              }
            }}
          />
        )}
      </View>

      {/* Follow-up Type */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Follow-up Type</Text>
        <View style={styles.radioGroup}>
          {['Call', 'Visit', 'Email', 'Message'].map(type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.radioButton,
                formData.followupType === type && styles.radioButtonSelected,
              ]}
              onPress={() => setFormData({...formData, followupType: type})}>
              <Text
                style={[
                  styles.radioText,
                  formData.followupType === type && styles.radioTextSelected,
                ]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Discussion Summary */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Discussion Summary</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          numberOfLines={4}
          value={formData.discussionSummary}
          onChangeText={text =>
            setFormData({...formData, discussionSummary: text})
          }
        />
      </View>

      {/* Customer Interest Level */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Customer Interest Level</Text>
        <View style={styles.radioGroup}>
          {['High', 'Medium', 'Low'].map(level => (
            <TouchableOpacity
              key={level}
              style={[
                styles.radioButton,
                formData.interestLevel === level && styles.radioButtonSelected,
              ]}
              onPress={() => setFormData({...formData, interestLevel: level})}>
              <Text
                style={[
                  styles.radioText,
                  formData.interestLevel === level && styles.radioTextSelected,
                ]}>
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Next Steps */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Next Steps / Action Items</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          numberOfLines={4}
          value={formData.nextSteps}
          onChangeText={text => setFormData({...formData, nextSteps: text})}
        />
      </View>

      {/* Next Follow-up Date */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Next Follow-up Date</Text>
        <TouchableOpacity onPress={() => setShowNextDatePicker(true)}>
          <TextInput
            style={styles.input}
            value={formData.nextFollowupDate.toLocaleDateString()}
            editable={false}
          />
        </TouchableOpacity>
        {showNextDatePicker && (
          <DateTimePicker
            value={formData.nextFollowupDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowNextDatePicker(false);
              if (date) {
                setFormData({...formData, nextFollowupDate: date});
              }
            }}
          />
        )}
      </View>

      {/* Order Potential */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Order Potential</Text>
        <View style={styles.radioGroup}>
          {['Small', 'Medium', 'Large', 'Bulk Inquiry'].map(size => (
            <TouchableOpacity
              key={size}
              style={[
                styles.radioButton,
                formData.orderPotential === size && styles.radioButtonSelected,
              ]}
              onPress={() => setFormData({...formData, orderPotential: size})}>
              <Text
                style={[
                  styles.radioText,
                  formData.orderPotential === size && styles.radioTextSelected,
                ]}>
                {size}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Problems/Objections Raised */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Problems/Objections Raised</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          numberOfLines={4}
          value={formData.problemsRaised}
          onChangeText={text =>
            setFormData({...formData, problemsRaised: text})
          }
        />
      </View>

      {/* Salesperson Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Salesperson Name</Text>
        <TextInput
          style={styles.input}
          value={formData.salespersonName}
          editable={false}
        />
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Save Follow-up</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.WHITE,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: COLORS.DARK_GRAY,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: COLORS.DARK_GRAY,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.LIGHT_GRAY,
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  radioButton: {
    padding: 10,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.LIGHT_GRAY,
    borderRadius: 5,
  },
  radioButtonSelected: {
    backgroundColor: COLORS.ACCENT_ORANGE,
    borderColor: COLORS.SEMI_GRAY,
  },
  radioText: {
    color: COLORS.DARK_GRAY,
  },
  radioTextSelected: {
    color: COLORS.WHITE,
  },
  submitButton: {
    backgroundColor: COLORS.ACCENT_ORANGE,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddFollowupScreen;
