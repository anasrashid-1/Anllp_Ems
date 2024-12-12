import { DefaultTheme } from 'react-native-paper';

const customTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: 'gray',
    accent: '',      
    background: 'white', 
    text: 'black',   
    placeholder: '#B0B0B0', 
    surface: 'white', 
  },
};

export default customTheme;
