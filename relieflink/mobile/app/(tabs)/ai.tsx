import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import { colors } from '../../constants/theme';
import {
  aiService,
  detectLanguage,
  SUGGESTED_QUESTIONS,
  type Language,
  type ChatMessage,
  type ChatAction,
  type WarningCard,
  type ShelterItem,
} from '../../services/aiAssistant';
import { levelToConfig } from '../../services/riskAnalysis';

// ─── Markdown-like text renderer ────────────────────────────

const RichText: React.FC<{ text: string; style?: any }> = ({ text, style }) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text style={style}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={i} style={[style, { fontWeight: '700', color: colors.text.white }]}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
};

// ─── Typing Indicator ──────────────────────────────────────

const TypingIndicator: React.FC = () => {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(dot, { toValue: 1, duration: 300, easing: Easing.ease, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, easing: Easing.ease, useNativeDriver: true }),
          Animated.delay(400),
        ])
      )
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);

  return (
    <View style={tStyles.row}>
      <View style={tStyles.avatar}>
        <Text style={{ fontSize: 13 }}>🤖</Text>
      </View>
      <View style={tStyles.bubble}>
        <View style={tStyles.dotsRow}>
          {dots.map((dot, i) => (
            <Animated.View
              key={i}
              style={[
                tStyles.dot,
                {
                  transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }],
                  opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
                },
              ]}
            />
          ))}
        </View>
        <Text style={tStyles.label}>ReliefLink AI is thinking...</Text>
      </View>
    </View>
  );
};

const tStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 14 },
  avatar: {
    width: 32, height: 32, borderRadius: 12,
    backgroundColor: 'rgba(40,82,255,0.12)', borderWidth: 1, borderColor: 'rgba(40,82,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  bubble: {
    backgroundColor: colors.bg.card, borderWidth: 1, borderColor: colors.border.default,
    borderRadius: 18, borderBottomLeftRadius: 4, paddingHorizontal: 16, paddingVertical: 14,
  },
  dotsRow: { flexDirection: 'row', gap: 5, marginBottom: 6 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.brand.primaryLight },
  label: { fontSize: 10, color: colors.text.tertiary, fontWeight: '500' },
});

// ─── Warning Card Component ────────────────────────────────

const WarningCardView: React.FC<{ card: WarningCard }> = ({ card }) => {
  const cfg = levelToConfig(card.severity as any);
  return (
    <View style={[wStyles.container, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <View style={[wStyles.iconWrap, { backgroundColor: cfg.solid + '22' }]}>
        <Text style={{ fontSize: 18 }}>{card.icon}</Text>
      </View>
      <View style={wStyles.textWrap}>
        <Text style={[wStyles.title, { color: cfg.text }]}>{card.title}</Text>
        <Text style={wStyles.desc}>{card.description}</Text>
      </View>
      <View style={[wStyles.badge, { backgroundColor: cfg.solid }]}>
        <Text style={wStyles.badgeText}>{card.severity.toUpperCase()}</Text>
      </View>
    </View>
  );
};

const wStyles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 12,
    borderWidth: 1, marginTop: 8, marginBottom: 4,
  },
  iconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  textWrap: { flex: 1 },
  title: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  desc: { fontSize: 11, color: colors.text.secondary, lineHeight: 16 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 8 },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
});

// ─── Shelter List Component ────────────────────────────────

const ShelterList: React.FC<{ items: ShelterItem[] }> = ({ items }) => (
  <View style={sStyles.container}>
    {items.slice(0, 5).map((item, i) => {
      const scoreColor = item.safetyScore >= 80 ? colors.severity.safe.text
        : item.safetyScore >= 60 ? colors.severity.medium.text
        : colors.severity.high.text;
      const typeIcon = item.type === 'hospital' ? '🏨' : item.type === 'shelter' ? '🏥' : item.type === 'rescue_center' ? '🚑' : '🛡️';
      return (
        <View key={i} style={sStyles.item}>
          <View style={sStyles.rank}>
            <Text style={sStyles.rankText}>#{i + 1}</Text>
          </View>
          <Text style={{ fontSize: 16, marginRight: 8 }}>{typeIcon}</Text>
          <View style={sStyles.info}>
            <Text style={sStyles.name}>{item.name}</Text>
            <Text style={sStyles.meta}>{item.distance} · {item.capacity} spots</Text>
          </View>
          <View style={[sStyles.score, { borderColor: scoreColor + '44' }]}>
            <Text style={[sStyles.scoreVal, { color: scoreColor }]}>{item.safetyScore}</Text>
          </View>
        </View>
      );
    })}
  </View>
);

