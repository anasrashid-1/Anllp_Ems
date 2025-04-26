import React, {useContext, useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import COLORS from '../../constants/colors';
import {Dropdown} from 'react-native-element-dropdown';
import requestPermissions from '../../util/requestPermissions';
import Geolocation from '@react-native-community/geolocation';
import DialogComp from '../DialogComp';
import {AuthContext} from '../../store/auth-context';
import {RouteProp} from '@react-navigation/native';
import {SalesLeadData} from '../../types/salesLead';
interface SalesLeadFormData {
  firmname: string;
  groweraddress: string;
  growerreference: string;
  leadtype: string;
  growercell: string;
  areakanal: string;
  areamarla: string;
  sitelocation: string;
  latitude: string;
  longitude: string;
}

interface DialogState {
  dialogVisible: boolean;
  dialogIcon: string;
  dialogMessage: string;
}
type RootStackParamList = {
  'Add Sales Lead': {rowData?: SalesLeadData};
};

type Props = {
  route: RouteProp<RootStackParamList, 'Add Sales Lead'>;
};
const LeadType = [
  {label: 'Private', value: 'Private'},
  {label: 'Subsidised', value: 'Subsidised'},
];

const SalesLeadForm: React.FC<Props> = ({route}) => {
  const [formData, setFormData] = useState<SalesLeadFormData>({
    firmname: '',
    groweraddress: '',
    growerreference: '',
    leadtype: '',
    growercell: '',
    areakanal: '',
    areamarla: '',
    sitelocation: '',
    latitude: '',
    longitude: '',
  });

  const [dialogState, setDialogState] = useState<DialogState>({
    dialogVisible: false,
    dialogIcon: '',
    dialogMessage: '',
  });

  useEffect(() => {
    const requestPermissionAndFetchLocation = async () => {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to start tracking.',
        );
        return;
      }

      Geolocation.getCurrentPosition(
        position => {
          const {latitude, longitude} = position.coords;
          setFormData(prevFormData => ({
            ...prevFormData,
            latitude: latitude.toString(),
            longitude: longitude.toString(),
          }));
        },
        error => {
          console.error(error);
        },
        {enableHighAccuracy: true, distanceFilter: 10},
      );
    };

    requestPermissionAndFetchLocation();

    // Prefill form data if route.params exists
    if (route?.params?.rowData) {
      console.log('Prefilling form data:', route.params); // Add log to verify route.params
      const {
        firmname,
        groweraddress,
        growerreference,
        leadtype,
        growercell,
        areakanal,
        areamarla,
        sitelocation,
        latitude,
        longitude,
      } = route.params.rowData;

      setFormData(prevFormData => ({
        ...prevFormData,
        firmname: firmname.trim() || '',
        groweraddress: groweraddress.trim() || '',
        growerreference: growerreference.trim() || '',
        leadtype: leadtype || '',
        growercell: growercell || '',
        areakanal: areakanal ? areakanal.toString() : '',
        areamarla: areamarla ? areamarla.toString() : '',
        sitelocation: sitelocation || '',
        latitude: latitude ? latitude.toString() : '',
        longitude: longitude ? longitude.toString() : '',
      }));
    }
  }, [route.params]);

  const authCtx = useContext(AuthContext);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleInputChange = (field: keyof SalesLeadFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const showDialog = (message: string, icon: string = 'alert') => {
    setDialogState({
      dialogMessage: message,
      dialogVisible: true,
      dialogIcon: icon,
    });
  };

  const isFormValid = (): boolean => {
    const {
      firmname,
      groweraddress,
      growerreference,
      leadtype,
      growercell,
      areakanal,
      areamarla,
      sitelocation,
      latitude,
      longitude,
    } = formData;
    return firmname.trim() &&
      groweraddress.trim() &&
      growerreference.trim() &&
      leadtype.trim() &&
      growercell.trim() &&
      areakanal.trim() &&
      areamarla.trim() &&
      sitelocation.trim() &&
      latitude.trim() &&
      longitude.trim()
      ? true
      : false;
  };

  const handleSubmit = async () => {
    const {
      firmname,
      groweraddress,
      growerreference,
      leadtype,
      growercell,
      areakanal,
      areamarla,
      sitelocation,
      latitude,
      longitude,
    } = formData;

    // Validate required fields
    if (!isFormValid()) {
      Alert.alert('All fields are required!');
      return;
    }

    setIsSubmitting(true);

    const url = route?.params?.rowData
      ? `${authCtx.apiUrl}/saleslead/update/${route?.params?.rowData.wid}/`
      : `${authCtx.apiUrl}/saleslead/add`;
    const method = route?.params?.rowData ? 'PUT' : 'POST';
    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authCtx.token}`,
        },
        body: JSON.stringify({
          firmname: firmname.trim(),
          groweraddress: groweraddress.trim(),
          growerreference: growerreference.trim(),
          leadtype: leadtype.trim(),
          growercell: growercell.trim(),
          areakanal: areakanal ? Number(areakanal) : 0,
          areamarla: areamarla ? Number(areamarla) : 0,
          sitelocation: sitelocation.trim(),
          latitude: latitude ? Number(latitude) : 0,
          longitude: longitude ? Number(longitude) : 0,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        showDialog(
          result.message || 'Sales lead added successfully.',
          'check-circle',
        );
        setFormData({
          firmname: '',
          groweraddress: '',
          growerreference: '',
          leadtype: '',
          growercell: '',
          areakanal: '',
          areamarla: '',
          sitelocation: '',
          latitude: '',
          longitude: '',
        });
      } else {
        showDialog(result.message || 'Something went wrong.');
      }
    } catch (error: any) {
      showDialog(error.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Firm Name</Text>
        <TextInput
          style={styles.input}
          value={formData.firmname}
          onChangeText={text => handleInputChange('firmname', text)}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Grower Address</Text>
        <TextInput
          style={styles.input}
          value={formData.groweraddress}
          onChangeText={text => handleInputChange('groweraddress', text)}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Grower Reference</Text>
        <TextInput
          style={styles.input}
          value={formData.growerreference}
          onChangeText={text => handleInputChange('growerreference', text)}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Lead Type</Text>
        <Dropdown
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          data={LeadType}
          labelField="label"
          valueField="value"
          placeholder="Select Lead Type"
          value={formData.leadtype}
          onChange={item => handleInputChange('leadtype', item.value)}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Grower Phone</Text>
        <TextInput
          style={styles.input}
          keyboardType="phone-pad"
          value={formData.growercell}
          onChangeText={text => handleInputChange('growercell', text)}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Area (Kanal)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={formData.areakanal}
          onChangeText={text => handleInputChange('areakanal', text)}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Area (Marla)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={formData.areamarla}
          onChangeText={text => handleInputChange('areamarla', text)}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Site Location</Text>
        <TextInput
          style={styles.input}
          value={formData.sitelocation}
          onChangeText={text => handleInputChange('sitelocation', text)}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Latitude</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          editable={false}
          value={formData.latitude}
          onChangeText={text => handleInputChange('latitude', text)}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Longitude</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          editable={false}
          value={formData.longitude}
          onChangeText={text => handleInputChange('longitude', text)}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          (!isFormValid() || isSubmitting) && styles.disabledButton,
        ]}
        onPress={handleSubmit}
        disabled={!isFormValid() || isSubmitting}>
        <Text style={styles.submitButtonText}>
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Text>
      </TouchableOpacity>

      <DialogComp dialogState={dialogState} setDialogState={setDialogState} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.DARK_GRAY,
    padding: 10,
    fontSize: 16,
    borderRadius: 5,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: COLORS.DARK_GRAY,
    padding: 10,
    fontSize: 16,
    borderRadius: 5,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: COLORS.ACCENT_ORANGE,
    paddingVertical: 15,
    borderRadius: 5,
    marginBottom: 30,
  },
  submitButtonText: {
    color: COLORS.WHITE,
    textAlign: 'center',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: 'gray',
  },
});

export default SalesLeadForm;
