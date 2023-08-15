import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, Text, Image, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { db } from '../../firebaseConfig';
import { MaterialIcons } from '@expo/vector-icons';

export default function Search() {
  const [searchTerm, setSearchTerm] = useState('');
  const [therapists, setTherapists] = useState([]);
  const [searchCompleted, setSearchCompleted] = useState(false);
  
  let debounceSearch = null;

  // Search therapist, compare the input with name in firestore db
  const handleSearch = async (exact = false) => {
    if (!searchTerm) return;

    const therapistsRef = collection(db, 'therapists');
    let q;
    if (exact) { // If an exact match is required (when user click return after input)
      q = query(therapistsRef, where('name_lowercase', '==', searchTerm.toLowerCase()));
    } else { 
      // If an exact match isn't required (when user is still doing the input and doesn'y click return on keyboard)
      // Partial conatains is ok. (not an exact match)
      q = query(
        therapistsRef,
        where('name_lowercase', '>=', searchTerm.toLowerCase()),
        where('name_lowercase', '<=', searchTerm.toLowerCase() + '\uf8ff')
      );
    }

    const querySnapshot = await getDocs(q);
    const therapistsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    setTherapists(therapistsData);
    setSearchCompleted(true);
};


  useEffect(() => {
    if (searchTerm) { // If there is a search term in the search box
      setSearchCompleted(false); 
      clearTimeout(debounceSearch);
      debounceSearch = setTimeout(() => handleSearch(false), 500); // 500 milliseconds delay
      return () => clearTimeout(debounceSearch);
    } else { // If there is no search term in the search box
      //Clears the displayed list of therapists when the user clears the search input
      setTherapists([]);
      setSearchCompleted(false); 
    }
  }, [searchTerm]);

  //reset the state (clear search term and therapists list) when the Search screen goes out of focus
  useFocusEffect(
    React.useCallback(() => {
      // This cleanup function will run when the screen goes out of focus
      return () => {
        setSearchTerm('');
        setTherapists([]);
      };
    }, [])
  );

  // Share function
  const handleShare = () => {
    Share.share({
      message: 'I think you\'d love Diall. Here is an invite to get the app: https://apps.apple.com/app/apple-store/id6446042096',
      title: 'Diall App',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <TextInput 
            style={styles.searchBox}
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Find a therapist..."
            onSubmitEditing={() => handleSearch(true)}
          />
          <MaterialIcons // X delete button
            name="close"
            size={24}
            color="black"
            style={styles.deleteIcon}
            onPress={() => setSearchTerm('')}
          />
        </View>
        
        {!searchTerm && // Guide text under search bar
          <View style={styles.guideContainer}>
            <Text style={styles.guideText}>Type in the search bar to find a therapist that's right for you</Text>
          </View>
        }

        {searchCompleted && !therapists.length && ( // invite
          <View style={styles.inviteContainer}>
            <Text style={styles.inviteText}>Don't see your therapist?</Text>
            <TouchableOpacity style={styles.inviteButton} onPress={handleShare}>
              <Text style={styles.inviteButtonText}>Invite your therapist</Text>
            </TouchableOpacity>
          </View>
        )}

        <FlatList // Therapist's data fetching back
          data={therapists}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.therapistCard}>
              <Image source={{ uri: item.photoUrl }} style={styles.therapistImage} />
              <View style={styles.therapistInfoContent}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.therapistUsername}>@{item.username}</Text>
                  <MaterialIcons name="verified" size={24} color="black" />
                </View>
                <Text style={styles.therapistKeywords}>
                  {item.keywords.slice(0, 3).join(', ')}
                </Text>
              </View>

              <TouchableOpacity style={styles.askButton} onPress={() => { /* jump to ask page */ }}>
                <Text style={styles.askButtonText}>Ask</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8
  },

  // Search bar
  searchContainer: {
    flexDirection: 'row',
    height: 50,
    alignItems: 'center',
    backgroundColor: '#E5E5E5',
    borderRadius: 50 
  },
  searchBox: {
    flex: 1,
    height: '100%',
    paddingLeft: 50,
    borderRadius: 20,
    fontSize: 15
  },
  deleteIcon: {
    marginRight: 10
  },

  // Guide text under search bar
  guideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  guideText: {
    fontSize: 18,
    color: 'gray',
    textAlign: 'center'
  },

  // Therapist card
  therapistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    marginBottom: 20
  },
  therapistImage: {
    width: '15%',
    aspectRatio: 1,
    borderRadius: 25,
    marginRight: 5
  },
  therapistInfoContent: {
    width: '60%',
    justifyContent: 'center'
  },
  therapistUsername: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333'
  },
  therapistKeywords: {
    fontSize: 14,
    color: '#666'
  },

  // Ask button
  askButton: {
    backgroundColor: '#9ACD32',
    paddingVertical: 10,  
    paddingHorizontal: 20, 
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,  
    width: '20%'
  },
  askButtonText: {
    color: 'white',
    fontWeight: 'bold'
  },

  // Invite a therapist if you don't find one
  inviteContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  inviteText: {
    color: 'gray',
    fontSize: 18
  },
  inviteButton: {
    backgroundColor: '#9ACD32',
    marginTop: 30,
    paddingVertical: 10,
    paddingHorizontal: 25, 
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 10,
    width: 'auto'
  },
  inviteButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center', 
    width: 200
  }
});