const sStyles = StyleSheet.create({
  container: { marginTop: 8, gap: 6 },
  item: {
    flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: colors.border.subtle,
  },
  rank: { width: 28, alignItems: 'center', marginRight: 4 },
  rankText: { fontSize: 11, fontWeight: '700', color: colors.text.tertiary },
  info: { flex: 1 },
  name: { fontSize: 13, fontWeight: '600', color: colors.text.primary },
  meta: { fontSize: 11, color: colors.text.secondary, marginTop: 2 },
  score: { width: 36, height: 36, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  scoreVal: { fontSize: 13, fontWeight: '800' },
});

// ─── Tips List Component ───────────────────────────────────

const TipsList: React.FC<{ tips: string[] }> = ({ tips }) => (
  <View style={tipStyles.container}>
    {tips.map((tip, i) => (
      <View key={i} style={tipStyles.row}>
        <View style={tipStyles.bullet}>
          <Text style={tipStyles.bulletText}>{i + 1}</Text>
        </View>
        <Text style={tipStyles.tipText}>{tip}</Text>
      </View>
    ))}
  </View>
);

const tipStyles = StyleSheet.create({
  container: { marginTop: 8, gap: 6 },
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 4 },
  bullet: {
    width: 22, height: 22, borderRadius: 7, backgroundColor: 'rgba(40,82,255,0.12)',
    alignItems: 'center', justifyContent: 'center', marginRight: 8, marginTop: 1, flexShrink: 0,
  },
  bulletText: { fontSize: 10, fontWeight: '700', color: colors.brand.primaryLight },
  tipText: { flex: 1, fontSize: 13, color: colors.text.secondary, lineHeight: 19 },
});

// ─── Action Chips ──────────────────────────────────────────

