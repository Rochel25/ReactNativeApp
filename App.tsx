// App.tsx

import React from 'react';
import { View, StyleSheet} from 'react-native';
import { Provider as PaperProvider, Appbar} from 'react-native-paper';
import MyComponent from './src/Enseignant';

const theme = {
  roundness: 4,
  colors: {
    primary:  "#00796b",
    
  },
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 15,
    justifyContent: 'center',
    alignItems:"center",
    backgroundColor: '#ecf0f1', // Couleur de fond du contenu de l'écran
  },
  appBar: {
    backgroundColor: theme.colors.primary, // Couleur de fond de l'en-tête
  },
  appBarText: {
    color: '#fff', // Couleur du texte de l'en-tête
    fontWeight:'normal'
  },
});

const App: React.FC = () => {

  return (
    <PaperProvider theme={theme}>
      <Appbar.Header style={styles.appBar}>
        <Appbar.Content title="Enseignant" titleStyle={styles.appBarText} />
      </Appbar.Header>
      <View style={styles.container}>
        <MyComponent />
      </View>
    </PaperProvider>
  );
};

export default App;
