import React from 'react';
import SalesLeadForm from '../components/SalesLead/SalesLeadForm';
import {RouteProp} from '@react-navigation/native';
import {SalesLeadData} from '../types/salesLead';

type RootStackParamList = {
  'Add Sales Lead': {rowData?: SalesLeadData};
};

type Props = {
  route: RouteProp<RootStackParamList, 'Add Sales Lead'>;
};

const AddSalesLead: React.FC<Props> = ({route}) => {
  return <SalesLeadForm route={route} />;
};

export default AddSalesLead;
