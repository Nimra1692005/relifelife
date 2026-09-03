import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, borderRadius, spacing } from '../../constants/theme';

/**
 * AI Assistant Chat Interface — Multi-language (EN / UR / Roman UR)
 * Premium dark-themed chat with quick action buttons
 */

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actions?: ChatAction[];
}

interface ChatAction {
  type: 'sos' | 'shelter' | 'route' | 'alert' | 'info';
  label: string;
}

interface AIChatUIProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onAction?: (action: ChatAction) => void;
  language: 'en' | 'ur' | 'roman_ur';
  onLanguageChange: (lang: 'en' | 'ur' | 'roman_ur') => void;
  isTyping?: boolean;
}

const quickActions: ChatAction[] = [
  { type: 'sos', label: '🆘 Send SOS' },
  { type: 'shelter', label: '🏥 Find Shelter' },
  { type: 'route', label: '🗺️ Safe Route' },
  { type: 'alert', label: '⚠️ Check Alerts' },
];

const languageOptions = [
  { code: 'en' as const, label: 'EN' },
  { code: 'ur' as const, label: 'اردو' },
  { code: 'roman_ur' as const, label: 'Roman' },
];

export const AIChatUI: React.FC<AIChatUIProps> = ({
  messages,
  onSendMessage,
  onAction,
  language,
  onLanguageChange,
  isTyping = false,
}) => {
  const [inputText, setInputText] = React.useState('');
  const flatListRef = React.useRef<FlatList>(null);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View
      style={[
        styles.messageRow,
        item.role === 'user' ? styles.userRow : styles.assistantRow,
      ]}
    >
      {item.role === 'assistant' && (
        <View style={styles.aiAvatar}>
          <Text style={{ fontSize: 12 }}>🤖</Text>
        </View>
      )}
      <View
        style={[
          styles.messageBubble,
          item.role === 'user' ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.role === 'user' ? styles.userText : styles.assistantText,
          ]}
        >
          {item.content}
        </Text>
        <Text style={styles.messageTime}>{item.timestamp}</Text>

        {/* Action buttons inside assistant messages */}
        {item.actions && item.actions.length > 0 && (
          <View style={styles.actionRow}>
            {item.actions.map((action, i) => (
              <TouchableOpacity
                key={i}
                style={styles.actionChip}
                onPress={() => onAction?.(action)}
                activeOpacity={0.7}
              >
                <Text style={styles.actionChipText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Language selector */}
      <View style={styles.langBar}>
        <Text style={styles.langLabel}>Language</Text>
        <View style={styles.langOptions}>
          {languageOptions.map((opt) => (
            <TouchableOpacity
              key={opt.code}
              style={[
                styles.langOption,
                language === opt.code && styles.langOptionActive,
              ]}
              onPress={() => onLanguageChange(opt.code)}
            >
              <Text
                style={[
                  styles.langOptionText,
                  language === opt.code && styles.langOptionTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.quickActions}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={quickActions}
          keyExtractor={(item) => item.type}
          contentContainerStyle={styles.quickActionsInner}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.quickActionChip}
              onPress={() => onAction?.(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.quickActionText}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          isTyping ? (
            <View style={[styles.messageRow, styles.assistantRow]}>
              <View style={styles.aiAvatar}>
                <Text style={{ fontSize: 12 }}>🤖</Text>
              </View>
              <View style={[styles.messageBubble, styles.assistantBubble]}>
                <View style={styles.typingIndicator}>
                  <View style={[styles.typingDot, styles.typingDot1]} />
                  <View style={[styles.typingDot, styles.typingDot2]} />
                  <View style={[styles.typingDot, styles.typingDot3]} />
                </View>
              </View>
            </View>
          ) : null
        }
      />

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder={
            language === 'en'
              ? 'Ask for help...'
              : language === 'ur'
                ? '...مدد کے لیے پوچھیں'
                : 'Madad ke liye poochein...'
          }
          placeholderTextColor={colors.text.tertiary}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !inputText.trim() && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim()}
          activeOpacity={0.7}
        >
          <Text style={styles.sendIcon}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },

  // Language bar
  langBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  langLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginRight: 12,
  },
  langOptions: {
    flexDirection: 'row',
    gap: 6,
  },
  langOption: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  langOptionActive: {
    backgroundColor: 'rgba(40, 82, 255, 0.15)',
    borderColor: 'rgba(40, 82, 255, 0.3)',
  },
  langOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.tertiary,
  },
  langOptionTextActive: {
    color: '#7E98FF',
  },

  // Quick actions
  quickActions: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  quickActionsInner: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: colors.border.default,
    marginRight: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.secondary,
  },

  // Messages
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-end',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(40, 82, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(40, 82, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: colors.brand.primary,
    borderBottomRightRadius: 4,
    borderRadius: borderRadius.xl,
  },
  assistantBubble: {
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderBottomLeftRadius: 4,
    borderRadius: borderRadius.xl,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: colors.text.primary,
  },
  messageTime: {
    fontSize: 10,
    color: 'rgba(148, 163, 184, 0.5)',
    marginTop: 4,
    alignSelf: 'flex-end',
  },

  // Actions in messages
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  actionChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(40, 82, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(40, 82, 255, 0.2)',
  },
  actionChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7E98FF',
  },

  // Typing indicator
  typingIndicator: {
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.text.tertiary,
  },
  typingDot1: { opacity: 0.4 },
  typingDot2: { opacity: 0.7 },
  typingDot3: { opacity: 0.4 },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 12 : 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.bg.elevated,
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text.primary,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2852FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
