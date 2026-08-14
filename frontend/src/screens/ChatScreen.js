import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

// Local display copy of the conversation. `history` (the LLM provider's own message shape)
// is kept separately and resent each turn — see backend/src/routes/chat.js for why there's
// no Message table. Reachable only while logged in; the backend derives the user from the
// session token, never from anything this screen sends.
export default function ChatScreen() {
  const { logout } = useAuth();
  const [messages, setMessages] = useState([
    { id: 'welcome', role: 'model', text: 'Hola, soy Dr Longa, tu asistente de salud de Sanito. Cuéntame cómo te sientes o qué medicamentos tomas.' },
  ]);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text }]);
    setInput('');
    setSending(true);
    try {
      const result = await api.sendChatMessage(text, history);
      setHistory(result.history);
      setMessages((prev) => [...prev, { id: `m-${Date.now()}`, role: 'model', text: result.reply }]);
    } catch (err) {
      if (err.status === 401) {
        await logout(); // session expired/revoked — back to the login screen
      } else {
        setMessages((prev) => [...prev, { id: `e-${Date.now()}`, role: 'model', text: `⚠️ ${err.message}` }]);
      }
    } finally {
      setSending(false);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
      <DisclaimerBanner />
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === 'user' ? styles.bubbleUser : styles.bubbleModel]}>
            <Text style={item.role === 'user' ? styles.bubbleTextUser : styles.bubbleText}>{item.text}</Text>
          </View>
        )}
      />
      {sending && <ActivityIndicator style={{ marginBottom: 4 }} />}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Escribe un mensaje..."
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={send} disabled={sending}>
          <Text style={styles.sendText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  list: { padding: 12, gap: 8 },
  bubble: { maxWidth: '80%', borderRadius: 12, padding: 10, marginBottom: 4 },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: '#2563EB' },
  bubbleModel: { alignSelf: 'flex-start', backgroundColor: '#F3F4F6' },
  bubbleText: { color: '#111827' },
  bubbleTextUser: { color: '#fff' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 120,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: '#2563EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendText: { color: '#fff', fontWeight: '600' },
});
