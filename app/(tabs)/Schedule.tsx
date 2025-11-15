import React, { useState } from "react";
import { FlatList, SafeAreaView, TouchableOpacity, TextInput, StyleSheet, Text, View } from "react-native";

const ScheduleOnlyScreen = () => {
  const [searchText, setSearchText] = useState("");
  const [selectedTab, setSelectedTab] = useState("Schedule");

  const scheduleData = [
    { id: "1", time: "06.00", description: "Feeding 1", feedPercent: 10 },
    { id: "2", time: "09.00", description: "Feeding 2", feedPercent: 8 },
    { id: "3", time: "12.00", description: "Feeding 3", feedPercent: 5 },
    { id: "4", time: "15.00", description: "Feeding 4", feedPercent: 10 },
    { id: "5", time: "17.30", description: "Feeding 5", feedPercent: 15 },
    { id: "6", time: "20.00", description: "Feeding 6", feedPercent: 5 },
    { id: "7", time: "23.00", description: "Feeding 7", feedPercent: 3 },
    { id: "8", time: "03.00", description: "Feeding 8", feedPercent: 2 },
  ];

  // Filter data berdasarkan searchText (pada time dan description)
  const filteredData = scheduleData.filter(
    (item) =>
      item.time.includes(searchText) ||
      item.description.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
       <Text
        style={{
          fontWeight: "700",
          fontSize: 30,
          textAlign:'center',
          color: blueColor,
          marginBottom: 10,
          marginTop: 30,
        }}
      >
        SCHEDULE
      </Text> 
      <View style={styles.headerRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          value={searchText}
          onChangeText={setSearchText}
        />
        <TouchableOpacity style={styles.iconButton}>
          <Text style={{ fontSize: 24 }}>📡</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      {/* <View style={styles.tabsRow}>
        {['All', 'Schedule', 'Activity', 'Monitoring'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              selectedTab === tab && styles.tabSelected,
            ]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[
              styles.tabText,
              selectedTab === tab && { color: 'white', fontWeight: '700' },
            ]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View> */}

      {/* Result count */}
      <Text style={styles.resultText}>
        {filteredData.length < 10 ? "0" : ""}
        {filteredData.length} Result{filteredData.length !== 1 ? "s" : ""}
      </Text>

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Time</Text>
        <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Description</Text>
        <Text style={[styles.tableHeaderCell, { flex: 2 }]}>
          Feed Dispensed (%)
        </Text>
      </View>

      {/* Schedule list */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 1 }]}>{item.time}</Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>
              {item.description}
            </Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>
              {item.feedPercent}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const blueColor = "#214DE0";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D9E4F9",
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  backButton: {
    backgroundColor: "white",
    width: 40,
    height: 40,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  searchInput: {
    backgroundColor: "white",
    borderRadius: 15,
    flex: 1,
    height: 40,
    paddingHorizontal: 15,
    fontSize: 14,
  },
  iconButton: {
    backgroundColor: "#232F63",
    width: 40,
    height: 40,
    borderRadius: 15,
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  tabsRow: {
    flexDirection: "row",
    marginBottom: 15,
  },
  tab: {
    marginRight: 15,
  },
  tabSelected: {
    backgroundColor: blueColor,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2F2F2F",
  },
  resultText: {
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: blueColor,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 16,
  },
  tableHeaderCell: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
  tableRow: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginBottom: 15,
  },
  tableCell: {
    fontWeight: "600",
    fontSize: 14,
    color: blueColor,
  },
});

export default ScheduleOnlyScreen;
