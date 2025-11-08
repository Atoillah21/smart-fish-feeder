import React, { useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";

import mqtt from "mqtt";

// buffer polyfill
import { Buffer } from "buffer";
global.Buffer = global.Buffer || Buffer;

const BROKER_WS = "wss://broker.emqx.io:8084/mqtt"; // EMQX websockets endpoint
const TOPIC_LEVEL = "feed/level";
const TOPIC_LAST = "feed/last";
const TOPIC_STATUS = "feed/status";
const TOPIC_MANUAL = "feed/manual";

// helper: unique client id
const makeClientId = () => `rn_feeder_${Math.floor(Math.random() * 1000000)}`;

export default function App() {
  const clientRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [level, setLevel] = useState(null); // percent number 0..100
  const [lastFeed, setLastFeed] = useState(null); // string
  const [status, setStatus] = useState("UNKNOWN");
  const [isFeeding, setIsFeeding] = useState(false);

  // connect MQTT
  useEffect(() => {
    const clientId = makeClientId();
    const opts = {
      keepalive: 30,
      clientId,
      protocolId: "MQTT",
      protocolVersion: 4,
      clean: true,
      reconnectPeriod: 4000,
      connectTimeout: 30 * 1000,
    };

    const client = mqtt.connect(BROKER_WS, opts);
    clientRef.current = client;

    client.on("connect", () => {
      console.log("[MQTT] connected");
      setConnected(true);
      // subscribe to topics
      client.subscribe(TOPIC_LEVEL, { qos: 0 }, (err) => {
        if (err) console.warn("subscribe level err", err);
      });
      client.subscribe(TOPIC_LAST, { qos: 0 }, (err) => {
        if (err) console.warn("subscribe last err", err);
      });
      client.subscribe(TOPIC_STATUS, { qos: 0 }, (err) => {
        if (err) console.warn("subscribe status err", err);
      });
    });

    client.on("reconnect", () => {
      console.log("[MQTT] reconnecting...");
      setConnected(false);
    });

    client.on("close", () => {
      console.log("[MQTT] closed");
      setConnected(false);
    });

    client.on("error", (err) => {
      console.warn("[MQTT] error", err);
    });

    client.on("message", (topic, message) => {
      // message is a Buffer
      try {
        const payload = message.toString();
        const data = JSON.parse(payload);

        if (topic === TOPIC_LEVEL && data.level !== undefined) {
          // ensure numeric
          const val = Number(data.level);
          if (!isNaN(val)) setLevel(Math.max(0, Math.min(100, val)));
        } else if (topic === TOPIC_LAST && data.last_feed) {
          setLastFeed(String(data.last_feed));
        } else if (topic === TOPIC_STATUS && data.status) {
          setStatus(String(data.status));
          // derive feeding indicator
          setIsFeeding(String(data.status).toUpperCase().includes("FEED"));
        }
      } catch (e) {
        console.warn("[MQTT] parse error", e);
      }
    });

    return () => {
      try {
        client.end(true);
      } catch (e) {}
      clientRef.current = null;
    };
  }, []);

  // publish helper
  const publish = (topic, obj) => {
    if (!clientRef.current || !connected) {
      Alert.alert("Not connected", "MQTT broker not connected yet.");
      return;
    }
    try {
      const payload = JSON.stringify(obj);
      clientRef.current.publish(topic, payload, { qos: 0, retain: false }, (err) => {
        if (err) console.warn("publish err", err);
        else console.log("Published", topic, payload);
      });
    } catch (e) {
      console.warn("publish exception", e);
    }
  };

  const onFeedNow = () => {
    // confirmation
    Alert.alert("Feed Now", "Yakin mau beri makan sekarang?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Ya",
        onPress: () => {
          // publish JSON command
          publish(TOPIC_MANUAL, { command: "ON" });
          // optimistic UI
          setIsFeeding(true);
          setTimeout(() => setIsFeeding(false), 5000); // temporary indicator
        },
      },
    ]);
  };

  // Render progress bar
  const renderProgress = () => {
    const pct = level === null ? 0 : Math.max(0, Math.min(100, level));
    return (
      <View style={styles.progressWrap}>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.levelText}>{level === null ? "---" : `${pct.toFixed(1)} %`}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Fish Feeder Dashboard</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sisa Pakan</Text>
        {renderProgress()}
      </View>

      <View style={styles.row}>
        <View style={[styles.cardHalf, { marginRight: 8 }]}>
          <Text style={styles.cardTitleSmall}>Pakan Terakhir</Text>
          <Text style={styles.valueText}>{lastFeed || "Belum tersedia"}</Text>
        </View>
        <View style={[styles.cardHalf, { marginLeft: 8 }]}>
          <Text style={styles.cardTitleSmall}>Status</Text>
          <View style={styles.statusRow}>
            <Text style={styles.valueText}>{status}</Text>
            <View style={[styles.statusDot, { backgroundColor: isFeeding ? "#f39c12" : connected ? "#2ecc71" : "#e74c3c" }]} />
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.feedButton, isFeeding ? styles.feedButtonActive : null]}
        onPress={onFeedNow}
        activeOpacity={0.8}
      >
        {isFeeding ? (
          <>
            <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.feedButtonText}>Feeding…</Text>
          </>
        ) : (
          <Text style={styles.feedButtonText}>Feed Now</Text>
        )}
      </TouchableOpacity>

      <View style={styles.meta}>
        <Text style={styles.metaText}>MQTT: {connected ? "Connected" : "Disconnected"}</Text>
        <Text style={styles.hint}>Broker: broker.emqx.io (wss)</Text>
      </View>

      <View style={{ height: 32 }} />
      <Text style={styles.footer}>Topik: {TOPIC_LEVEL}, {TOPIC_LAST}, {TOPIC_STATUS}, {TOPIC_MANUAL}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f8fa",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 36 : 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  progressWrap: {
    alignItems: "center",
  },
  progressBarBackground: {
    width: "100%",
    height: 18,
    backgroundColor: "#eee",
    borderRadius: 9,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3498db",
  },
  levelText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
  },
  row: {
    width: "100%",
    flexDirection: "row",
    marginBottom: 12,
  },
  cardHalf: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
  },
  cardTitleSmall: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  valueText: {
    fontSize: 14,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  feedButton: {
    width: "100%",
    paddingVertical: 14,
    backgroundColor: "#2d8cff",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  feedButtonActive: {
    backgroundColor: "#f39c12",
  },
  feedButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  meta: {
    width: "100%",
    marginTop: 12,
    alignItems: "center",
  },
  metaText: {
    fontSize: 13,
    color: "#666",
  },
  hint: {
    fontSize: 12,
    color: "#999",
  },
  footer: {
    fontSize: 11,
    color: "#999",
    marginTop: 12,
  },
});