const ActionChips: React.FC<{ actions: ChatAction[]; onPress: (a: ChatAction) => void }> = ({ actions, onPress }) => (
  <View style={chipStyles.row}>
    {actions.map((a, i) => {
      const isSOS = a.type === 'sos' || a.type === 'call';
      return (
        <TouchableOpacity
          key={i}
          style={[chipStyles.chip, isSOS && chipStyles.sosChip]}
          onPress={() => onPress(a)}
          activeOpacity={0.7}
        >
          <Text style={[chipStyles.text, isSOS && chipStyles.sosText]}>{a.label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const chipStyles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    backgroundColor: 'rgba(40,82,255,0.08)', borderWidth: 1, borderColor: 'rgba(40,82,255,0.15)',
  },
  sosChip: { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' },
  text: { fontSize: 12, fontWeight: '600', color: '#7E98FF' },
  sosText: { color: colors.severity.high.text },
});

// ─── Message Bubble ────────────────────────────────────────

const MessageBubble: React.FC<{
  message: ChatMessage;
  onAction: (a: ChatAction) => void;
  animOffset: Animated.Value;
}> = ({ message, onAction, animOffset }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const isUser = message.role === 'user';
  const isEmergency = message.isEmergency;

  return (
    <Animated.View
      style={[
        mbStyles.row,
        isUser ? mbStyles.userRow : mbStyles.aiRow,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      {!isUser && (
        <View style={mbStyles.avatar}>
          <Text style={{ fontSize: 13 }}>🤖</Text>
        </View>
      )}
      <View
        style={[
          mbStyles.bubble,
          isUser ? mbStyles.userBubble : mbStyles.aiBubble,
          isEmergency && !isUser && mbStyles.emergencyBubble,
        ]}
      >
        {/* Emergency badge */}
        {isEmergency && (
          <View style={mbStyles.emergencyBadge}>
            <Text style={mbStyles.emergencyBadgeText}>EMERGENCY RESPONSE</Text>
          </View>
        )}

        {/* Text content */}
        <RichText
          text={message.content}
          style={[mbStyles.text, isUser ? mbStyles.userText : mbStyles.aiText]}
        />

        {/* Warning card */}
        {message.warningCard && <WarningCardView card={message.warningCard} />}

        {/* Shelter list */}
        {message.shelterList && message.shelterList.length > 0 && (
          <ShelterList items={message.shelterList} />
        )}

        {/* Tips list */}
        {message.tips && message.tips.length > 0 && <TipsList tips={message.tips} />}

        {/* Action chips */}
        {message.actions && message.actions.length > 0 && (
          <ActionChips actions={message.actions} onPress={onAction} />
        )}

        {/* Timestamp */}
        <Text style={mbStyles.time}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </Animated.View>
  );
};

const mbStyles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end' },
  userRow: { justifyContent: 'flex-end' },
  aiRow: { justifyContent: 'flex-start' },
  avatar: {
    width: 32, height: 32, borderRadius: 12,
    backgroundColor: 'rgba(40,82,255,0.12)', borderWidth: 1, borderColor: 'rgba(40,82,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  bubble: { maxWidth: '82%', paddingHorizontal: 16, paddingVertical: 14 },
  userBubble: {
    backgroundColor: colors.brand.primary, borderRadius: 20, borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: colors.bg.card, borderWidth: 1, borderColor: colors.border.default,
    borderRadius: 20, borderBottomLeftRadius: 4,
  },
  emergencyBubble: {
    borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(60,10,10,0.95)',
  },
  emergencyBadge: {
    backgroundColor: colors.severity.high.solid, alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 8,
  },
  emergencyBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFF', letterSpacing: 0.8 },
  text: { fontSize: 14, lineHeight: 22 },
  userText: { color: '#FFFFFF' },
  aiText: { color: colors.text.primary },
  time: { fontSize: 10, color: 'rgba(148,163,184,0.4)', marginTop: 8, alignSelf: 'flex-end' },
});

// ─── Main Screen ───────────────────────────────────────────

export const AIAssistantScreen: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState<Language>('en');
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const scrollAnim = useRef(new Animated.Value(0)).current;

  // Initialize welcome message
  useEffect(() => {
    const welcome = aiService.getWelcomeMessage(language);
    setMessages([welcome]);
  }, []);

  // Auto-scroll on new message
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, isTyping]);

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const detectedLang = detectLanguage(text);
    setLanguage(detectedLang);
    setShowSuggestions(false);

    // Add user message
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text.trim(),
      type: 'text',
      timestamp: new Date(),
      language: detectedLang,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const aiResponse = await aiService.sendMessage(text.trim());
      setIsTyping(false);
      setMessages(prev => [...prev, aiResponse]);
    } catch {
      setIsTyping(false);
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, I encountered an error. Please try again or send an SOS if you need immediate help.',
        type: 'text',
        timestamp: new Date(),
        language: detectedLang,
        actions: [{ type: 'sos', label: '🆘 Send SOS' }],
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  }, []);

  const handleAction = useCallback((action: ChatAction) => {
    if (action.type === 'sos') {
      // In production, trigger navigation to SOS tab
      handleSend('I need emergency help');
      return;
    }
    if (action.type === 'open_safe_nav') {
      // In production, navigate to safe navigation screen
      handleSend('Show me the safe route details');
      return;
    }
    if (action.type === 'notifications') {
      handleSend('What are the latest alerts?');
      return;
    }
    if (action.type === 'call') {
      handleSend('What is the emergency number?');
      return;
    }
    // Send the action label as a message
    handleSend(action.label);
  }, [handleSend]);

  const handleSuggestionPress = useCallback((text: string) => {
    handleSend(text);
  }, [handleSend]);

  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => (
    <MessageBubble message={item} onAction={handleAction} animOffset={scrollAnim} />
  ), [handleAction]);

  const suggestions = SUGGESTED_QUESTIONS[language];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg.base} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* ─── Header ─────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Text style={{ fontSize: 16 }}>🤖</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>ReliefLink AI</Text>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Emergency Assistant</Text>
              </View>
            </View>
          </View>
          {/* Language selector */}
          <View style={styles.langRow}>
            {(['en', 'ur', 'roman_ur'] as Language[]).map(l => (
              <TouchableOpacity
                key={l}
                style={[styles.langBtn, language === l && styles.langBtnActive]}
                onPress={() => setLanguage(l)}
                activeOpacity={0.7}
              >
                <Text style={[styles.langBtnText, language === l && styles.langBtnTextActive]}>
                  {l === 'en' ? 'EN' : l === 'ur' ? 'اردو' : 'Roman'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ─── Location context bar ──────────────── */}
        <View style={styles.contextBar}>
          <View style={styles.contextDot}>
            <View style={styles.contextDotInner} />
          </View>
          <Text style={styles.contextText}>Sector G-11, Islamabad</Text>
          <View style={styles.contextBadge}>
            <Text style={styles.contextBadgeText}>MODERATE RISK</Text>
          </View>
        </View>

        {/* ─── Suggested questions ───────────────── */}
        {showSuggestions && (
          <View style={styles.suggestionsWrap}>
            <Text style={styles.suggestionsTitle}>Suggested Questions</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsInner}>
              {suggestions.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.suggestionChip}
                  onPress={() => handleSuggestionPress(s.text)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.suggestionIcon}>{s.icon}</Text>
                  <Text style={styles.suggestionText} numberOfLines={2}>{s.text}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ─── Messages ──────────────────────────── */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.msgList}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollAnim } } }],
            { useNativeDriver: false }
          )}
          ListFooterComponent={isTyping ? <TypingIndicator /> : null}
        />

        {/* ─── Input bar ─────────────────────────── */}
        <View style={styles.inputBar}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.textInput}
              value={input}
              onChangeText={setInput}
              placeholder={
                language === 'en' ? 'Ask for help...'
                  : language === 'ur' ? '...مدد کے لیے پوچھیں'
                  : 'Madad ke liye poochein...'
              }
              placeholderTextColor={colors.text.tertiary}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={() => handleSend(input)}
              blurOnSubmit={false}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={() => handleSend(input)}
            disabled={!input.trim()}
            activeOpacity={0.7}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AIAssistantScreen;

