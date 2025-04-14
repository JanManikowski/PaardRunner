import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Switch, ScrollView, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar } from 'react-native-calendars';
import Toast from 'react-native-toast-message';
import { db } from '../utils/firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { CheckBox } from 'react-native-elements'; // Ensure this package is installed

const EnhancedCalendarScreen = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [numPeople, setNumPeople] = useState('');
  const [hasDerving, setHasDerving] = useState(false);
  const [notes, setNotes] = useState('');
  const [bars, setBars] = useState([]);               // Bars fetched from local storage
  const [selectedBars, setSelectedBars] = useState([]); // List of bar IDs marked as "open"
  const [orgId, setOrgId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Calculate default date based on shift rules:
  // If current time is before 8 AM, use the previous day; otherwise, use today.
  const getDefaultDate = () => {
    const now = new Date();
    if (now.getHours() < 8) {
      now.setDate(now.getDate() - 1);
    }
    // Format as YYYY-MM-DD
    return now.toISOString().split('T')[0];
  };

  // On mount, fetch active organization ID, bars from local storage,
  // and set the default selected date accordingly.
  useEffect(() => {
    const initData = async () => {
      const activeOrgId = await AsyncStorage.getItem('activeOrgId');
      if (activeOrgId) {
        setOrgId(activeOrgId);
        const storedBars = await AsyncStorage.getItem(`bars_${activeOrgId}`);
        if (storedBars) {
          setBars(JSON.parse(storedBars));
        }
        const defaultDate = getDefaultDate();
        setSelectedDate(defaultDate);
        await fetchCalendarEvent(defaultDate, activeOrgId);
      }
      setLoading(false);
    };
    initData();
  }, []);

  // Saves the current event details directly to Firebase.
  const saveCalendarEvent = async (data) => {
    if (!orgId || !selectedDate) return;
    try {
      await setDoc(
        doc(db, 'organizations', orgId, 'calendarEvents', selectedDate),
        data,
        { merge: true }
      );
      Toast.show({
        type: 'success',
        text1: 'Saved',
        text2: 'Event updated successfully.'
      });
    } catch (error) {
      console.error('Error saving event:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update event.'
      });
    }
  };

  // Fetches the event details for the selected date.
  const fetchCalendarEvent = async (date, organizationId = orgId) => {
    if (!organizationId) return;
    try {
      const docRef = doc(db, 'organizations', organizationId, 'calendarEvents', date);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setNumPeople(data.numPeople || '');
        setHasDerving(data.hasDerving || false);
        setNotes(data.notes || '');
        setSelectedBars(data.barsOpen || []);
      } else {
        // No event saved for this day; clear the fields.
        setNumPeople('');
        setHasDerving(false);
        setNotes('');
        setSelectedBars([]);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
    }
  };

  // When a user selects a day on the calendar.
  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
    fetchCalendarEvent(day.dateString);
  };

  // Update functions – update local state then save to Firebase.
  const handleNumPeopleChange = (text) => {
    setNumPeople(text);
  };

  const handleNumPeopleEndEditing = () => {
    saveCalendarEvent({
      numPeople,
      barsOpen: selectedBars,
      hasDerving,
      notes,
      timestamp: new Date().toISOString(),
    });
  };

  const handleNotesChange = (text) => {
    setNotes(text);
  };

  const handleNotesEndEditing = () => {
    saveCalendarEvent({
      numPeople,
      barsOpen: selectedBars,
      hasDerving,
      notes,
      timestamp: new Date().toISOString(),
    });
  };

  const handleToggleDerving = (value) => {
    setHasDerving(value);
    saveCalendarEvent({
      numPeople,
      barsOpen: selectedBars,
      hasDerving: value,
      notes,
      timestamp: new Date().toISOString(),
    });
  };

  // Toggles the selection state for a bar.
  const toggleBarSelection = (barId) => {
    const updatedSelection = selectedBars.includes(barId)
      ? selectedBars.filter((id) => id !== barId)
      : [...selectedBars, barId];
    setSelectedBars(updatedSelection);
    saveCalendarEvent({
      numPeople,
      barsOpen: updatedSelection,
      hasDerving,
      notes,
      timestamp: new Date().toISOString(),
    });
  };

  // Renders each bar as a checkbox.
  const renderBarItem = ({ item }) => {
    const isSelected = selectedBars.includes(item.id);
    return (
      <View style={styles.checkItem}>
        <CheckBox
          title={item.name}
          checked={isSelected}
          onPress={() => toggleBarSelection(item.id)}
          containerStyle={styles.checkBoxContainer}
          textStyle={styles.checkBoxText}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Calendar Event Settings</Text>
      
      <Calendar
        onDayPress={onDayPress}
        markedDates={{
          [selectedDate]: { selected: true, selectedColor: '#0d6efd' },
        }}
        style={styles.calendar}
        theme={{
          calendarBackground: '#121212',
          textSectionTitleColor: '#ffffff',
          selectedDayBackgroundColor: '#0d6efd',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#0d6efd',
          dayTextColor: '#d3d3d3',
          textDisabledColor: '#8e8e8e',
          dotColor: '#0d6efd',
          selectedDotColor: '#ffffff',
          arrowColor: '#ffffff',
          monthTextColor: '#ffffff',
          indicatorColor: '#ffffff',
          textDayFontFamily: 'Helvetica',
          textMonthFontFamily: 'Helvetica',
          textDayHeaderFontFamily: 'Helvetica',
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '300',
        }}
      />

      <View style={styles.card}>
        <Text style={styles.label}>Aantal Mensen (Number of People):</Text>
        <TextInput
          style={styles.input}
          value={numPeople}
          keyboardType="numeric"
          onChangeText={handleNumPeopleChange}
          onEndEditing={handleNumPeopleEndEditing}
          placeholder="Enter number of people"
          placeholderTextColor="#aaa"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Open Bars:</Text>
        {bars.length > 0 ? (
          <FlatList 
            data={bars}
            keyExtractor={(item) => item.id}
            renderItem={renderBarItem}
          />
        ) : (
          <Text style={styles.emptyText}>No bars available.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Derving (Loss/Shrinkage):</Text>
        <Switch value={hasDerving} onValueChange={handleToggleDerving} />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Notes for Next Shift:</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={handleNotesChange}
          onEndEditing={handleNotesEndEditing}
          placeholder='e.g., "0.0 is achter op, alle barren behalve balkon 2 en kleine zaal hebben 0.0"'
          placeholderTextColor="#aaa"
          multiline
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  calendar: {
    borderRadius: 8,
    marginBottom: 16,
    // Dark-themed shadow/elevation
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#cccccc',
  },
  input: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#ffffff',
    backgroundColor: '#2c2c2c',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  checkItem: {
    marginBottom: 8,
  },
  checkBoxContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
  },
  checkBoxText: {
    fontSize: 16,
    color: '#ffffff',
  },
  emptyText: {
    color: '#aaa',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default EnhancedCalendarScreen;
