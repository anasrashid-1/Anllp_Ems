import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserGroupIcon, HomeIcon, ChartBarIcon, ClipboardDocumentListIcon} from 'react-native-heroicons/solid';
import { RootStackParamList } from '../../../routes/Authenticated/AuthenticatedRoutes';

interface TabProps {
  icon: 'UserGroupIcon' | 'ChartBarIcon' | 'ClipboardDocumentListIcon' | 'menu'; 
  name: string;
  route: keyof RootStackParamList;
  toggleModal: () => void;
}

const Tab: React.FC<TabProps> = ({ icon, name, route, toggleModal }) => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  // Choose default icon if no icon is passed
  const renderIcon = () => {
    if (!icon) {
      return <HomeIcon size={26} color="gray" />; 
    }
    switch (icon) {
      case 'UserGroupIcon':
        return <UserGroupIcon size={26} color="gray" />;
      case 'ChartBarIcon':
        return <ChartBarIcon size={26} color="gray" />;
      case 'ClipboardDocumentListIcon':
        return <ClipboardDocumentListIcon size={26} color="gray" />;
      default:
        return <HomeIcon size={26} color="gray" />;
    }
  };

  return (
    <Pressable
      android_ripple={{ color: 'gray' }}
      style={styles.optionButton}
      onPress={() => {
        !route ? console.log('clicked', route) : navigation.navigate(route);
        toggleModal();
      }}
    >
      {renderIcon()}
      <Text style={styles.optionText}>{name}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  optionButton: {
    height: 50,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  optionText: {
    color: 'gray',
  },
});

export default Tab;