// ─── Styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.base },
  flex: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border.subtle,
    backgroundColor: colors.bg.elevated,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: 'rgba(40,82,255,0.1)', borderWidth: 1, borderColor: 'rgba(40,82,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.text.primary },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.severity.safe.solid },
  statusText: { fontSize: 11, color: colors.text.tertiary, fontWeight: '500' },

  // Language
  langRow: { flexDirection: 'row', gap: 4 },
  langBtn: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: colors.border.subtle,
  },
  langBtnActive: { backgroundColor: 'rgba(40,82,255,0.12)', borderColor: 'rgba(40,82,255,0.25)' },
  langBtnText: { fontSize: 11, fontWeight: '600', color: colors.text.tertiary },
  langBtnTextActive: { color: '#7E98FF' },

  // Context bar
  contextBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.02)', borderBottomWidth: 1, borderBottomColor: colors.border.subtle,
    gap: 8,
  },
  contextDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: 'rgba(40,82,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  contextDotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.brand.primary },
  contextText: { flex: 1, fontSize: 12, color: colors.text.secondary, fontWeight: '500' },
  contextBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    backgroundColor: colors.severity.medium.bg, borderWidth: 1, borderColor: colors.severity.medium.border,
  },
  contextBadgeText: { fontSize: 9, fontWeight: '800', color: colors.severity.medium.text, letterSpacing: 0.5 },

  // Suggestions
  suggestionsWrap: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  suggestionsTitle: {
    fontSize: 11, fontWeight: '700', color: colors.text.tertiary, textTransform: 'uppercase',
    letterSpacing: 1, paddingHorizontal: 16, marginBottom: 8,
  },
  suggestionsInner: { paddingHorizontal: 16, gap: 8 },
  suggestionChip: {
    width: 155, padding: 12, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: colors.border.default,
    marginRight: 4,
  },
  suggestionIcon: { fontSize: 18, marginBottom: 6 },
  suggestionText: { fontSize: 12, fontWeight: '500', color: colors.text.secondary, lineHeight: 17 },

  // Messages
  msgList: { padding: 16, paddingBottom: 8 },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 10,
    borderTopWidth: 1, borderTopColor: colors.border.subtle, backgroundColor: colors.bg.elevated,
  },
  inputWrap: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1,
    borderColor: colors.border.default, borderRadius: 20,
  },
  textInput: {
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: colors.text.primary, maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 16, backgroundColor: colors.brand.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#2852FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 6,
  },
  sendBtnDisabled: { opacity: 0.35 },
  sendIcon: { fontSize: 22, color: '#FFFFFF', fontWeight: '700' },
});
