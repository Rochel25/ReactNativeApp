import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, FlatList, StyleSheet, ToastAndroid, Alert, Platform } from 'react-native';
import { Button, Modal, Portal, TextInput, Text, IconButton, MD3Colors } from 'react-native-paper';
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('enseignants.db');

interface Enseignant {
  id?: number;
  nom: string;
  tauxHoraire: number;  // Modifier le type de string à number
  nombreHeures: number; // Modifier le type de string à number
}

const MyComponent: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [nom, setNom] = useState('');
  const [tauxHoraire, setTauxHoraire] = useState('');
  const [nombreHeures, setNombreHeures] = useState('');
  const [data, setData] = useState<Enseignant[]>([]);
  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);
  const containerStyle = { backgroundColor: 'white' };
  const [editItem, setEditItem] = useState<Enseignant | null>(null);
  const [totalPrestation, setTotalPrestation] = useState<number>(0);
  const [minPrestation, setMinPrestation] = useState<number | null>(null);
  const [maxPrestation, setMaxPrestation] = useState<number | null>(null);

  const handleSave = () => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          'INSERT INTO enseignants (nom, tauxHoraire, nombreHeures) VALUES (?, ?, ?)',
          [nom, tauxHoraire, nombreHeures],
          (_, resultSet) => {
            console.log('Enseignant inséré avec succès');
            showToast('Enseignant ajouté avec succès');
            fetchData();
            hideModal();
            setNom('');
            setTauxHoraire('');
            setNombreHeures('');
          },
          (error) => {
            console.error('Erreur lors de l\'insertion de l\'enseignant', error);
            return true;  // Return true to satisfy TypeScript type requirement
          }
        );
      },
      (error) => {
        console.error('Erreur lors de la transaction', error);
      }
    );
  };

  const fetchData = () => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          'SELECT * FROM enseignants',
          [],
          (_, resultSet) => {
            const enseignants: Enseignant[] = resultSet.rows._array;
            setData(enseignants);

            // Calculer les valeurs totales, minimales et maximales
            let total = 0;
            let min = Number.MAX_VALUE;
            let max = Number.MIN_VALUE;

            enseignants.forEach((enseignant) => {
              const prestation = enseignant.tauxHoraire * enseignant.nombreHeures;
              total += prestation;
              min = Math.min(min, prestation);
              max = Math.max(max, prestation);
            });

            setTotalPrestation(total);
            setMinPrestation(min !== Number.MAX_VALUE ? min : null);
            setMaxPrestation(max !== Number.MIN_VALUE ? max : null);
          },
          (error) => {
            console.error('Erreur lors de la récupération des enseignants', error);
            return true;
          }
        );
      },
      (error) => {
        console.error('Erreur lors de la transaction', error);
      }
    );
  };

  const handleDelete = (id?: number) => {
    if (id !== undefined) {
      Alert.alert(
        'Confirmation',
        'Voulez-vous vraiment supprimer cet enseignant?',
        [
          {
            text: 'Annuler',
            style: 'cancel',
          },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: () => confirmDelete(id),
          },
        ],
        { cancelable: false }
      );
    } else {
      console.error('ID de l\'enseignant non spécifié pour la suppression');
    }
  };

  const confirmDelete = (id: number) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          'DELETE FROM enseignants WHERE id = ?',
          [id],
          (_, resultSet) => {
            console.log('Enseignant supprimé avec succès');
            showToast('Enseignant supprimé avec succès');
            fetchData();
          },
          (error) => {
            console.error('Erreur lors de la suppression de l\'enseignant', error);
            return true;
          }
        );
      },
      (error) => {
        console.error('Erreur lors de la transaction', error);
      }
    );
  };

  const handleEdit = (id?: number) => {
    if (id !== undefined) {
      const selectedEnseignant = data.find((item) => item.id === id);
      if (selectedEnseignant) {
        setNom(selectedEnseignant.nom);
        setTauxHoraire(selectedEnseignant.tauxHoraire.toString());
        setNombreHeures(selectedEnseignant.nombreHeures.toString());
        setEditItem(selectedEnseignant); // Assurez-vous que editItem est correctement mis à jour ici
        showModal();
      }
    } else {
      console.error('ID de l\'enseignant non spécifié pour la modification');
    }
  };

  const handleSaveEdit = () => {
    if (editItem && editItem.id !== undefined) {
      const { id: editItemId } = editItem; // Destructuring pour extraire id
      db.transaction(
        (tx) => {
          tx.executeSql(
            'UPDATE enseignants SET nom = ?, tauxHoraire = ?, nombreHeures = ? WHERE id = ?',
            [
              nom !== '' ? nom : null,
              tauxHoraire !== '' ? tauxHoraire : null,
              nombreHeures !== '' ? nombreHeures : null,
              editItemId,
            ],
            (_, resultSet) => {
              console.log('Enseignant modifié avec succès');
              showToast('Enseignant modifié avec succès');
              fetchData();
              hideModal();
            },
            (error) => {
              console.error('Erreur lors de la modification de l\'enseignant', error);
              return true;
            }
          );
        },
        (error) => {
          console.error('Erreur lors de la transaction', error);
        }
      );
    } else {
      console.error('ID de l\'enseignant ou données non spécifiés pour la modification');
    }
  };

  const handleActionButton = () => {
    if (editItem) {
      // Si editItem est défini, cela signifie que nous sommes en mode modification
      handleSaveEdit();
    } else {
      // Sinon, nous sommes en mode ajout
      handleSave();
    }
  };

  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Succès', message);
    }
  };


  useEffect(() => {
    const createTableAndFetchData = async () => {
      try {
        // Create the table if not exists
        await new Promise<void>((resolve, reject) => {
          db.transaction(
            (tx) => {
              tx.executeSql(
                'CREATE TABLE IF NOT EXISTS enseignants (id INTEGER PRIMARY KEY AUTOINCREMENT, nom TEXT, tauxHoraire TEXT, nombreHeures TEXT)',
                [],
                (_, resultSet) => {
                  console.log('Table enseignants créée avec succès');
                  resolve();
                },
                (error) => {
                  console.error('Erreur lors de la création de la table enseignants', error);
                  reject(error);
                  return false; // Ensure to return false to stop the transaction
                }
              );
            },
            (error) => {
              console.error('Erreur lors de la transaction de création de la table enseignants', error);
              reject(error);
              return false; // Ensure to return false to stop the transaction
            }
          );
        });
        // Fetch data after creating the table
        fetchData();
      } catch (error) {
        console.error('Une erreur s\'est produite lors de la création de la table ou de la récupération des données', error);
      }
    };
    createTableAndFetchData();
  }, []);



  return (
    <SafeAreaView>
      <Text style={{ textAlign: 'center', color: '#455a64', fontSize: 30, textDecorationLine: 'underline' }}>
        Liste des Enseignants
      </Text>
      <Button style={{ marginLeft: 0, marginBottom: 20, marginTop: 20, width: 95 }} icon="plus" mode="contained" textColor='white' onPress={() => {
        showModal();
        setNom('');
        setTauxHoraire('');
        setNombreHeures('');
        setEditItem(null);
      }} >
        Ajouter
      </Button>
      <Portal>
        <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={containerStyle}>
          <TextInput label="Nom" value={nom} onChangeText={setNom} />
          <TextInput label="Taux horaire" value={tauxHoraire} onChangeText={setTauxHoraire} />
          <TextInput label="Nombre heure" value={nombreHeures} onChangeText={setNombreHeures} />
          <Button
            theme={{ colors: { primary: '#00796b' } }}
            style={{ margin: 10, borderColor: '#00796b', alignItems: 'center', justifyContent: 'center' }}
            mode="outlined"
            onPress={handleActionButton}
          >
            {editItem ? 'Modifier' : 'Enregistrer'}
          </Button>
        </Modal>
      </Portal>
      <FlatList
        data={data}
        renderItem={({ item, index }) => (
          <View style={styles.item}>
            <Text style={styles.title}>
              <Text style={styles.boldText}>Nom :</Text> {item.nom}
            </Text>
            <Text style={styles.title}>
              <Text style={styles.boldText}>Taux horaire :</Text> {item.tauxHoraire}
            </Text>
            <Text style={styles.title}>
              <Text style={styles.boldText}>Nombre d'heures :</Text> {item.nombreHeures}
            </Text>
            <Text style={styles.title}>
              <Text style={styles.boldText}>Prestation :</Text> {item.tauxHoraire * item.nombreHeures} $
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <IconButton
                icon="delete-circle-outline"
                iconColor={MD3Colors.error50}
                size={40}
                onPress={() => handleDelete(item.id)}
              />
              <IconButton
                icon="circle-edit-outline"
                iconColor="#455a64"
                size={40}
                onPress={() => handleEdit(item.id)}
              />
            </View>

          </View>
        )}
        keyExtractor={(item) => item.id?.toString() || ''}
      />
      <View style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: '#00796b', borderRadius: 25 }}>
        <Text style={{ ...styles.title, color: 'white' }}>
          <Text style={styles.boldText}>Prestation totale : </Text>{totalPrestation} $
        </Text>
        {minPrestation !== null && (
          <Text style={{ ...styles.title, color: 'white' }}>
            <Text style={styles.boldText}>Prestation minimale : </Text>{minPrestation} $
          </Text>
        )}
        {maxPrestation !== null && (
          <Text style={{ ...styles.title, color: 'white' }}>
            <Text style={styles.boldText}>Prestation maximale : </Text>{maxPrestation} $
          </Text>
        )}
      </View>



    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  item: {
    backgroundColor: 'white',
    padding: 20,
    marginVertical: 9,
    marginHorizontal: 0,
    borderRadius: 25,
  },
  title: {
    fontSize: 18,
  },
  boldText: {
    fontWeight: 'bold',
  },
});

export default MyComponent;
