import React, {useState, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  // ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import COLORS from '../constants/colors';
import {AuthContext} from '../store/auth-context';
import {Dropdown} from 'react-native-element-dropdown';
import {SalesLeadData} from '../types/salesLead';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';
import DialogComp from '../components/DialogComp';

const followupTypeData = [
  {label: 'Call', value: 'Call'},
  {label: 'Visit', value: 'Visit'},
  {label: 'Email', value: 'Email'},
  {label: 'Message', value: 'Message'},
];

const customerInterestLevelData = [
  {label: 'High', value: 'High'},
  {label: 'Medium', value: 'Medium'},
  {label: 'Low', value: 'Low'},
];

const customerOrderPotentialData = [
  {label: 'Small', value: 'Small'},
  {label: 'Medium', value: 'Medium'},
  {label: 'Large', value: 'Large'},
  {label: 'Bulk Inquiry', value: 'Bulk Inquiry'},
];

type RootStackParamList = {
  'Add Followup': {salesLead: SalesLeadData};
  // Add other screens here
};

type AddFollowupScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Add Followup'>;
  route: RouteProp<RootStackParamList, 'Add Followup'>;
};
interface DialogState {
  dialogVisible: boolean;
  dialogIcon: string;
  dialogMessage: string;
}

const AddFollowupScreen: React.FC<AddFollowupScreenProps> = ({
  route,
  // navigation,
}) => {
  const {salesLead} = route.params;
  const authCtx = useContext(AuthContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogState, setDialogState] = useState<DialogState>({
    dialogVisible: false,
    dialogIcon: '',
    dialogMessage: '',
  });

  // Show dialog
  const showDialog = (message: string, icon: string) => {
    setDialogState({
      dialogMessage: message,
      dialogVisible: true,
      dialogIcon: icon,
    });
  };
  // State matches exactly with API request body structure and sequence
  const [formData, setFormData] = useState({
    salesLeadId: salesLead.wid,
    salespersonName: authCtx.userName || '',
    customerName: salesLead.firmname || '',
    dateOfFollowUp: new Date(),
    followUpType: '',
    discussionSummary: '',
    customerInterestLevel: '',
    nextSteps: '',
    nextFollowUpDate: new Date(),
    orderPotential: '',
    problemsOrObjections: '',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNextDatePicker, setShowNextDatePicker] = useState(false);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isFormValid = () => {
    // const {salesLead, salespersonName, customerName, dateOfFollowUp, followUpType, discussionSummary, customerInterestLevel , nextFollowUpDate , orderPotential, problemsOrObjections} = formData;
    return formData.salesLeadId &&
      formData.salespersonName &&
      formData.customerName &&
      formData.dateOfFollowUp &&
      formData.followUpType &&
      // formData.discussionSummary &&
      formData.customerInterestLevel
      ? // formData.nextFollowUpDate &&
        // formData.orderPotential &&F
        // formData.problemsOrObjections
        true
      : false;
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!isFormValid()) {
      // Alert.alert('All fields are required!');
      showDialog('All fields are required!', 'alert');
      return;
    }

    setIsSubmitting(true);

    try {
      // Payload maintains exact API sequence
      const payload = {
        salesLeadId: formData.salesLeadId,
        salespersonName: formData.salespersonName,
        customerName: formData.customerName,
        dateOfFollowUp: formatDate(formData.dateOfFollowUp),
        followUpType: formData.followUpType,
        discussionSummary: formData.discussionSummary,
        customerInterestLevel: formData.customerInterestLevel,
        nextSteps: formData.nextSteps,
        nextFollowUpDate: formatDate(formData.nextFollowUpDate),
        orderPotential: formData.orderPotential,
        problemsOrObjections: formData.problemsOrObjections,
      };

      console.log('Submitting payload:', payload);
      console.log('token', authCtx.token);

      const response = await fetch(
        `${authCtx.apiUrl}/saleslead/followup/post`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authCtx.token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      // Handle response
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        throw new Error(text || 'Invalid server response');
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || result.error || 'Follow-up submission failed',
        );
      }
      showDialog('Follow-up submitted successfully', 'Success');
      // Alert.alert(
      //   'Success',
      //   result.message || 'Follow-up submitted successfully',
      // );
      // navigation.goBack();
      formData.dateOfFollowUp = new Date();
      formData.followUpType = '';
      formData.discussionSummary = '';
      formData.customerInterestLevel = '';
      formData.nextSteps = '';
      formData.orderPotential = '';
      formData.problemsOrObjections = '';
      formData.nextFollowUpDate = new Date();
    } catch (error) {
      let errorMessage = 'Something went wrong';
      if (error instanceof Error) {
        errorMessage = error.message.startsWith('<')
          ? 'Server error occurred'
          : error.message;
      }
      showDialog(errorMessage, 'alert');
      // Alert.alert('Error', errorMessage);
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const requiredField = (text: string) => (
    <Text>
      {text} <Text style={styles.astricColor}>*</Text>
    </Text>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Add Follow-up for {salesLead.firmname}</Text>

      {/* Fields rendered in same order as API documentation */}
      {/* Customer Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{requiredField('Customer Name')}</Text>
        <TextInput
          style={styles.input}
          value={formData.customerName}
          editable={false}
        />
      </View>

      {/* Date of Follow-up */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{requiredField('Date of Follow-up')}</Text>
        <TouchableOpacity
          onPress={() => !isSubmitting && setShowDatePicker(true)}
          disabled={isSubmitting}>
          <TextInput
            style={[styles.input, isSubmitting && styles.disabledInput]}
            value={formData.dateOfFollowUp.toLocaleDateString()}
            editable={false}
          />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={formData.dateOfFollowUp}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) {
                setFormData({...formData, dateOfFollowUp: date});
              }
            }}
          />
        )}
      </View>

      {/* Follow-up Type */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{requiredField('Follow-up Type')}</Text>
        <Dropdown
          style={[styles.dropdown, isSubmitting && styles.disabledInput]}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          inputSearchStyle={styles.inputSearchStyle}
          data={followupTypeData}
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder="Select follow-up type"
          value={formData.followUpType}
          onChange={item => {
            setFormData({...formData, followUpType: item.value});
          }}
          disable={isSubmitting}
        />
      </View>

      {/* Discussion Summary */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Discussion Summary</Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            isSubmitting && styles.disabledInput,
          ]}
          multiline
          numberOfLines={4}
          value={formData.discussionSummary}
          onChangeText={text =>
            setFormData({...formData, discussionSummary: text})
          }
          editable={!isSubmitting}
        />
      </View>

      {/* Customer Interest Level */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          {requiredField('Customer Interest Level')}
        </Text>
        <Dropdown
          style={[styles.dropdown, isSubmitting && styles.disabledInput]}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          inputSearchStyle={styles.inputSearchStyle}
          data={customerInterestLevelData}
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder="Select interest level"
          value={formData.customerInterestLevel}
          onChange={item => {
            setFormData({...formData, customerInterestLevel: item.value});
          }}
          disable={isSubmitting}
        />
      </View>

      {/* Next Steps */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Next Steps / Action Items</Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            isSubmitting && styles.disabledInput,
          ]}
          multiline
          numberOfLines={4}
          value={formData.nextSteps}
          onChangeText={text => setFormData({...formData, nextSteps: text})}
          editable={!isSubmitting}
        />
      </View>

      {/* Next Follow-up Date */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Next Follow-up Date</Text>
        <TouchableOpacity
          onPress={() => !isSubmitting && setShowNextDatePicker(true)}
          disabled={isSubmitting}>
          <TextInput
            style={[styles.input, isSubmitting && styles.disabledInput]}
            value={formData.nextFollowUpDate.toLocaleDateString()}
            editable={false}
          />
        </TouchableOpacity>
        {showNextDatePicker && (
          <DateTimePicker
            value={formData.nextFollowUpDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowNextDatePicker(false);
              if (date) {
                setFormData({...formData, nextFollowUpDate: date});
              }
            }}
          />
        )}
      </View>

      {/* Order Potential */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Order Potential</Text>
        <Dropdown
          style={[styles.dropdown, isSubmitting && styles.disabledInput]}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          inputSearchStyle={styles.inputSearchStyle}
          data={customerOrderPotentialData}
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder="Select order potential"
          value={formData.orderPotential}
          onChange={item => {
            setFormData({...formData, orderPotential: item.value});
          }}
          disable={isSubmitting}
        />
      </View>

      {/* Problems/Objections Raised */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Problems/Objections Raised</Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            isSubmitting && styles.disabledInput,
          ]}
          multiline
          numberOfLines={4}
          value={formData.problemsOrObjections}
          onChangeText={text =>
            setFormData({...formData, problemsOrObjections: text})
          }
          editable={!isSubmitting}
        />
      </View>

      {/* Salesperson Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Salesperson Name</Text>
        <TextInput
          style={[styles.input, isSubmitting && styles.disabledInput]}
          value={formData.salespersonName}
          editable={false}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          isSubmitting && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={isSubmitting}>
        <Text style={styles.submitButtonText}>
          {' '}
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Text>
      </TouchableOpacity>
      {/* for dialog */}
      <DialogComp dialogState={dialogState} setDialogState={setDialogState} />
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
    color: COLORS.DARK_GRAY,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    borderRadius: 4,
    borderColor: COLORS.DARK_GRAY,
    borderWidth: 1,
    padding: 10,
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: COLORS.LIGHT_GRAY,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: COLORS.ACCENT_ORANGE,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.DARK_GRAY,
  },
  submitButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
  dropdown: {
    height: 50,
    borderColor: COLORS.DARK_GRAY,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 8,
  },
  placeholderStyle: {
    fontSize: 16,
    color: COLORS.DARK_GRAY,
  },
  selectedTextStyle: {
    fontSize: 16,
    color: COLORS.DARK_GRAY,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  astricColor: {
    color: COLORS.ACCENT_ORANGE,
  },
});

export default AddFollowupScreen;
